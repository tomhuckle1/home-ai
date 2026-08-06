# App Store metadata

What actually gets collected, mapped to the two stores' disclosure forms —
written from the real data flows in this codebase (Supabase schema,
`src/lib/analytics.ts`, `src/lib/purchases.ts`, the Edge Functions under
`supabase/functions/`), not a generic template. Update this file whenever
a data flow changes; it's the source both forms should be filled in from.

## What Home Memory collects

| Data | Where it lives | Why |
|---|---|---|
| Email, name | `profiles` table, Supabase Auth | Account identity |
| Property photos, receipts, manuals, certificates | Supabase Storage (`property-photos`, `documents` buckets) | The core "home record" the app exists to build |
| AI-extracted structured data (supplier, dates, amounts, model numbers) | `documents`, `assets` tables | Extracted from the photos above via OpenAI vision |
| AI assistant questions and answers | `ai_conversations`, `ai_messages` tables | The Ask AI feature |
| Subscription/entitlement status | `subscriptions` table, mirrored from RevenueCat | Feature gating |
| Product usage events (sign up, property created, document scanned, etc.) | PostHog (EU host), see `AnalyticsEvent` in `src/lib/analytics.ts` | Understanding activation/retention, not ad targeting |
| Crash/error reports with stack traces | PostHog exception tracking, see `src/lib/crashReporting.ts` | Diagnosing bugs |

## What it does **not** collect

Precise/coarse location, contacts, browsing history outside the app, health
or fitness data, real payment card details (handled entirely by
Apple/Google via RevenueCat — this app never sees card numbers), and no
advertising identifier (IDFA/AAID) is read — there is no ad SDK.

## Apple "App Privacy" (nutrition label) mapping

| Apple category | Collected? | Linked to identity? | Used for tracking? |
|---|---|---|---|
| Contact Info (name, email) | Yes | Yes | No |
| User Content (photos, documents, AI chat content) | Yes | Yes | No |
| Identifiers (user ID) | Yes | Yes | No |
| Usage Data (feature interaction events) | Yes | Yes (PostHog `identify()` is called on sign-in) | No |
| Diagnostics (crash data) | Yes | Yes (same PostHog project) | No |
| Purchases (subscription status) | Yes | Yes | No |
| Location, Contacts, Browsing History, Search History, Health & Fitness, Financial Info (beyond subscription status), Sensitive Info | No | — | — |

No data is used to track users across other companies' apps or websites, so
**"Data Used to Track You" should be answered No** and the App Tracking
Transparency prompt is not required.

## Google Play "Data safety" mapping

| Play category | Collected? | Shared with third parties? | Purpose |
|---|---|---|---|
| Personal info (name, email) | Yes | Supabase (processor), RevenueCat (processor) | Account functionality |
| Photos and videos | Yes | Supabase (processor), OpenAI (processor, for extraction/AI answers) | App functionality |
| Files and docs | Yes | Supabase, OpenAI | App functionality |
| App activity (in-app actions) | Yes | PostHog (processor) | Analytics |
| App info and performance (crash logs) | Yes | PostHog (processor) | Analytics |
| Financial info | Yes — subscription status only, not card details | RevenueCat, Apple/Google | Subscription management |

All of the above should be marked **encrypted in transit** (HTTPS/TLS
throughout) and the account-deletion flow in Profile → Delete account
satisfies Play's "data can be deleted" requirement.

## Third-party data processors to name in the privacy policy

- **Supabase** (EU region) — database, auth, file storage
- **OpenAI** — receives document photos (for extraction) and assistant
  questions/context (for answers); see the "AI processing" section already
  in `app/legal/privacy.tsx`
- **RevenueCat** — subscription/purchase management
- **PostHog** (EU host) — product analytics and crash diagnostics

`app/legal/privacy.tsx` already lists these in plain language; it's marked
as a draft pending legal review — that review has to happen before
submission (see `submission-checklist.md`).

## Subscription (IAP) compliance

Apple Guideline 3.1.2 requires, in or near the purchase button: title,
length, price, and functional links to Terms of Use and Privacy Policy.
This is implemented in `app/subscription/paywall.tsx` — an auto-renewal
disclosure line plus links to `/legal/terms` and `/legal/privacy` sit
directly below the purchase buttons.

Package titles/descriptions/prices themselves come from whatever is
configured in App Store Connect / Play Console via RevenueCat — set those
up to match `FEATURES` in `paywall.tsx` when creating the actual products.
