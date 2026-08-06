# Home Memory — Product Analysis & Risk Register

## 1. What we're actually building

Home Memory is not a document vault and not a smart-home controller. It is a
**structured, queryable memory of a physical property**, built almost
entirely from photos the user was going to take anyway (of receipts,
appliance labels, manuals, certificates). The product only works if:

1. The first session produces something the user didn't have five minutes
   ago (a recognised appliance, a warranty date, a saved certificate) —
   the "60 seconds to value" principle.
2. The ongoing loop is **capture → structured record → useful answer /
   timely reminder**, not "browse your files."
3. AI is doing the classification and extraction work the user would
   otherwise do by hand (typing model numbers, dates, suppliers).

Every feature in the brief maps onto that loop:

| Feature | Loop stage |
|---|---|
| Document scanner | Capture → structure |
| Home profile (property/room/asset) | Structure |
| AI assistant | Answer |
| Maintenance system | Reminder |
| Timeline | Structure (read view) |
| Home Health Score | Feedback loop that motivates more capture |
| Home Passport | Monetisable output of the accumulated structure |

If a feature doesn't shorten capture, sharpen an answer, or fire a
well-timed reminder, it's out of scope for now (e.g. no smart-home device
control, no generic chatbot, no general file storage for non-home
documents).

## 2. Product risks

| # | Risk | Why it matters | Mitigation |
|---|---|---|---|
| P1 | **60-second value promise is hard to keep.** AI vision extraction takes several seconds per image; a user photographing 5–10 things before seeing value will bounce. | Kills activation, the single most important metric pre-product-market-fit. | Optimistic UI: show the room/asset card immediately with a "reading label…" state; process the first photo synchronously and fast (small model, single image), defer the rest to a background queue. Cap the guided onboarding at **3 photos** before showing the populated Home Profile. |
| P2 | **Trust barrier for sensitive documents.** Insurance policies, mortgage docs, ID-adjacent info are more sensitive than "notes." | Users self-censor or abandon before uploading the documents that make the product valuable. | Lead onboarding with low-sensitivity items (appliance labels), not certificates. Be explicit, in-product, about private storage + encryption + deletion rights before the first insurance/mortgage upload. |
| P3 | **Retention after initial setup.** Once the home is "recorded," there's no daily reason to open the app — this is the "filing cabinet" trap the brief explicitly warns against. | Free tier churns before ever seeing Premium value. | The maintenance system is the retention engine, not a side feature: system-generated reminders (boiler service, smoke alarm checks) must fire even for users who never open the app again, via push notification, and resolving them should be one tap. |
| P4 | **AI extraction errors carry real cost.** A misread warranty-expiry date could cause a user to miss a claim window; a wrong serial number breaks the "ask AI" answer later. | Directly damages the core trust promise ("never need to remember anything again"). | Every AI-extracted document is written as `needs_review` and shown to the user for a 5-second confirm/edit before being treated as ground truth. Never auto-finalise silently. |
| P5 | **Monetisation moment is rare.** Home Passport (the flagship premium feature) is only useful when *selling* — an event most users hit once every 5–10 years. | Premium conversion can't rely on Passport alone. | Premium value must also be everyday: AI assistant quota, unlimited documents/photos, family sharing, Home Health Score. Passport is the "wow, worth it retroactively" feature, not the primary hook. |
| P6 | **Competitive space isn't empty** (HomeZada, Dwellin, Centriq and UK players exist). | Differentiation determines whether this is a wedge or a me-too app. | The wedge is AI-native, near-zero-effort capture (photo → structured record) versus manual form-filling in incumbents, plus a strict no-hallucination assistant that cites its sources. |
| P7 | **Seasonality of engagement.** Big renovations/moves are rare; day-to-day home life doesn't obviously need "an app." | Long-term DAU/WAU risk. | Anchor the habitual loop on maintenance reminders + "ask AI" utility (e.g. "what filter does my hood need") rather than passive record browsing. |

## 3. Technical risks

| # | Risk | Why it matters | Mitigation |
|---|---|---|---|
| T1 | **Vision/OCR accuracy on real-world photos** (glare, handwriting, faded labels, angled shots). | Bad extractions compound into P4. | Use a structured-output vision call (JSON schema) with confidence per field; low-confidence fields are left blank rather than guessed, and the UI asks the user to fill gaps rather than silently trusting a bad guess. |
| T2 | **AI cost control.** Vision calls are the most expensive OpenAI call type; a free-tier user photographing an entire house is a cost centre with no revenue. | Directly threatens unit economics. | Compress/resize images client-side before upload; cap free-tier document/photo count (already specified in pricing); use the cheaper vision-capable model tier for extraction and reserve the larger model for the AI assistant's reasoning step; cache embeddings so re-asking similar questions doesn't reprocess documents. |
| T3 | **RAG hallucination.** The spec explicitly requires the assistant to *never* fabricate an answer. | A single confident wrong answer (e.g. "yes, still under warranty") breaks trust permanently. | Retrieval is scoped strictly to the asking user's property data (pgvector similarity search + structured field lookup); the system prompt forces "answer only from the provided context, and say you don't know if it's not there"; every answer carries citations back to the source document/asset so the user can verify. |
| T4 | **Multi-tenant data isolation for family sharing.** Shared properties + Postgres Row Level Security is easy to get subtly wrong. | A leak here is a GDPR incident, not just a bug. | RLS policies scoped through `household_members`, expressed via `security definer` helper functions to avoid recursive-policy pitfalls; every child table (documents, assets, etc.) checks property → household → membership, never trusts a client-supplied household id. |
| T5 | **Storage/API costs scale with usage** (many photos per home × many homes). | Margin erosion at scale. | Store one working resolution (not raw camera output), lifecycle-review orphaned/duplicate uploads, keep embeddings small (`text-embedding-3-small`), and monitor cost per active property from day one via PostHog + Supabase usage metrics. |
| T6 | **Connectivity during the guided walk-around.** Users doing the onboarding photo-walk may be in a room with poor Wi-Fi/signal. | A failed upload during onboarding is an activation-killing error, not a minor bug. | Photos are captured and queued locally first (optimistic local record), uploaded/processed asynchronously with retry; the UI never blocks on network for the *capture* step, only for the *AI enrichment* step. |
| T7 | **Push notification reliability & permission friction** (iOS especially). | The reminder system is the retention engine (P3); if it doesn't fire, that engine is dead. | Ask for notification permission after the user has set their first reminder (contextual, not on launch), and treat email as a fallback channel for critical reminders (gas safety, insurance) if push isn't granted. |
| T8 | **RevenueCat ⇄ Supabase entitlement sync drift.** | User pays but app doesn't unlock, or vice versa — direct revenue/trust hit. | RevenueCat webhook → Supabase Edge Function is the single source of truth for the `subscriptions` table; client reads entitlement from Supabase (via RLS-safe view), never trusts client-side RevenueCat state alone for gating server-side actions (e.g. AI assistant quota). |
| T9 | **Expo managed workflow constraints** for camera, on-device processing, and native push. | Choosing the wrong workflow late is expensive to unwind. | Stay on Expo managed + EAS Build; everything required (camera, document picker, notifications, IAP via RevenueCat) has supported Expo config plugins — no ejection needed. Confirmed at architecture stage (see `02-architecture.md`). |
| T10 | **GDPR data residency & deletion cascades.** UK-first product handling home/insurance data. | Legal exposure; also an explicit spec requirement. | Supabase project pinned to an EU region; deletion is a single cascading operation (property/household delete cascades to assets/documents/storage objects/embeddings) implemented and tested, not just documented. |

## 4. Explicit non-goals (for now)

- No smart-home device integration/control.
- No general-purpose chat outside the home-memory domain.
- No open-ended file storage unrelated to the property.
- No multi-country tax/legal logic beyond UK at launch (EPC, FENSA, gas
  safety are UK-specific and hard-coded as first-class document types;
  other markets get generic "certificate" handling until validated).

These are guardrails against scope creep, not permanent exclusions.
