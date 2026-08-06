# Store submission checklist

Honest state as of the end of Phase 5. Split into what's actually done in
this repo versus what needs a human with an Apple Developer / Google Play
Console account — nothing in the second list can be completed from this
environment, so it's listed rather than claimed.

## Done in this repo

- [x] Core product: property/room/asset capture, document scanning +
      AI extraction, semantic search, timeline, maintenance reminders,
      Home Health Score, AI assistant (RAG, grounded + cited), family
      sharing, Home Passport, subscriptions (RevenueCat).
- [x] Free-tier limits enforced server-side (DB triggers), not just hidden
      in the UI.
- [x] Account deletion (`delete-account` Edge Function) and data export
      (`export-data` Edge Function) — GDPR/CCPA "right to erasure" and
      portability.
- [x] Draft Privacy Policy and Terms of Service screens, linked from
      Profile and from the paywall (Apple 3.1.2 requires the latter).
- [x] Subscription auto-renewal disclosure text on the paywall.
- [x] Crash/error reporting wired to PostHog (`src/lib/crashReporting.ts`,
      `RootErrorBoundary`).
- [x] AI usage/cost tracking (`ai_usage_events` table +
      `household_ai_usage_monthly` view) so OpenAI spend is visible
      per household without needing separate billing infra.
- [x] Design system contrast fix (`textTertiary`) so caption/footnote text
      meets WCAG AA against its background in both themes.
- [x] Accessibility roles/labels on icon-only buttons (close, send, take
      photo) and screen-reader-visible text on all interactive controls.
- [x] Lists that can grow unbounded (documents, timeline, assets, chat)
      are virtualized (`FlatList`/`SectionList`); the one intentional
      exception is the public Home Passport viewer, which renders a
      single bounded snapshot server has already assembled.
- [x] Image compression before upload (`src/lib/storage.ts`,
      `expo-image-manipulator`, resized + JPEG-compressed) to control
      both upload time and OpenAI/storage cost.
- [x] iOS usage-description strings and Android runtime permissions for
      camera/photo library, set in `app.json`.
- [x] Sign in with Apple implemented (`expo-apple-authentication`) —
      required by Apple if any other third-party/social sign-in is
      offered; here it's offered alongside email/password.
- [x] Push notification infrastructure for maintenance reminders —
      `push_tokens` table, `send-maintenance-reminders` Edge Function
      (unit-tested selection/dedup logic), and contextual client-side
      registration (`src/lib/pushNotifications.ts`, asked the first time a
      reminder is actually shown, not on launch, per the product plan's
      T7 mitigation). This is the "reminders fire even if the user never
      reopens the app" retention engine the plan calls for — previously
      reminders only showed passively on the Home tab. **Two setup steps
      below are still needed before it actually delivers a push.**

## Needs a human with store accounts (cannot be done from this environment)

- [ ] **Apple Developer Program membership** ($99/yr) and **Google Play
      Console** account ($25 one-off) — I have no access to create or pay
      for these.
- [ ] Register the actual in-app purchase products (monthly/annual
      Premium) in App Store Connect and Play Console, and configure the
      matching RevenueCat offering — the app already reads whatever
      offering RevenueCat serves (`src/hooks/usePurchases.ts`), it just
      needs real products to exist.
- [ ] App icon, splash screen and screenshot assets for App Store/Play
      listing sizes — placeholders exist in `assets/images/`; real
      marketing screenshots need to be captured from a running build on
      real devices.
- [ ] **Legal review** of `app/legal/privacy.tsx` and `app/legal/terms.tsx`
      by a qualified solicitor before removing the "Draft — not yet
      legally reviewed" badge — this is explicit in both files. Also add
      the real contact/support and data-controller email addresses
      (currently placeholders).
- [ ] Provision production Supabase env vars, RevenueCat API keys, and
      OpenAI/PostHog keys as EAS build secrets (see `.env.example`) —
      I've only been able to validate against a real Supabase project
      the user connected directly; I have no credentials of my own.
- [ ] Build with EAS (`eas build`) for a real device/TestFlight binary —
      Expo Go (what's been tested so far) doesn't include the RevenueCat
      native module, so purchase flows need a development or production
      build to test end-to-end.
- [ ] TestFlight / Play internal testing beta cohort, and the
      crash-free-session-rate / activation / retention baselines the
      roadmap's Phase 5 exit criteria call for — these require real usage
      data from real users, which doesn't exist yet.
- [ ] Fill in the actual App Privacy (Apple) and Data Safety (Play) forms
      in each console, using `app-store-metadata.md` in this same folder
      as the source mapping.
- [ ] App Store / Play Store listing copy (short description, full
      description, keywords, category) — not yet written; product framing
      exists in `docs/planning/01-product-analysis-and-risks.md` as a
      starting point.
- [ ] Apple's Sign in with Apple entitlement/capability needs to be
      enabled on the App ID in the Apple Developer portal to match the
      `expo-apple-authentication` plugin already in `app.json`.
- [ ] Run `eas init` to create an EAS project and get a project id — push
      notifications need this (`Notifications.getExpoPushTokenAsync`
      requires `extra.eas.projectId` in `app.json`, which doesn't exist
      yet). Without it, `registerForPushNotificationsIfNeeded()` silently
      no-ops rather than failing — the rest of the app is unaffected —
      but no device will ever actually register a push token.
- [ ] Schedule `send-maintenance-reminders` to run daily (Supabase
      Dashboard → Edge Functions → your function → Cron, or a `pg_cron` +
      `pg_net` job calling it) — the function itself is deployed like any
      other Edge Function, but nothing invokes it on its own; it needs an
      explicit schedule set up in the Supabase dashboard.

## Suggested order

1. Apple Developer + Play Console accounts.
2. Provision production secrets, run an EAS build, confirm purchases work
   end-to-end on a real device (RevenueCat sandbox).
3. Legal review of privacy/terms, fill in real contact details.
4. Store listing assets + copy, fill in the privacy/data-safety forms.
5. TestFlight/internal testing beta cohort, watch crash-free rate and the
   PostHog activation events, fix what surfaces.
6. Submit for review.
