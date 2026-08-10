// Supabase-js's `.delete()` doesn't error when RLS blocks a row — it just
// deletes 0 rows with `error: null`. Every delete mutation re-selects the
// row it just tried to delete and throws this when nothing comes back,
// so a silently-blocked delete (e.g. the user lost access to the
// property between page load and tapping delete) surfaces as an error
// instead of the UI just carrying on as if it had worked.
export const DELETE_BLOCKED_MESSAGE = "This couldn't be deleted — check you still have access to this property.";
