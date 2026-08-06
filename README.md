# Home Memory

The AI-powered digital memory of your home — a UK-first mobile app that
turns photos of appliances, receipts, manuals and certificates into a
structured, queryable record of a property.

## Status

**Phase 1 (Foundation) complete:** Expo Router app shell, design system,
Supabase-backed auth, and the bottom-tab navigation are live and real
(no placeholder logic). Phases 2–5 (capture, AI assistant, monetisation,
release) are in progress — see the roadmap below.

Planning docs:

- [`docs/planning/01-product-analysis-and-risks.md`](docs/planning/01-product-analysis-and-risks.md) — product analysis and risk register
- [`docs/planning/02-architecture.md`](docs/planning/02-architecture.md) — system architecture
- [`docs/planning/03-database-schema.md`](docs/planning/03-database-schema.md) — database schema (DDL in [`supabase/migrations/`](supabase/migrations/))
- [`docs/planning/04-roadmap.md`](docs/planning/04-roadmap.md) — phased development roadmap
- [`docs/planning/05-decisions.md`](docs/planning/05-decisions.md) — key technical decisions and rationale

## Stack

React Native + Expo Router (TypeScript) · Supabase (Postgres, Auth,
Storage, Edge Functions) · OpenAI · RevenueCat · Expo Notifications
(FCM/APNs) · PostHog

## Getting started

```bash
npm install
cp .env.example .env   # fill in a real Supabase project URL + anon key
npm run typecheck
npm run lint
npm test
npm start               # then press i / a / w, or scan the QR code in Expo Go
```

You need a Supabase project with the schema in `supabase/migrations/`
applied (`supabase db push`, or run the SQL files in order against a new
project) before sign-up/sign-in will work end-to-end. Without a real
`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `env.ts`
fails fast with a clear error rather than starting in a broken state.

`EXPO_PUBLIC_POSTHOG_API_KEY` and the `EXPO_PUBLIC_REVENUECAT_*` keys are
optional for now — analytics and payments are inert (no-op) until Phases
3–4 wire them into the UI.

### Known placeholders that must change before a real release

- `app.json`'s `ios.bundleIdentifier` / `android.package`
  (`uk.co.homememory.app`) are placeholders — set them to an identifier
  you actually control before building for the stores.
- Sign in with Apple requires the "Sign In with Apple" capability enabled
  on the Apple Developer account/provisioning profile used to build.
