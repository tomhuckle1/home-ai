-- Home Memory: Phase 4 — free/premium entitlement enforcement.
-- Per the pricing model: Free = 1 property, capped documents, basic
-- reminders only. Premium = unlimited documents, AI assistant, family
-- sharing, Home Health Score, Home Passport. These limits are enforced
-- here (and in the relevant Edge Functions) — not just hidden in the UI,
-- per decision D6.

create or replace function public.household_entitlement(_household_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select entitlement from public.subscriptions
     where household_id = _household_id and status in ('trialing', 'active')),
    'free'
  );
$$;

create or replace function public.is_premium(_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.household_entitlement(_household_id) <> 'free';
$$;

-- ---------------------------------------------------------------------
-- Free tier: 1 property per household.
-- ---------------------------------------------------------------------
create or replace function public.enforce_property_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_count int;
begin
  if public.is_premium(new.household_id) then
    return new;
  end if;

  select count(*) into existing_count from public.properties where household_id = new.household_id;
  if existing_count >= 1 then
    raise exception 'free_tier_property_limit' using hint = 'Upgrade to Premium to add more than one property.';
  end if;

  return new;
end;
$$;

create trigger enforce_property_limit_trigger
  before insert on public.properties
  for each row execute function public.enforce_property_limit();

-- ---------------------------------------------------------------------
-- Free tier: capped documents per household (across all its properties).
-- ---------------------------------------------------------------------
create or replace function public.enforce_document_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  hh_id uuid;
  existing_count int;
  free_limit constant int := 20;
begin
  select household_id into hh_id from public.properties where id = new.property_id;

  if public.is_premium(hh_id) then
    return new;
  end if;

  select count(*) into existing_count
  from public.documents d
  join public.properties p on p.id = d.property_id
  where p.household_id = hh_id;

  if existing_count >= free_limit then
    raise exception 'free_tier_document_limit' using hint = 'Upgrade to Premium for unlimited documents.';
  end if;

  return new;
end;
$$;

create trigger enforce_document_limit_trigger
  before insert on public.documents
  for each row execute function public.enforce_document_limit();

-- ---------------------------------------------------------------------
-- Free tier: no family sharing — a household stays at its one owner.
-- ---------------------------------------------------------------------
create or replace function public.enforce_family_sharing_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_count int;
begin
  if public.is_premium(new.household_id) then
    return new;
  end if;

  select count(*) into existing_count
  from public.household_members
  where household_id = new.household_id and status in ('active', 'invited');

  if existing_count >= 1 then
    raise exception 'free_tier_family_sharing_limit' using hint = 'Upgrade to Premium to share this home with family.';
  end if;

  return new;
end;
$$;

create trigger enforce_family_sharing_limit_trigger
  before insert on public.household_members
  for each row execute function public.enforce_family_sharing_limit();

-- ---------------------------------------------------------------------
-- Home Health Score is a Premium feature — gate the compute function
-- itself, not just the UI that calls it.
-- ---------------------------------------------------------------------
create or replace function public.compute_home_health_score(_property_id uuid)
returns table (score smallint, breakdown jsonb)
language plpgsql
security definer
set search_path = public
as $$
declare
  hh_id uuid;
  v_documents int;
  v_assets int;
  v_expired_warranties int;
  v_overdue_maintenance int;
  v_active_maintenance int;
  v_score int;
  v_breakdown jsonb;
begin
  if not public.can_access_property(_property_id) then
    raise exception 'not authorized for this property';
  end if;

  select household_id into hh_id from public.properties where id = _property_id;
  if not public.is_premium(hh_id) then
    raise exception 'premium_required' using hint = 'Home Health Score is a Premium feature.';
  end if;

  select count(*) into v_documents from public.documents where property_id = _property_id;
  select count(*) into v_assets from public.assets where property_id = _property_id and status = 'active';
  select count(*) into v_expired_warranties from public.assets
    where property_id = _property_id and warranty_expiry is not null and warranty_expiry < current_date;
  select count(*) into v_active_maintenance from public.maintenance_tasks
    where property_id = _property_id and is_active;
  select count(*) into v_overdue_maintenance from public.maintenance_tasks
    where property_id = _property_id and is_active and next_due_date < current_date;

  v_score := 50
    + least(v_documents * 3, 20)
    + least(v_assets * 2, 15)
    - least(v_expired_warranties * 5, 15)
    - least(v_overdue_maintenance * 8, 25);
  v_score := greatest(0, least(100, v_score));

  v_breakdown := jsonb_build_object(
    'documents_recorded', v_documents,
    'assets_recorded', v_assets,
    'expired_warranties', v_expired_warranties,
    'active_maintenance_tasks', v_active_maintenance,
    'overdue_maintenance', v_overdue_maintenance
  );

  insert into public.home_health_scores (property_id, score, breakdown)
  values (_property_id, v_score, v_breakdown);

  return query select v_score::smallint, v_breakdown;
end;
$$;

-- ---------------------------------------------------------------------
-- Let an invited user see and accept their own invite. Seeing it is a
-- plain SELECT policy (reads the email from the request JWT via
-- auth.jwt() rather than auth.users — the authenticated role has no
-- SELECT grant on that table, confirmed: querying it directly raises
-- "permission denied for table users").
--
-- Accepting is NOT a plain client-side UPDATE, even with a permissive
-- WITH CHECK — confirmed by testing: Postgres re-validates an UPDATE's
-- *new* row against the table's SELECT policies too, so flipping
-- status 'invited' -> 'active' makes the new row fail the very SELECT
-- policy that let the old row be found in the first place, and the
-- UPDATE is rejected as an RLS violation regardless of WITH CHECK.
-- A SECURITY DEFINER function sidesteps that self-visibility trap by
-- not going through RLS for the write at all, while still checking
-- authorization explicitly.
-- ---------------------------------------------------------------------
create policy "household_members_select_own_invite" on public.household_members
  for select
  using (
    status = 'invited'
    and invited_email = (auth.jwt() ->> 'email')
  );

create or replace function public.accept_household_invite(_household_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_email text := auth.jwt() ->> 'email';
  row_exists boolean;
begin
  select exists (
    select 1 from public.household_members
    where id = _household_member_id
      and status = 'invited'
      and invited_email = caller_email
  ) into row_exists;

  if not row_exists then
    raise exception 'invite not found or not addressed to this account';
  end if;

  update public.household_members
  set user_id = auth.uid(), status = 'active', joined_at = now()
  where id = _household_member_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Auto-accept pending invites when someone signs up for the first time
-- with an email that's already been invited to a household (the RLS
-- policy above covers an *existing* user accepting later; this covers
-- a brand-new signup, which the enforce_family_sharing_limit trigger
-- above wouldn't otherwise recognise as "accepting" vs. "joining fresh").
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

  update public.household_members
  set user_id = new.id, status = 'active', joined_at = now()
  where invited_email = new.email and status = 'invited' and user_id is null;

  return new;
end;
$$;
