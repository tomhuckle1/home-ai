-- Extends notification_log (migration 2) to also dedupe warranty/document
-- expiry pushes, the same way it already dedupes maintenance reminders —
-- see send-maintenance-reminders, which now also warns about upcoming
-- warranty expiries (assets.warranty_expiry) and document expiry dates
-- (documents.expiry_date — EPC, gas safety, insurance, FENSA etc.), not
-- just maintenance tasks.
alter table public.notification_log add column asset_id uuid references public.assets (id) on delete cascade;
alter table public.notification_log add column document_id uuid references public.documents (id) on delete cascade;
