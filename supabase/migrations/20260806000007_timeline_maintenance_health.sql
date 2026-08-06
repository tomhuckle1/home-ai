-- Home Memory: Phase 3 — automatic timeline, default maintenance tasks,
-- and the Home Health Score.

-- ---------------------------------------------------------------------
-- Timeline auto-logging: the timeline is a read view over existing
-- facts (see docs/planning/03-database-schema.md §2), so it's populated
-- by triggers on the tables that ARE the facts, not authored directly.
-- ---------------------------------------------------------------------
create or replace function public.log_asset_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.timeline_events (property_id, event_type, title, event_date, related_asset_id, created_by)
  values (new.property_id, 'asset_added', new.name, current_date, new.id, new.created_by);
  return new;
end;
$$;

create trigger on_asset_added_log_timeline
  after insert on public.assets
  for each row execute function public.log_asset_added();

create or replace function public.log_document_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.timeline_events (property_id, event_type, title, event_date, related_document_id, cost, created_by)
  values (
    new.property_id,
    'document_added',
    coalesce(new.product_description, new.original_filename, initcap(replace(new.document_type::text, '_', ' '))),
    coalesce(new.document_date, current_date),
    new.id,
    new.amount,
    new.uploaded_by
  );
  return new;
end;
$$;

create trigger on_document_added_log_timeline
  after insert on public.documents
  for each row execute function public.log_document_added();

-- ---------------------------------------------------------------------
-- Default maintenance tasks: a sensible starting reminder per asset
-- category, editable/deletable afterwards. Categories with no obvious
-- default (structural, furniture, garden, fixture, other) get none —
-- a wrong default reminder is worse than no reminder.
-- ---------------------------------------------------------------------
create or replace function public.create_default_maintenance_task()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  task_title text;
  freq public.maintenance_frequency;
  due date;
begin
  case new.category
    when 'heating' then
      task_title := 'Annual service — ' || new.name;
      freq := 'annual';
      due := current_date + interval '1 year';
    when 'appliance' then
      task_title := 'Annual check — ' || new.name;
      freq := 'annual';
      due := current_date + interval '1 year';
    when 'plumbing' then
      task_title := 'Annual check — ' || new.name;
      freq := 'annual';
      due := current_date + interval '1 year';
    when 'electrical' then
      task_title := 'Safety check — ' || new.name;
      freq := 'annual';
      due := current_date + interval '1 year';
    when 'security' then
      task_title := 'Test — ' || new.name;
      freq := 'monthly';
      due := current_date + interval '1 month';
    else
      return new;
  end case;

  insert into public.maintenance_tasks (property_id, asset_id, title, frequency_type, next_due_date, source, created_by)
  values (new.property_id, new.id, task_title, freq, due, 'system_generated', new.created_by);

  return new;
end;
$$;

create trigger on_asset_added_default_maintenance
  after insert on public.assets
  for each row execute function public.create_default_maintenance_task();

-- ---------------------------------------------------------------------
-- Completing a maintenance task: advance its schedule and log it to
-- the timeline, in one place so every completion path (app, future
-- automation) behaves consistently.
-- ---------------------------------------------------------------------
create or replace function public.advance_maintenance_task()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  task public.maintenance_tasks%rowtype;
  next_date date;
begin
  select * into task from public.maintenance_tasks where id = new.maintenance_task_id;

  next_date := case task.frequency_type
    when 'monthly' then new.completed_date + interval '1 month'
    when 'quarterly' then new.completed_date + interval '3 months'
    when 'biannual' then new.completed_date + interval '6 months'
    when 'annual' then new.completed_date + interval '1 year'
    when 'custom_days' then new.completed_date + make_interval(days => coalesce(task.frequency_days, 365))
    else new.completed_date
  end;

  update public.maintenance_tasks
  set last_completed_date = new.completed_date,
      next_due_date = next_date,
      is_active = case when task.frequency_type = 'once' then false else is_active end
  where id = new.maintenance_task_id;

  insert into public.timeline_events (property_id, event_type, title, event_date, related_asset_id, related_contractor_id, cost, created_by)
  values (new.property_id, 'maintenance_completed', task.title, new.completed_date, task.asset_id, new.contractor_id, new.cost, new.completed_by);

  return new;
end;
$$;

create trigger on_maintenance_completed_advance
  after insert on public.maintenance_completions
  for each row execute function public.advance_maintenance_task();

-- ---------------------------------------------------------------------
-- Home Health Score: computed on demand (called from the Home tab),
-- not on a write-triggered schedule — a handful of tables would need
-- triggers otherwise, for a score nobody's looking at between visits.
-- SECURITY DEFINER because home_health_scores has no client-facing
-- INSERT policy (see 03-database-schema.md), so this function is the
-- sole write path and must check property access itself.
-- ---------------------------------------------------------------------
create or replace function public.compute_home_health_score(_property_id uuid)
returns table (score smallint, breakdown jsonb)
language plpgsql
security definer
set search_path = public
as $$
declare
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
