-- Free tier gets one AI assistant question, ever, as a taste of the
-- Premium feature — decided in response to a direct product question
-- ("should the free plan include maybe one AI question?"). Deliberately
-- lifetime-per-household, not a monthly allowance, to keep the enforcement
-- simple; can be revisited if a recurring free question is wanted instead.
create or replace function public.has_used_free_ai_question(_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.ai_messages m
    join public.ai_conversations c on c.id = m.conversation_id
    join public.properties p on p.id = c.property_id
    where p.household_id = _household_id
      and m.role = 'user'
  );
$$;
