-- ---------------------------------------------------------------------
-- AI usage tracking — roadmap risk T2/T5 ("cost dashboard: OpenAI +
-- Supabase spend per active property"). There's no external dashboard
-- infra to wire up, so this is the buildable version: every OpenAI call
-- an Edge Function makes records its token usage here, and a view turns
-- that into a rough £ estimate queryable from Supabase Studio.
--
-- Estimates only — OPENAI_PRICING_GBP_PER_1K below has to be kept in
-- sync with actual OpenAI pricing by hand; it is not fetched live.
-- ---------------------------------------------------------------------

create table public.ai_usage_events (
  id uuid primary key default extensions.gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  property_id uuid references public.properties (id) on delete set null,
  kind text not null check (kind in ('document_extraction', 'embedding', 'ai_assistant')),
  model text not null,
  prompt_tokens int not null default 0,
  completion_tokens int not null default 0,
  total_tokens int not null default 0,
  created_at timestamptz not null default now()
);

create index ai_usage_events_household_id_idx on public.ai_usage_events (household_id, created_at);

alter table public.ai_usage_events enable row level security;

-- Any active member can log usage (the Edge Functions run under the
-- calling member's own JWT, not a service role) — but cost visibility
-- is an owner concern, so only owners can read it back.
create policy "ai_usage_events_insert_member" on public.ai_usage_events
  for insert
  with check (public.is_household_member(household_id));

create policy "ai_usage_events_select_owner" on public.ai_usage_events
  for select
  using (public.is_household_owner(household_id));

-- Approximate OpenAI pricing in GBP per 1,000 tokens, as of the models
-- this app uses (gpt-4o-mini for chat/vision, text-embedding-3-small for
-- embeddings). Update this if OpenAI's pricing or the configured models
-- change — see OPENAI_CHAT_MODEL / OPENAI_VISION_MODEL env vars.
-- security_invoker is required here: without it, the view would run with
-- the view owner's privileges and silently bypass ai_usage_events' RLS,
-- letting any authenticated caller read every household's usage.
create or replace view public.household_ai_usage_monthly
with (security_invoker = true) as
select
  household_id,
  date_trunc('month', created_at) as month,
  kind,
  model,
  count(*) as call_count,
  sum(prompt_tokens) as prompt_tokens,
  sum(completion_tokens) as completion_tokens,
  sum(total_tokens) as total_tokens,
  round(
    (
      sum(prompt_tokens) * case
        when model like 'gpt-4o-mini%' then 0.00012
        when model like 'text-embedding-3-small%' then 0.00002
        else 0.0005
      end
      + sum(completion_tokens) * case
        when model like 'gpt-4o-mini%' then 0.00048
        else 0.0015
      end
    )::numeric,
    4
  ) as estimated_cost_gbp
from public.ai_usage_events
group by household_id, date_trunc('month', created_at), kind, model;
