// Deno Edge Function — deploy with `supabase functions deploy export-data`.
// GDPR data portability: returns everything Home Memory stores for the
// caller's households as one JSON document. Caller-scoped client, so
// every read is naturally limited to households this user can access —
// no separate authorization logic needed here.
import { createClient } from 'npm:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';

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
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    const { data: households } = await supabase.from('households').select('*');
    const { data: properties } = await supabase.from('properties').select('*');
    const { data: rooms } = await supabase.from('rooms').select('*');
    const { data: assets } = await supabase.from('assets').select('*');
    const { data: documents } = await supabase
      .from('documents')
      .select(
        'id, property_id, asset_id, document_type, supplier, product_description, brand, model, amount, currency, document_date, expiry_date, created_at',
      );
    const { data: maintenanceTasks } = await supabase.from('maintenance_tasks').select('*');
    const { data: maintenanceCompletions } = await supabase.from('maintenance_completions').select('*');
    const { data: contractors } = await supabase.from('contractors').select('*');
    const { data: timelineEvents } = await supabase.from('timeline_events').select('*');
    const { data: aiConversations } = await supabase.from('ai_conversations').select('*');
    const { data: aiMessages } = await supabase.from('ai_messages').select('*');

    const exportPayload = {
      exported_at: new Date().toISOString(),
      profile,
      households,
      properties,
      rooms,
      assets,
      // Document file contents aren't included — file_path is an internal
      // storage reference, not something meaningful outside this system.
      documents,
      maintenance_tasks: maintenanceTasks,
      maintenance_completions: maintenanceCompletions,
      contractors,
      timeline_events: timelineEvents,
      ai_conversations: aiConversations,
      ai_messages: aiMessages,
    };

    return jsonResponse(exportPayload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error exporting data';
    return jsonResponse({ error: message }, 500);
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
