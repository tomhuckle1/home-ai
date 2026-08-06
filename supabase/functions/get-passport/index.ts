// Deno Edge Function — deploy with `supabase functions deploy get-passport --no-verify-jwt`.
// The --no-verify-jwt flag matters: this endpoint is deliberately public
// (a house buyer has no Supabase account), gated only by the unguessable
// token — this function uses the service role internally specifically to
// bypass RLS for that reason, checking expiry/revocation itself instead.
import { createClient } from 'npm:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';

const SIGNED_URL_TTL_SECONDS = 3600;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) return jsonResponse({ error: 'Missing token' }, 400);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: share, error } = await supabase
    .from('passport_shares')
    .select('id, snapshot, expires_at, revoked_at, viewed_count')
    .eq('token', token)
    .single();

  if (error || !share) return jsonResponse({ error: 'This link is not valid.' }, 404);
  if (share.revoked_at) return jsonResponse({ error: 'This link has been revoked.' }, 410);
  if (new Date(share.expires_at) < new Date()) return jsonResponse({ error: 'This link has expired.' }, 410);

  await supabase
    .from('passport_shares')
    .update({ viewed_count: (share.viewed_count ?? 0) + 1 })
    .eq('id', share.id);

  // deno-lint-ignore no-explicit-any
  const snapshot = share.snapshot as any;

  // Sign photo/document paths at view time rather than baking URLs into
  // the stored snapshot, since signed URLs expire and shares live 90 days.
  for (const asset of snapshot.assets ?? []) {
    if (asset.primary_photo_path) {
      const { data } = await supabase.storage
        .from('property-photos')
        .createSignedUrl(asset.primary_photo_path, SIGNED_URL_TTL_SECONDS);
      asset.photo_url = data?.signedUrl ?? null;
    }
  }
  for (const document of snapshot.documents ?? []) {
    if (document.file_path) {
      const { data } = await supabase.storage
        .from('documents')
        .createSignedUrl(document.file_path, SIGNED_URL_TTL_SECONDS);
      document.file_url = data?.signedUrl ?? null;
    }
  }

  return jsonResponse({ snapshot });
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
