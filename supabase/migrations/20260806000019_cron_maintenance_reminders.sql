-- Migration: schedule daily maintenance reminder check
-- Requires pg_cron extension (enabled by default on Supabase Pro plans)

-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Schedule the send-maintenance-reminders Edge Function to run daily at 8am UTC
-- This calls the Edge Function via pg_net (HTTP extension)
SELECT cron.schedule(
  'daily-maintenance-reminders',
  '0 8 * * *', -- 8:00 AM UTC daily
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-maintenance-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
