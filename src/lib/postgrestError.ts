// Free-tier limit triggers (enforce_property_limit, enforce_document_limit,
// enforce_family_sharing_limit — see supabase/migrations/20260806000008_entitlements.sql)
// raise a terse exception name like `free_tier_document_limit` as the
// message, with the actual user-facing text ("Upgrade to Premium for
// unlimited documents.") set as the Postgres `hint`. PostgREST forwards
// both, but supabase-js error objects are usually read via `.message`
// alone, which shows the raw exception name instead of that hint.
export function friendlyMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error && typeof error === 'object') {
    const hint = (error as { hint?: unknown }).hint;
    if (typeof hint === 'string' && hint.trim()) return hint;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
