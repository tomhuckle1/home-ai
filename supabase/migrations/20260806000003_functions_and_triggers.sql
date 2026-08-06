-- Home Memory: functions and triggers
-- Phase 1 foundation migration 3/4

-- ---------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.households
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.properties
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.rooms
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.assets
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.documents
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.contractors
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.maintenance_tasks
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.ai_conversations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- New user provisioning: profile + personal household + free subscription
-- See docs/planning/02-architecture.md §10 for the "household of one" decision.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');

  insert into public.households (name, owner_id)
  values ('My Home', new.id)
  returning id into new_household_id;

  insert into public.household_members (household_id, user_id, role, status, joined_at)
  values (new_household_id, new.id, 'owner', 'active', now());

  insert into public.subscriptions (household_id, entitlement, status)
  values (new_household_id, 'free', 'active');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- RLS helper functions (security definer to avoid recursive-policy issues)
-- ---------------------------------------------------------------------
create or replace function public.is_household_member(_household_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = _household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
  );
$$;

create or replace function public.is_household_owner(_household_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = _household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and hm.role = 'owner'
  );
$$;

create or replace function public.can_access_property(_property_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.properties p
    join public.household_members hm on hm.household_id = p.household_id
    where p.id = _property_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
  );
$$;

create or replace function public.can_manage_property(_property_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.properties p
    join public.household_members hm on hm.household_id = p.household_id
    where p.id = _property_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and hm.role = 'owner'
  );
$$;
