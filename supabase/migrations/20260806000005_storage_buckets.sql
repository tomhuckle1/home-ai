-- Home Memory: Storage buckets and RLS
-- Phase 2: capture needs somewhere to put photos/documents.
-- Objects are stored at "<property_id>/<uuid>.<ext>" so RLS can check
-- household membership from the path alone via storage.foldername().

insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "property_photos_household_access" on storage.objects
  for all using (
    bucket_id = 'property-photos'
    and public.can_access_property(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'property-photos'
    and public.can_access_property(((storage.foldername(name))[1])::uuid)
  );

create policy "documents_household_access" on storage.objects
  for all using (
    bucket_id = 'documents'
    and public.can_access_property(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'documents'
    and public.can_access_property(((storage.foldername(name))[1])::uuid)
  );
