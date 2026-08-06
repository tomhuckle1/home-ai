-- Move the document→timeline entry from creation-time to confirm-time.
--
-- `log_document_added` (migration 7) fired on INSERT into documents — but
-- a document row is inserted the moment a photo is captured, before AI
-- extraction or the user's review happens. That put a junk timeline entry
-- ("Other", dated today, no cost) on every scan, including ones the user
-- never finished reviewing or abandoned entirely. A document only means
-- something for the timeline once it's been reviewed and confirmed
-- (extraction_status = 'completed'), so log it then instead — and keep the
-- entry in sync if the user edits the confirmed document afterwards
-- (upsert keyed by related_document_id, not by document identity alone).

drop trigger if exists on_document_added_log_timeline on public.documents;
drop function if exists public.log_document_added();

create or replace function public.sync_document_timeline_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  computed_title text;
begin
  if new.extraction_status <> 'completed' then
    return new;
  end if;

  computed_title := coalesce(
    nullif(new.product_description, ''),
    nullif(new.original_filename, ''),
    initcap(replace(new.document_type::text, '_', ' '))
  );

  update public.timeline_events
  set
    title = computed_title,
    event_date = coalesce(new.document_date, event_date),
    cost = new.amount
  where related_document_id = new.id;

  if not found then
    insert into public.timeline_events (
      property_id, event_type, title, event_date, related_document_id, cost, created_by
    )
    values (
      new.property_id,
      'document_added',
      computed_title,
      coalesce(new.document_date, current_date),
      new.id,
      new.amount,
      new.uploaded_by
    );
  end if;

  return new;
end;
$$;

-- Fires only when the UPDATE actually touches one of these columns —
-- e.g. `handleSaveAsItem`'s asset_id-only update never triggers this.
create trigger on_document_confirmed_log_timeline
  after update of extraction_status, product_description, original_filename, document_type, document_date, amount
  on public.documents
  for each row execute function public.sync_document_timeline_event();
