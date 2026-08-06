-- 30-minute delete window: a household member can undo their own recent
-- mistake, but nobody — including a family member added later, or anyone
-- who inherits access to a shared property — can go back and wipe
-- historical records. Enforced here, not just in the UI, since that's
-- the only place it can't be bypassed.
--
-- Splits each previously-blanket "_all_member" policy into per-command
-- policies so DELETE alone can carry the extra time check — a single
-- FOR ALL policy has no way to apply a condition to just one command.

drop policy if exists "rooms_all_member" on public.rooms;
create policy "rooms_select_member" on public.rooms
  for select using (public.can_access_property(property_id));
create policy "rooms_insert_member" on public.rooms
  for insert with check (public.can_access_property(property_id));
create policy "rooms_update_member" on public.rooms
  for update using (public.can_access_property(property_id)) with check (public.can_access_property(property_id));
create policy "rooms_delete_within_window" on public.rooms
  for delete using (public.can_access_property(property_id) and created_at > now() - interval '30 minutes');

drop policy if exists "assets_all_member" on public.assets;
create policy "assets_select_member" on public.assets
  for select using (public.can_access_property(property_id));
create policy "assets_insert_member" on public.assets
  for insert with check (public.can_access_property(property_id));
create policy "assets_update_member" on public.assets
  for update using (public.can_access_property(property_id)) with check (public.can_access_property(property_id));
create policy "assets_delete_within_window" on public.assets
  for delete using (public.can_access_property(property_id) and created_at > now() - interval '30 minutes');

drop policy if exists "documents_all_member" on public.documents;
create policy "documents_select_member" on public.documents
  for select using (public.can_access_property(property_id));
create policy "documents_insert_member" on public.documents
  for insert with check (public.can_access_property(property_id));
create policy "documents_update_member" on public.documents
  for update using (public.can_access_property(property_id)) with check (public.can_access_property(property_id));
create policy "documents_delete_within_window" on public.documents
  for delete using (public.can_access_property(property_id) and created_at > now() - interval '30 minutes');

drop policy if exists "timeline_events_all_member" on public.timeline_events;
create policy "timeline_events_select_member" on public.timeline_events
  for select using (public.can_access_property(property_id));
create policy "timeline_events_insert_member" on public.timeline_events
  for insert with check (public.can_access_property(property_id));
create policy "timeline_events_update_member" on public.timeline_events
  for update using (public.can_access_property(property_id)) with check (public.can_access_property(property_id));
create policy "timeline_events_delete_within_window" on public.timeline_events
  for delete using (public.can_access_property(property_id) and created_at > now() - interval '30 minutes');
