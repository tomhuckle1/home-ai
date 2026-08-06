// Deno Edge Function — deploy with `supabase functions deploy revenuecat-webhook --no-verify-jwt`
// (RevenueCat calls this server-to-server, with no Supabase user session).
// Configure the same secret in RevenueCat's dashboard (Project Settings ->
// Webhooks -> Authorization header) and as REVENUECAT_WEBHOOK_SECRET here.
// Not covered by this repo's Jest suite (different runtime); the pure event
// mapping it depends on lives in ./webhook.ts and *is* unit tested.
import { createClient } from 'npm:@supabase/supabase-js@2';

import { mapRevenueCatEvent, type RevenueCatEvent } from './webhook.ts';

Deno.serve(async (req) => {
  const expectedSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  const providedAuth = req.headers.get('Authorization');
  if (!expectedSecret || providedAuth !== `Bearer ${expectedSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  let event: RevenueCatEvent;
  try {
    const body = await req.json();
    event = body.event;
    if (!event?.type || !event?.app_user_id) throw new Error('Malformed event');
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid webhook payload' }), { status: 400 });
  }

  const update = mapRevenueCatEvent(event);
  if (!update) {
    return new Response(JSON.stringify({ received: true, applied: false }), { status: 200 });
  }

  // Service role — this is the ONE place `subscriptions` is written from,
  // by design (see decision D6 and the table's RLS policy, which has no
  // client-facing INSERT/UPDATE).
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { error } = await supabase
    .from('subscriptions')
    .update({
      entitlement: update.entitlement,
      status: update.status,
      product_id: update.product_id,
      current_period_end: update.current_period_end,
      revenuecat_customer_id: update.household_id,
    })
    .eq('household_id', update.household_id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true, applied: true }), { status: 200 });
});
