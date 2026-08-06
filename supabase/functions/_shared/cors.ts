// Edge Functions are only ever called from our own app (mobile, no
// browser origin to restrict), so a permissive CORS policy here doesn't
// widen access — Supabase Auth + RLS are what actually gate the data.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
