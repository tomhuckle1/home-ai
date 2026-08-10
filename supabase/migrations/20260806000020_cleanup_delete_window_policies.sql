-- Cleanup: migration 17 removed the 30-minute delete window by adding new
-- unrestricted DELETE policies (`assets_delete_own`, etc. by way of "Users
-- can delete own X" policies), but its DROP POLICY IF EXISTS statements
-- referenced the wrong policy names, so they silently no-opped. The
-- restrictive `*_delete_within_window` policies from migration 13 were
-- left orphaned on the tables.
--
-- This was harmless in practice — Postgres OR's multiple permissive
-- policies for the same command together, so the new unrestricted policy
-- already granted delete access regardless. This migration just removes
-- the dead policies so `pg_policies` reflects reality.

drop policy if exists "rooms_delete_within_window" on public.rooms;
drop policy if exists "assets_delete_within_window" on public.assets;
drop policy if exists "documents_delete_within_window" on public.documents;
drop policy if exists "timeline_events_delete_within_window" on public.timeline_events;
