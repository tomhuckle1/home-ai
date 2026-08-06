# Home Memory — Development Roadmap

Each phase ends with a stop-and-review point. We do not start the next
phase until the current one's exit criteria are demonstrably met — this
roadmap is the enforcement mechanism for the brief's "don't build
everything immediately" instruction.

## Phase 1 — Foundation

**Goal:** an empty but real app — auth works, navigation works, the
database is live and secure, nothing is fake.

- Expo + TypeScript project scaffold (`expo-router`, ESLint/Prettier,
  strict TS config).
- Supabase project provisioned (EU region); migrations in this repo
  applied (`supabase/migrations/`); generated TypeScript types checked in.
- Auth: email/password + Sign in with Apple + Google OAuth; session
  persistence; the `handle_new_user` flow verified end-to-end (signup →
  profile + personal household + free subscription row all exist).
- Bottom tab navigation shell: Home, Ask AI, Timeline, Documents, Profile
  — real screens with empty states, not placeholders.
- Design system v1: colour/type/spacing tokens + Card, ListRow, Badge,
  EmptyState, Button, Sheet primitives, applied consistently across the
  shell.
- PostHog wired with the core lifecycle event set (see
  `02-architecture.md` §7); RLS validated with an automated test (the
  approach already used to validate the migrations in this repo — a
  non-member must not see another household's data).

**Exit criteria:** a real account can be created, lands on an empty but
fully navigable app, and the household/property RLS boundary is proven,
not assumed.

## Phase 2 — MVP: capture and structure

**Goal:** the core "photo in, structured record out" loop works, so the
60-second-to-value promise is testable.

- Property creation flow (address, type, tenure — minimum fields to get to
  value fast; everything else optional/edit-later).
- Room creation (guided "walk around your house" flow + manual add).
- Camera capture flow with local queueing/offline-safe upload (risk T6).
- `extract-document` Edge Function: vision extraction for both asset
  labels (brand/model/serial) and documents (receipts/manuals/
  certificates), writing `needs_review` records.
- Confirm/edit UI: every AI extraction is a one-tap-confirm or quick-edit
  card before it's treated as ground truth (risk P4/T1) — this is the
  most important UX surface in the MVP.
- Document upload (camera or file) with the same extract → review flow.
- Home Profile screens: property → rooms → assets → documents, browsable.
- Basic keyword + semantic search across a household's assets/documents
  (pgvector, no chat UI yet).

**Exit criteria:** a new user can go from signup to a populated Home
Profile (≥1 room, ≥1 recognised asset, ≥1 processed document) inside a
guided flow, with every AI-extracted field reviewable before it's saved as
fact. Time-to-first-populated-asset is measured via PostHog against the
60-second target.

## Phase 3 — Intelligence layer

**Goal:** the app starts proactively saving the user time, not just
storing what they gave it.

- `ai-assistant` Edge Function + Ask AI tab: grounded Q&A over the
  household's own data, with citations, and an explicit "I don't have
  that information" path (risk T3) — this needs its own eval set of
  question/answer pairs before shipping, not just manual spot-checks.
- Home Timeline: auto-generated from existing facts (asset added, document
  added, maintenance completed) plus manual entries (renovation, purchase,
  sale) — read view first, manual authoring second.
- Maintenance system: system-generated tasks from asset category +
  document type (e.g. boiler → annual service, smoke alarm → monthly
  check), user-created custom reminders, `pg_cron` daily due-check,
  push notifications via `expo-notifications`.
- Home Health Score: `compute-health-score` Edge Function + score history,
  surfaced on Home with a clear breakdown (never just a bare number).

**Exit criteria:** a returning user has a reason to open the app without
being prompted — a due reminder or a health score change — and can get a
correct, cited answer to at least the five example questions in the brief.

## Phase 4 — Monetisation and sharing

**Goal:** the business model is real and family sharing extends the
existing household model rather than bolting on a new one.

- RevenueCat integration (paywall, purchase flow, restore purchases) +
  `revenuecat-webhook` Edge Function keeping `subscriptions` authoritative
  in Supabase (risk T8).
- Entitlement enforcement at the Edge Function layer: free-tier limits
  (1 property, capped documents, basic reminders only) enforced
  server-side, not just hidden in the UI.
- Family sharing: invite flow on top of the existing `household_members`
  table (invite by email → `status = 'invited'` → accept flow) — no schema
  migration required, per the Phase 1 decision.
- Home Passport: `generate-passport` Edge Function producing a versioned
  snapshot behind a signed, expiring, revocable share link; a minimal
  read-only web view for the recipient (buyer doesn't need the app).

**Exit criteria:** a user can subscribe, invite a household member who
sees exactly the same properties (RLS-verified), and generate a Home
Passport link that a signed-out recipient can view until it expires or is
revoked.

## Phase 5 — Release readiness

**Goal:** ready for App Store / Play Store review and real users.

- Performance pass: cold start time, image upload/compression, list
  virtualisation for large document/asset sets.
- Full account deletion + data export flows implemented and tested against
  the cascade described in `03-database-schema.md` (GDPR — risk T10).
- Accessibility pass (dynamic type, screen reader labels, contrast).
- App Store metadata: privacy nutrition labels matched to actual data
  collection, subscription terms per Apple/Google IAP guidelines,
  required legal pages (privacy policy, terms) live.
- Crash/error monitoring, and a cost dashboard (OpenAI + Supabase spend
  per active property) given risks T2/T5.
- Beta cohort (TestFlight/Play internal testing) before public submission.

**Exit criteria:** store submission checklist complete, crash-free session
rate and activation/retention baselines established from the beta cohort.

## Sequencing notes

- Nothing in Phase 3+ is scoped until Phase 2's core loop is validated
  with real usage — building the AI assistant against an empty or fake
  Home Profile would be building on sand.
- Subscriptions (Phase 4) come after the AI assistant and maintenance
  system exist, because "unlimited AI assistant" and "Home Health Score"
  are supposed to be the everyday premium hooks (product risk P5) — there
  has to be something real to sell.
