-- Migration: schedule daily maintenance reminder check
--
-- pg_cron is not available on every Supabase plan/tier (and isn't
-- installable at all in plain local Postgres), and the two custom
-- settings this job depends on (app.settings.supabase_url,
-- app.settings.service_role_key) are project-level configuration that
-- must be set once via the Supabase SQL editor — see docs/deployment
-- for the exact commands. Neither of those can be assumed, so this
-- migration degrades gracefully instead of failing the whole migration
-- run: if pg_cron can't be installed, or the two settings aren't
-- configured yet, it skips scheduling and leaves a NOTICE explaining why.
-- Re-run this migration (it's idempotent) once pg_cron/the settings are
-- in place to pick up the schedule.

do $$
begin
  begin
    create extension if not exists pg_cron with schema extensions;
  exception when insufficient_privilege or feature_not_supported or undefined_file then
    raise notice 'pg_cron is not available on this project/plan — skipping the daily-maintenance-reminders schedule. Trigger send-maintenance-reminders manually or via an external scheduler instead.';
    return;
  end;

  if current_setting('app.settings.supabase_url', true) is null
     or current_setting('app.settings.service_role_key', true) is null then
    raise notice 'app.settings.supabase_url / app.settings.service_role_key are not configured — skipping the daily-maintenance-reminders schedule. See docs/deployment for the one-time setup SQL, then re-run this migration.';
    return;
  end if;

  -- Schedule the send-maintenance-reminders Edge Function to run daily at
  -- 8am UTC via pg_net. cron.schedule() upserts by job name, so re-running
  -- this is safe.
  perform cron.schedule(
    'daily-maintenance-reminders',
    '0 8 * * *',
    $cron$
    select net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-maintenance-reminders',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
    $cron$
  );
end $$;
