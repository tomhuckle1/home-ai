// Deno Edge Function — deploy with `supabase functions deploy generate-passport`.
// Not covered by this repo's Jest suite (different runtime); the pure logic
// it depends on lives in ./snapshot.ts and *is* unit tested.
import { createClient } from 'npm:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';
import { buildPassportSnapshot } from './snapshot.ts';

const SHARE_LIFETIME_DAYS = 90;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonResponse({ error: 'Missing Authorization header' }, 401);

  // Caller-scoped — every read below is RLS-limited to properties this
  // user can access, same as extract-document and ai-assistant.
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });

  let propertyId: string;
  try {
    const body = await req.json();
    propertyId = body.propertyId;
    if (!propertyId) throw new Error('propertyId is required');
  } catch {
    return jsonResponse({ error: 'Invalid request body — expected { propertyId }' }, 400);
  }

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('household_id, address_line1, address_line2, city, postcode, property_type, tenure, year_built')
    .eq('id', propertyId)
    .single();
  if (propertyError || !property) return jsonResponse({ error: 'Property not found or not accessible' }, 404);

  const { data: isPremium, error: premiumError } = await supabase.rpc('is_premium', {
    _household_id: property.household_id,
  });
  if (premiumError) return jsonResponse({ error: premiumError.message }, 500);
  if (!isPremium) {
    return jsonResponse({ error: 'premium_required', message: 'Home Passport is a Premium feature.' }, 402);
  }

  try {
    const [roomsResult, assetsResult, documentsResult, contractorsResult, timelineResult] = await Promise.all([
      supabase.from('rooms').select('id, name, room_type').eq('property_id', propertyId),
      supabase
        .from('assets')
        .select('id, room_id, name, category, brand, model, serial_number, purchase_date, warranty_expiry, primary_photo_path')
        .eq('property_id', propertyId)
        .eq('status', 'active'),
      supabase
        .from('documents')
        .select('id, asset_id, document_type, supplier, product_description, document_date, expiry_date, file_path')
        .eq('property_id', propertyId),
      supabase.from('contractors').select('id, name, trade, phone, email').eq('property_id', propertyId),
      supabase.from('timeline_events').select('event_type, title, event_date, cost').eq('property_id', propertyId),
    ]);

    for (const result of [roomsResult, assetsResult, documentsResult, contractorsResult, timelineResult]) {
      if (result.error) throw result.error;
    }

    const snapshot = buildPassportSnapshot({
      property,
      rooms: roomsResult.data ?? [],
      assets: assetsResult.data ?? [],
      documents: documentsResult.data ?? [],
      contractors: contractorsResult.data ?? [],
      timeline: timelineResult.data ?? [],
    });

    const expiresAt = new Date(Date.now() + SHARE_LIFETIME_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: share, error: insertError } = await supabase
      .from('passport_shares')
      .insert({ property_id: propertyId, created_by: user?.id, snapshot, expires_at: expiresAt })
      .select('token, expires_at')
      .single();
    if (insertError) throw insertError;

    return jsonResponse({ token: share.token, expiresAt: share.expires_at });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error generating passport';
    return jsonResponse({ error: message }, 500);
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
