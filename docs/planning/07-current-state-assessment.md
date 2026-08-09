# Home Memory — Current State Assessment

Full comparison of planning documents against what's built, plus navigation restructure rationale and remaining improvements.

---

## Current app state — what it does today

Home Memory is a React Native / Expo app backed by Supabase (Postgres + pgvector + Edge Functions) and OpenAI. A homeowner photographs receipts, appliance labels, manuals, and certificates. AI extracts structured data (brand, model, serial, dates, amounts) and builds a searchable, queryable record of their home.

### Core loop (working end to end)

1. Sign up (email/password, Apple, Google) → auto-creates household, profile, free subscription
2. Onboarding → property creation → add rooms → add items by photo or manually
3. Scan documents → AI extraction → needs_review → user confirms → structured record
4. Upload files (PDF/images) via document picker
5. Browse: property → rooms → assets → documents (with photos, thumbnails, status badges)
6. Ask AI: grounded Q&A with citations, "I don't know" path, conversation history
7. Timeline: auto-generated + manual events, filterable by type
8. Maintenance: system-generated + custom reminders, push notification infrastructure
9. Home Health Score: computed by Edge Function, animated display
10. Home Passport: versioned snapshot, signed expiring links, read-only viewer
11. Family sharing: invite by email, accept flow, shared household
12. Subscriptions: RevenueCat integration, server-side entitlement enforcement
13. GDPR: account deletion + data export via Edge Functions

### Additional features (built beyond original roadmap)

14. Contractor management (CRUD, trade-based lookup, linked to assets)
15. Global search across all entity types
16. Spending tracker (cost aggregation from timeline events)
17. Warranty expiry alerts (assets expiring within 90 days)
18. Asset editing with status tracking (active/replaced/removed)
19. Property editing (year built, bedrooms, tenure, EPC, council tax, purchase info, cover photo)
20. Fix It: "Find a tradesman" via Google Maps + saved contractors, "Find manual online"
21. Custom maintenance reminder creation with frequency
22. File upload for documents (PDF + images via document picker)

---

## Navigation restructure

### Problem

The original 5-tab layout (Home, Ask AI, Timeline, Documents, Profile) doesn't match how users actually use the app:

- **Ask AI** sits empty most of the time — AI questions come up contextually, not as a destination
- **Documents** as a standalone tab creates the "filing cabinet" trap the plan explicitly warns against (01-product-analysis §1: "the ongoing loop is capture → structured record → useful answer / timely reminder, not 'browse your files'")
- **Timeline** is passive, low-frequency browsing — the plan says to "anchor the habitual loop on maintenance reminders + ask AI utility rather than passive record browsing" (risk P7)
- The **capture action** is buried in a small quick-action button despite being the app's core value proposition
- The **Home tab** tries to be a dashboard, property list, and quick-actions hub simultaneously

### New structure

| Tab | Purpose | Replaces |
|---|---|---|
| **Home** | Dashboard: health score, maintenance due, warranty alerts, spending summary | Home tab (dashboard portion only) |
| **My Home** | Property browsing with view switcher: Rooms & items / Documents / Timeline. Contractors and Passport accessible here. | Property detail + Documents tab + Timeline tab |
| **[+] Scan** (centre, elevated) | Opens camera/upload flow directly. Prominent FAB-style button. | Quick action row scan button |
| **Ask AI** | Chat interface with conversation history | Ask AI tab (unchanged) |
| **Profile** | Settings, account, family sharing, data export | Profile tab (unchanged) |

Timeline and Documents remain as screens but are accessed through the My Home tab's view switcher, not as primary navigation. They're the same code, surfaced in context.

### Why this is better

Maps directly to the plan's core loop:
- **Capture** (centre button) — the most important action is the most prominent element
- **Answer** (Ask AI tab) — keeps its dedicated space for the premium feature
- **Remind** (Home dashboard) — maintenance and warranty alerts are the first thing you see
- **Browse** (My Home) — property structure, documents, and timeline are one unified view instead of three siloed tabs

---

## Roadmap compliance

### Phase 1 — Foundation ✅ COMPLETE
All items delivered: Expo scaffold, Supabase migrations, auth (email + Apple + Google), bottom tabs, design system, PostHog analytics, RLS validated.

### Phase 2 — MVP ✅ MOSTLY COMPLETE
All items delivered except:
- ⚠️ **Offline capture queue** (T6) — not implemented, uploads fail on bad signal
- ⚠️ **Guided walk-around** — room creation is a form, not the guided photo flow described in the plan

### Phase 3 — Intelligence ✅ COMPLETE
AI assistant, timeline, maintenance system, health score all working.

### Phase 4 — Monetisation ✅ COMPLETE
RevenueCat, server-side entitlements, family sharing, Home Passport all working.

### Phase 5 — Release readiness ⚠️ MOSTLY COMPLETE
Accessibility, compression, virtualisation, deletion/export done. Missing: EAS project setup, cron scheduling, legal review, beta cohort.

---

## What still needs attention

### Blocks release

1. **Offline capture queue** — plan calls it "activation-killing" (T6). Need local outbox with async retry.
2. **EAS project setup** — push notifications silent without `eas init` + project ID in `app.json`.
3. **Cron scheduling** — `send-maintenance-reminders` exists but nothing triggers it daily.
4. **Legal review** — privacy/terms are drafts with placeholder contacts.

### Should fix before launch

5. **Guided onboarding capture** — the "60 seconds to value" promise needs testing with a guided first-photo flow after property creation.
6. **Active property selection** — multi-property users always see `properties?.[0]`. Need a Zustand store or context for active property.
7. **AI eval set** — plan requires question/answer eval pairs before shipping.
8. **Dynamic Type testing** — Apple reviewers test this.
9. **App icon, splash screen, screenshots** for store submission.

### Post-launch improvements

10. Email fallback for critical reminders (gas safety, insurance expiry)
11. Extraction confidence prompts ("We couldn't read the expiry date — can you add it?")
12. Bulk scanning (multiple photos without leaving camera)
13. Seasonal maintenance calendar view
14. Insurance export (contents inventory with serials, prices, photos)
15. Better Home Passport (branded PDF, selective rooms/items, QR code)
16. Activity feed for family sharing ("Partner scanned a receipt for the dishwasher")
17. Move-in checklist for new property additions

---

## Architecture compliance

All 10 decisions (D1–D10) implemented correctly. Household tenancy, server-side AI, fixed core + jsonb, needs_review extractions, grounded RAG with citations, webhook-fed subscriptions, Expo push, RLS from migration 1, React Query for server state. One gap: D9 specifies Zustand for client state but no Zustand store exists (active property, camera queue use React state or hardcoded values).
