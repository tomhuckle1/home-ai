-- Home Memory: Row Level Security
-- Phase 1 foundation migration 4/4
-- Every table gets RLS enabled here; nothing is left to a later migration.
-- See docs/planning/03-database-schema.md §3 for the strategy.

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.properties enable row level security;
alter table public.rooms enable row level security;
alter table public.assets enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.contractors enable row level security;
alter table public.maintenance_tasks enable row level security;
alter table public.maintenance_completions enable row level security;
alter table public.timeline_events enable row level security;
alter table public.home_health_scores enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.subscriptions enable row level security;
alter table public.passport_shares enable row level security;
alter table public.notification_log enable row level security;

-- ---------------------------------------------------------------------
-- profiles: a user manages their own profile only
-- ---------------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- ---------------------------------------------------------------------
-- households: visible to members; mutable by the owner
-- (row creation happens only via the security-definer handle_new_user
-- trigger — no client-facing insert policy in v1)
-- ---------------------------------------------------------------------
create policy "households_select_member" on public.households
  for select using (public.is_household_member(id));
create policy "households_update_owner" on public.households
  for update using (public.is_household_owner(id));

-- ---------------------------------------------------------------------
-- household_members: visible to fellow members; managed by the owner
-- ---------------------------------------------------------------------
create policy "household_members_select_member" on public.household_members
  for select using (public.is_household_member(household_id));
create policy "household_members_insert_owner" on public.household_members
  for insert with check (public.is_household_owner(household_id));
create policy "household_members_update_owner" on public.household_members
  for update using (public.is_household_owner(household_id));
create policy "household_members_delete_owner" on public.household_members
  for delete using (public.is_household_owner(household_id));

-- ---------------------------------------------------------------------
-- properties
-- ---------------------------------------------------------------------
create policy "properties_select_member" on public.properties
  for select using (public.is_household_member(household_id));
create policy "properties_insert_member" on public.properties
  for insert with check (public.is_household_member(household_id));
create policy "properties_update_member" on public.properties
  for update using (public.is_household_member(household_id));
create policy "properties_delete_owner" on public.properties
  for delete using (public.is_household_owner(household_id));

-- ---------------------------------------------------------------------
-- Generic property-scoped tables: rooms, assets, documents, contractors,
-- maintenance_tasks, timeline_events — readable/writable by any household
-- member with access to the property; deletion also member-level (v1 has
-- no per-row ownership finer than household membership).
-- ---------------------------------------------------------------------
create policy "rooms_all_member" on public.rooms
  for all using (public.can_access_property(property_id))
  with check (public.can_access_property(property_id));

create policy "assets_all_member" on public.assets
  for all using (public.can_access_property(property_id))
  with check (public.can_access_property(property_id));

create policy "documents_all_member" on public.documents
  for all using (public.can_access_property(property_id))
  with check (public.can_access_property(property_id));

create policy "document_chunks_all_member" on public.document_chunks
  for all using (public.can_access_property(property_id))
  with check (public.can_access_property(property_id));

create policy "contractors_all_member" on public.contractors
  for all using (public.can_access_property(property_id))
  with check (public.can_access_property(property_id));

create policy "maintenance_tasks_all_member" on public.maintenance_tasks
  for all using (public.can_access_property(property_id))
  with check (public.can_access_property(property_id));

create policy "maintenance_completions_all_member" on public.maintenance_completions
  for all using (public.can_access_property(property_id))
  with check (public.can_access_property(property_id));

create policy "timeline_events_all_member" on public.timeline_events
  for all using (public.can_access_property(property_id))
  with check (public.can_access_property(property_id));

-- ---------------------------------------------------------------------
-- home_health_scores: read-only to clients; written only by the
-- compute-health-score Edge Function under the service role (which
-- bypasses RLS), so no insert/update/delete policy exists for authenticated
-- users.
-- ---------------------------------------------------------------------
create policy "home_health_scores_select_member" on public.home_health_scores
  for select using (public.can_access_property(property_id));

-- ---------------------------------------------------------------------
-- AI assistant conversations + messages
-- ---------------------------------------------------------------------
create policy "ai_conversations_all_member" on public.ai_conversations
  for all using (public.can_access_property(property_id))
  with check (public.can_access_property(property_id));

create policy "ai_messages_all_member" on public.ai_messages
  for all using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = ai_messages.conversation_id
        and public.can_access_property(c.property_id)
    )
  )
  with check (
    exists (
      select 1 from public.ai_conversations c
      where c.id = ai_messages.conversation_id
        and public.can_access_property(c.property_id)
    )
  );

-- ---------------------------------------------------------------------
-- subscriptions: read-only to household members; written only by the
-- revenuecat-webhook Edge Function under the service role.
-- ---------------------------------------------------------------------
create policy "subscriptions_select_member" on public.subscriptions
  for select using (public.is_household_member(household_id));

-- ---------------------------------------------------------------------
-- passport_shares: household members can create/view/revoke; deletion of
-- the underlying property already cascades these away.
-- ---------------------------------------------------------------------
create policy "passport_shares_all_member" on public.passport_shares
  for all using (public.can_access_property(property_id))
  with check (public.can_access_property(property_id));

-- ---------------------------------------------------------------------
-- notification_log: a user sees only their own delivery history
-- ---------------------------------------------------------------------
create policy "notification_log_select_own" on public.notification_log
  for select using (user_id = auth.uid());
