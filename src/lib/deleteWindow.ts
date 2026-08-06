// Rooms, assets, documents and timeline events are only deletable within
// 30 minutes of creation — see
// supabase/migrations/20260806000013_delete_time_window.sql. Enforced
// there server-side (RLS); this mirrors that same window client-side so
// the delete button can hide itself instead of being shown and then
// silently failing.
export const DELETE_WINDOW_MINUTES = 30;

export const DELETE_WINDOW_MESSAGE = "This can only be deleted within 30 minutes of adding it, to protect your home's history.";

export function isWithinDeleteWindow(createdAt: string): boolean {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs < DELETE_WINDOW_MINUTES * 60_000;
}
