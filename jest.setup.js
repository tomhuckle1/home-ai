// Tests run without a real Supabase project; env.ts only needs
// well-formed values to pass validation, never live credentials.
process.env.EXPO_PUBLIC_SUPABASE_URL ??= 'https://test-project.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key';
