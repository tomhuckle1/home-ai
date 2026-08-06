// Deno Edge Function — deploy with `supabase functions deploy delete-account`.
// GDPR "right to erasure": deletes every household the caller owns
// (cascading to everything under it — see 03-database-schema.md), leaves
// any household they're just a member of, removes their storage files,
// then deletes the auth user itself. Not covered by this repo's Jest
// suite (different runtime); the pure ownership logic it depends on
// lives in ./plan.ts and *is* unit tested.
import { createClient } from 'npm:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';
import { planAccountDeletion, type Membership } from './plan.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonResponse({ error: 'Missing Authorization header' }, 401);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonResponse({ error: 'Not authenticated' }, 401);

  try {
    const { data: memberships, error: membershipsError } = await supabase
      .from('household_members')
      .select('household_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active');
    if (membershipsError) throw membershipsError;

    const plan = planAccountDeletion((memberships ?? []) as Membership[]);

    for (const householdId of plan.householdsToDelete) {
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id')
        .eq('household_id', householdId);
      if (propertiesError) throw propertiesError;

      for (const property of properties ?? []) {
        await removeStorageFolder(supabase, 'property-photos', property.id);
        await removeStorageFolder(supabase, 'documents', property.id);
      }

      // Cascades to properties/rooms/assets/documents/timeline/maintenance/
      // ai_conversations/subscriptions/passport_shares/household_members —
      // see the ON DELETE CASCADE chain in the migrations.
      const { error: deleteError } = await supabase.from('households').delete().eq('id', householdId);
      if (deleteError) throw deleteError;
    }

    for (const householdId of plan.membershipsToLeave) {
      const { error: leaveError } = await supabase
        .from('household_members')
        .delete()
        .eq('household_id', householdId)
        .eq('user_id', user.id);
      if (leaveError) throw leaveError;
    }

    // Deleting the auth user requires the service role — this is the one
    // step that fundamentally cannot go through the caller-scoped client.
    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (authDeleteError) throw authDeleteError;

    return jsonResponse({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error deleting account';
    return jsonResponse({ error: message }, 500);
  }
});

// deno-lint-ignore no-explicit-any
async function removeStorageFolder(supabase: any, bucket: string, propertyId: string) {
  const { data: files } = await supabase.storage.from(bucket).list(propertyId);
  if (!files || files.length === 0) return;
  const paths = files.map((file: { name: string }) => `${propertyId}/${file.name}`);
  await supabase.storage.from(bucket).remove(paths);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
