# Home Memory — Key Decisions

Short ADR-style records for choices that would be expensive to reverse
later. Format: context → decision → why not the alternative.

## D1. Household is the tenancy boundary, not the user

**Context:** properties need to eventually support Family Sharing
(premium). **Decision:** every property belongs to a `household`; every
user gets a personal household (of one) automatically at signup.
**Why not** "property belongs directly to a user, add sharing later":
that requires a breaking migration (moving ownership off `users` onto a
new `households` table) exactly when the feature is being built under
launch pressure. Modelling it correctly from migration 1 costs nothing now
and removes a Phase 4 migration risk. **Status:** flagged for your
confirmation in `02-architecture.md` §10 — cheap to revisit before Phase 1
implementation starts, expensive after.

## D2. All OpenAI calls happen server-side, in Edge Functions

**Decision:** the mobile app never calls OpenAI directly; every vision
extraction, chat completion, and embedding call goes through a Supabase
Edge Function. **Why:** an API key shipped in a mobile bundle is
extractable; server-side calls are also the only place we can cheaply
enforce free/premium quotas (risk T2) without trusting client-reported
state.

## D3. Assets use fixed core columns + `attributes jsonb`, not a rigid schema

**Decision:** brand/model/serial/warranty/purchase fields are real
columns (they're filtered, searched, and reminded-on); everything else an
AI extraction produces lands in `attributes jsonb`. **Why not** a fully
generic EAV (entity-attribute-value) model: EAV makes the common queries
(warranty expiring soon, filter by category) slow and awkward. **Why not**
a fully rigid schema: appliances, structural items, and garden items don't
share enough fields to justify one — you'd end up with dozens of nullable
columns.

## D4. AI extractions are never auto-finalised

**Decision:** every document/asset an AI extracts is written as
`needs_review`; it only becomes trusted data after the user confirms or
edits it in a lightweight review card. **Why:** the product's entire
value proposition is "trustworthy memory of your home" — a single
confidently-wrong warranty date (risk P4) undermines that more than a
slower onboarding does. This is a deliberate trade against "minimise
manual data entry" — we minimise entry, not verification.

## D5. RAG is strictly grounded, with mandatory citations and a defined "I don't know"

**Decision:** the AI assistant retrieves from the household's own data
(pgvector similarity search + structured lookups) and its system prompt
forbids answering outside that context. Every answer carries a citation
back to the source row. **Why:** the brief is explicit that the assistant
must never hallucinate; a citation is also what makes "never hallucinate"
verifiable by the user in the moment, not just a system-prompt promise.

## D6. RevenueCat is the purchase system of record; Supabase `subscriptions` is the entitlement system of record

**Decision:** the client never gates a server-side action (like an AI
assistant call) on client-reported RevenueCat state — it's gated on the
`subscriptions` row that only the `revenuecat-webhook` Edge Function can
write. **Why:** client-side entitlement checks are trivially bypassable
and drift from reality on refunds/chargebacks/billing retries; a single
webhook-fed table avoids two sources of truth disagreeing (risk T8).

## D7. Push notifications go through Expo's push service, not raw Firebase Admin SDK

**Decision:** use `expo-notifications`, which delivers to FCM (Android)
and APNs (iOS) behind one API. **Why not** integrating `firebase-admin`
directly as the brief's "Firebase Cloud Messaging" line might imply: Expo's
service satisfies the requirement (FCM is the actual Android transport)
while avoiding a second native config surface and keeping us in the Expo
managed workflow (risk T9). Revisit only if a specific Firebase-only
capability is needed later — none is identified today.

## D8. RLS is enabled from migration 1, not added later

**Decision:** every table ships with `alter table ... enable row level
security` and explicit policies in the same migration set that creates
it — there is no "trusted server-only" interim period. **Why:** retrofitting
RLS onto a schema that's already accumulating data and client code is far
riskier than building on it from day one, and this is a household-shared,
GDPR-relevant dataset (risk T4/T10) where a gap isn't hypothetical.
**Verification:** the migrations in this repo were applied to a real
local Postgres instance (with pgvector) and exercised with a functional
test — a second user could not see or delete another household's
property until explicitly added as a member, and a member (non-owner)
could not delete a property. This wasn't just reviewed by inspection.

## D9. State management: React Query + Zustand, no Redux

**Decision:** server state (everything from Supabase) goes through
TanStack Query; the small amount of client-only state (onboarding
progress, capture queue, active property) goes through Zustand.
**Why not Redux:** the app's state is overwhelmingly server state with a
thin client-state layer — Redux's ceremony (actions/reducers/middleware)
buys nothing here that React Query + a couple of small stores don't
already give more directly.

## D10. Timeline is a read view over existing facts, not a separate data-entry surface

**Decision:** timeline entries reference the asset/document/contractor
rows that produced them; only genuinely standalone events (purchase, sale,
renovation with no other record) are entered directly. **Why:** a
duplicate entry surface would let the timeline drift out of sync with the
Home Profile it's supposed to summarise — one fact, one place it's
authored, multiple places it's displayed.
