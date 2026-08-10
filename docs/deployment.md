# Deployment notes

## Scheduled maintenance reminders (pg_cron)

Migration `20260806000019_cron_maintenance_reminders.sql` schedules a daily
job that calls the `send-maintenance-reminders` Edge Function via `pg_cron`
+ `pg_net`. This depends on two things that can't be set by a migration
file, so the migration skips scheduling (with a `NOTICE`, not an error) if
either is missing:

1. **`pg_cron` must be available on your Supabase project.** It's enabled
   by default on Pro-tier and above. On the free tier it may not be
   installable — in that case, trigger `send-maintenance-reminders`
   another way (e.g. an external scheduler such as GitHub Actions or
   cron-job.org hitting the function's URL daily), or upgrade the plan.

2. **`app.settings.supabase_url` and `app.settings.service_role_key` must
   be set on the database**, so the scheduled job knows where to send the
   request and how to authenticate. Run this once in the Supabase SQL
   editor, filling in your own project's values (Project Settings → API):

   ```sql
   alter database postgres set app.settings.supabase_url = 'https://<your-project-ref>.supabase.co';
   alter database postgres set app.settings.service_role_key = '<your-service-role-key>';
   ```

   The service role key is a secret — only ever run this directly in the
   SQL editor, never commit it to a migration file or the repo.

After both are in place, re-run migration 19's SQL (it's idempotent —
`cron.schedule` upserts by job name) to pick up the schedule. You can check
it's registered with:

```sql
select jobname, schedule, active from cron.job where jobname = 'daily-maintenance-reminders';
```
