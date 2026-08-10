# HomeAI — State of the App (Latest Deep Dive)

## What works well

**AI document extraction** — the extraction pipeline is solid. Structured JSON schema, strict grounding prompt ("leave null rather than guessing"), ISO date enforcement, proper document type classification. The Edge Function generates a signed URL for the uploaded photo, sends it to GPT-4o-mini with a vision prompt, and writes extracted fields back to the document row with `needs_review` status. This is the core differentiator and it works correctly.

**AI assistant** — RAG pipeline with pgvector embeddings, 300-row context window, strict grounding ("only answer from recorded data"), citation objects linking back to source assets/documents/events. The system prompt enforces "say I don't know" rather than hallucinating. Well-tested.

**Smart add flows** — 14 categories with tailored forms, quick-add items, customizable reminder frequency, room auto-creation, document attachment prompt after saving.

**Data model** — properly normalised with RLS on every table, household-level tenancy, pgvector for semantic search, jsonb for flexible attributes.

**Subscription model** — RevenueCat integration, server-side entitlement enforcement, webhook-driven subscription table.

## What's still broken

1. **Insurance & Vehicles show on My Home when empty** — CompactSection renders an "Add insurance" / "Add vehicle" prompt even when nothing has been added. Should not render at all when empty.

2. **"Home Buildings" text** — when insurance section renders (even empty), the label comes from policyTypeLabel defaulting to 'home_buildings'. Not visible when empty sections are hidden, but the default in the add form is also 'home_buildings' which isn't the right first choice for most users.

3. **Two remaining `{true ?` dead ternaries** — in asset/[id].tsx line 201 and document/[id].tsx line 303. Left over from delete window removal.

4. **Moving checklist file still exists** — app/moving/index.tsx is still on disk.

## What could be improved

**Styling on My Home:**
- The summary bar could use more visual distinction — numbers should be bolder
- Item cards could show the warranty status more prominently
- The empty hero state could be more engaging
- Category section headers could have coloured icon backgrounds matching the category
- Add subtle dividers between major sections

**Document flow:**
- After confirming a document, there's no clear next step — user should be prompted to link it to an item or navigate back
- The auto-match for brand/model works but there's no feedback when no match is found

**Free tier limits are defined in the paywall UI but not enforced in the app** — the paywall lists "5 items, 3 documents, 3 AI questions" but nothing in the frontend actually blocks you from adding a 6th item. Enforcement exists server-side in some Edge Functions but not consistently.

**The app doesn't show how close you are to free-tier limits** — no "3 of 5 items used" indicator.
