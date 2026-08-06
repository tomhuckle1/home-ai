// Deno Edge Function — deploy with `supabase functions deploy
// send-maintenance-reminders`, then schedule it (Supabase Dashboard →
// Edge Functions → Cron, or pg_cron) to run daily. Not covered by this
// repo's Jest suite (different runtime); the pure logic it depends on
// lives in ./reminders.ts and *is* unit tested.
//
// Runs on a schedule, not under a user's JWT, so it uses the service role
// throughout — there's no caller to scope RLS to.
import { createClient } from 'npm:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';
import { buildPushMessages, chunkMessages, selectTasksDueForReminder, type ReminderTask } from './reminders.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const today = new Date().toISOString().slice(0, 10);
  const startOfToday = `${today}T00:00:00.000Z`;

  try {
    const { data: tasks, error: tasksError } = await supabase
      .from('maintenance_tasks')
      .select('id, property_id, title, next_due_date')
      .eq('is_active', true);
    if (tasksError) throw tasksError;
    if (!tasks || tasks.length === 0) return jsonResponse({ sent: 0, tasksConsidered: 0 });

    const { data: alreadySent, error: logError } = await supabase
      .from('notification_log')
      .select('maintenance_task_id')
      .eq('notification_type', 'maintenance_reminder')
      .gte('sent_at', startOfToday)
      .not('maintenance_task_id', 'is', null);
    if (logError) throw logError;

    const alreadyNotifiedTaskIds = new Set((alreadySent ?? []).map((row) => row.maintenance_task_id as string));
    const dueTasks = selectTasksDueForReminder(tasks as ReminderTask[], today, alreadyNotifiedTaskIds);
    if (dueTasks.length === 0) return jsonResponse({ sent: 0, tasksConsidered: tasks.length });

    const propertyIds = [...new Set(dueTasks.map((t) => t.property_id))];
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, household_id')
      .in('id', propertyIds);
    if (propertiesError) throw propertiesError;
    const householdIdByProperty = new Map((properties ?? []).map((p) => [p.id, p.household_id as string]));

    const householdIds = [...new Set([...householdIdByProperty.values()])];
    const { data: members, error: membersError } = await supabase
      .from('household_members')
      .select('household_id, user_id')
      .in('household_id', householdIds)
      .eq('status', 'active');
    if (membersError) throw membersError;

    const userIdsByHousehold = new Map<string, string[]>();
    for (const member of members ?? []) {
      const list = userIdsByHousehold.get(member.household_id) ?? [];
      list.push(member.user_id);
      userIdsByHousehold.set(member.household_id, list);
    }

    const allUserIds = [...new Set((members ?? []).map((m) => m.user_id as string))];
    const { data: pushTokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('user_id, token')
      .in('user_id', allUserIds.length > 0 ? allUserIds : ['00000000-0000-0000-0000-000000000000']);
    if (tokensError) throw tokensError;

    const tokensByUser = new Map<string, string[]>();
    for (const row of pushTokens ?? []) {
      const list = tokensByUser.get(row.user_id) ?? [];
      list.push(row.token);
      tokensByUser.set(row.user_id, list);
    }

    const tasksWithTokens = dueTasks.map((task) => {
      const householdId = householdIdByProperty.get(task.property_id);
      const userIds = householdId ? (userIdsByHousehold.get(householdId) ?? []) : [];
      const tokens = userIds.flatMap((userId) => tokensByUser.get(userId) ?? []);
      return { task, userIds, tokens };
    });

    const messages = buildPushMessages(
      tasksWithTokens.map(({ task, tokens }) => ({ task, tokens })),
      today,
    );

    for (const chunk of chunkMessages(messages)) {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(chunk),
      });
      if (!response.ok) {
        console.error('Expo push send failed', response.status, await response.text());
      }
    }

    const logRows = tasksWithTokens.flatMap(({ task, userIds }) =>
      userIds.map((userId) => ({
        user_id: userId,
        maintenance_task_id: task.id,
        notification_type: 'maintenance_reminder',
      })),
    );
    if (logRows.length > 0) {
      const { error: insertLogError } = await supabase.from('notification_log').insert(logRows);
      if (insertLogError) console.error('Failed to write notification_log', insertLogError);
    }

    return jsonResponse({ sent: messages.length, tasksConsidered: tasks.length, tasksDue: dueTasks.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error sending maintenance reminders';
    return jsonResponse({ error: message }, 500);
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
