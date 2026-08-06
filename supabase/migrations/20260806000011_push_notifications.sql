-- Push notifications for maintenance reminders — see docs/planning P3/T7:
-- reminders are meant to be the retention engine and are explicitly
-- required to fire via push even for users who never reopen the app, not
-- just show passively on the Home tab (the only thing that existed until
-- now).

create table public.push_tokens (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now()
);

create index push_tokens_user_id_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

create policy "push_tokens_all_own" on public.push_tokens
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- `notification_log` (migration 2) already exists for exactly this —
-- it just had nothing writing to it. The scheduled sender (service role,
-- so RLS's select-only-own policy doesn't block its inserts) checks it to
-- avoid re-notifying for a task more than once a day.
