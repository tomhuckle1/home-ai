const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    // Edge Function entrypoints are Deno runtime (Deno.*, npm: specifiers,
    // .ts-suffixed relative imports) — not lintable under this Node/RN config.
    // The pure logic modules beside them (extraction.ts etc.) are plain TS
    // and stay linted normally.
    ignores: ['dist/*', 'supabase/functions/**/index.ts'],
  },
];
