// Deno Edge Function — deploy with `supabase functions deploy
// send-maintenance-reminders`, then schedule it (Supabase Dashboard →
// Edge Functions → Cron, or pg_cron) to run daily. Not covered by this
// repo's Jest suite (different runtime); the pure logic it depends on
// lives in ./reminders.ts and *is* unit tested.
//
// Despite the name, this now also sends warranty (assets.warranty_expiry)
// and document expiry (documents.expiry_date — EPC, gas safety, insurance,
// FENSA etc.) reminders, not just maintenance tasks — kept in one function/
// one deploy target/one cron schedule rather than adding a sibling
// function for each new reminder kind.
//
// Runs on a schedule, not under a user's JWT, so it uses the service role
// throughout — there's no caller to scope RLS to.
import { createClient } from 'npm:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';
import {
  buildAssetExpiryMessages,
  buildDocumentExpiryMessages,
  buildPushMessages,
  chunkMessages,
  selectExpiringForReminder,
  selectTasksDueForReminder,
  type ExpiringAsset,
  type ExpiringDocument,
  type ExpoPushMessage,
  type ReminderTask,
} from './reminders.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const today = new Date().toISOString().slice(0, 10);
  const startOfToday = `${today}T00:00:00.000Z`;

  try {
    const [tasksResult, assetsResult, documentsResult] = await Promise.all([
      supabase.from('maintenance_tasks').select('id, property_id, title, next_due_date').eq('is_active', true),
      supabase.from('assets').select('id, property_id, name, warranty_expiry').not('warranty_expiry', 'is', null),
      supabase
        .from('documents')
        .select('id, property_id, product_description, original_filename, document_type, expiry_date')
        .not('expiry_date', 'is', null),
    ]);
    if (tasksResult.error) throw tasksResult.error;
    if (assetsResult.error) throw assetsResult.error;
    if (documentsResult.error) throw documentsResult.error;

    const tasks = (tasksResult.data ?? []) as ReminderTask[];
    const assets = (assetsResult.data ?? []) as ExpiringAsset[];
    const documents = ((documentsResult.data ?? []) as Array<{
      id: string;
      property_id: string;
      product_description: string | null;
      original_filename: string | null;
      document_type: string;
      expiry_date: string;
    }>).map((d) => ({
      id: d.id,
      property_id: d.property_id,
      title: d.product_description || d.original_filename || d.document_type.replace(/_/g, ' '),
      expiry_date: d.expiry_date,
    })) as ExpiringDocument[];

    const alreadyNotified = await fetchAlreadyNotifiedIds(supabase, startOfToday);

    const dueTasks = selectTasksDueForReminder(tasks, today, alreadyNotified.tasks);
    const dueAssets = selectExpiringForReminder(assets, (a) => a.warranty_expiry, today, alreadyNotified.assets);
    const dueDocuments = selectExpiringForReminder(documents, (d) => d.expiry_date, today, alreadyNotified.documents);

    if (dueTasks.length === 0 && dueAssets.length === 0 && dueDocuments.length === 0) {
      return jsonResponse({ sent: 0, tasksConsidered: tasks.length });
    }

    const allPropertyIds = [
      ...new Set([...dueTasks.map((t) => t.property_id), ...dueAssets.map((a) => a.property_id), ...dueDocuments.map((d) => d.property_id)]),
    ];
    const recipients = await resolveRecipientTokens(supabase, allPropertyIds);

    const tasksWithTokens = dueTasks.map((task) => ({
      task,
      userIds: recipients.userIdsByProperty.get(task.property_id) ?? [],
      tokens: recipients.tokensForProperty(task.property_id),
    }));
    const assetsWithTokens = dueAssets.map((asset) => ({
      asset,
      userIds: recipients.userIdsByProperty.get(asset.property_id) ?? [],
      tokens: recipients.tokensForProperty(asset.property_id),
    }));
    const documentsWithTokens = dueDocuments.map((document) => ({
      document,
      userIds: recipients.userIdsByProperty.get(document.property_id) ?? [],
      tokens: recipients.tokensForProperty(document.property_id),
    }));

    const messages: ExpoPushMessage[] = [
      ...buildPushMessages(tasksWithTokens, today),
      ...buildAssetExpiryMessages(assetsWithTokens, today),
      ...buildDocumentExpiryMessages(documentsWithTokens, today),
    ];

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

    const logRows = [
      ...tasksWithTokens.flatMap(({ task, userIds }) =>
        userIds.map((userId) => ({ user_id: userId, maintenance_task_id: task.id, notification_type: 'maintenance_reminder' })),
      ),
      ...assetsWithTokens.flatMap(({ asset, userIds }) =>
        userIds.map((userId) => ({ user_id: userId, asset_id: asset.id, notification_type: 'warranty_expiry' })),
      ),
      ...documentsWithTokens.flatMap(({ document, userIds }) =>
        userIds.map((userId) => ({ user_id: userId, document_id: document.id, notification_type: 'document_expiry' })),
      ),
    ];
    if (logRows.length > 0) {
      const { error: insertLogError } = await supabase.from('notification_log').insert(logRows);
      if (insertLogError) console.error('Failed to write notification_log', insertLogError);
    }

    return jsonResponse({
      sent: messages.length,
      tasksConsidered: tasks.length,
      tasksDue: dueTasks.length,
      assetsDue: dueAssets.length,
      documentsDue: dueDocuments.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error sending reminders';
    return jsonResponse({ error: message }, 500);
  }
});

async function fetchAlreadyNotifiedIds(supabase: SupabaseClient, startOfToday: string) {
  const [tasksLog, assetsLog, documentsLog] = await Promise.all([
    supabase
      .from('notification_log')
      .select('maintenance_task_id')
      .eq('notification_type', 'maintenance_reminder')
      .gte('sent_at', startOfToday)
      .not('maintenance_task_id', 'is', null),
    supabase
      .from('notification_log')
      .select('asset_id')
      .eq('notification_type', 'warranty_expiry')
      .gte('sent_at', startOfToday)
      .not('asset_id', 'is', null),
    supabase
      .from('notification_log')
      .select('document_id')
      .eq('notification_type', 'document_expiry')
      .gte('sent_at', startOfToday)
      .not('document_id', 'is', null),
  ]);
  if (tasksLog.error) throw tasksLog.error;
  if (assetsLog.error) throw assetsLog.error;
  if (documentsLog.error) throw documentsLog.error;

  return {
    // deno-lint-ignore no-explicit-any
    tasks: new Set((tasksLog.data ?? []).map((r: any) => r.maintenance_task_id as string)),
    // deno-lint-ignore no-explicit-any
    assets: new Set((assetsLog.data ?? []).map((r: any) => r.asset_id as string)),
    // deno-lint-ignore no-explicit-any
    documents: new Set((documentsLog.data ?? []).map((r: any) => r.document_id as string)),
  };
}

async function resolveRecipientTokens(supabase: SupabaseClient, propertyIds: string[]) {
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('id, household_id')
    .in('id', propertyIds);
  if (propertiesError) throw propertiesError;
  // deno-lint-ignore no-explicit-any
  const householdIdByProperty = new Map((properties ?? []).map((p: any) => [p.id as string, p.household_id as string]));

  const householdIds = [...new Set([...householdIdByProperty.values()])] as string[];
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

  const allUserIds = [...new Set((members ?? []).map((m: { user_id: string }) => m.user_id))] as string[];
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

  const userIdsByProperty = new Map<string, string[]>();
  for (const [propertyId, householdId] of householdIdByProperty.entries()) {
    userIdsByProperty.set(propertyId as string, userIdsByHousehold.get(householdId as string) ?? []);
  }

  return {
    userIdsByProperty,
    tokensForProperty: (propertyId: string) =>
      (userIdsByProperty.get(propertyId) ?? []).flatMap((userId) => tokensByUser.get(userId) ?? []),
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
