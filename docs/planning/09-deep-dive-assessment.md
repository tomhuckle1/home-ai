# HomeAI — Deep Dive Functionality Assessment

## What the app is supposed to do

HomeAI is a mobile app that creates a complete digital record of a home. The core promise is: photograph something, AI reads it, the app remembers it, and proactively reminds you about it. It combines four functions that homeowners currently manage across dozens of paper folders, email threads, phone contacts, and calendar reminders:

1. **Record** — what's in your home (appliances, systems, structures), what documents you have (receipts, warranties, certificates), and who's worked on it (contractors)
2. **Answer** — "When was the boiler last serviced?", "Is the dishwasher under warranty?", "Who installed the windows?" — grounded in your own data, with citations
3. **Remind** — boiler service, insurance renewal, MOT, smoke alarm batteries — proactive alerts before deadlines
4. **Share** — Home Passport for selling, family sharing for households, export for insurance claims

## What it actually achieves

### Working end-to-end flows

**The capture-to-record pipeline works.** Camera → upload to Supabase Storage → AI extraction via Edge Function → structured fields for review → confirmed record. The extraction prompt uses a JSON schema to pull brand, model, serial, supplier, dates, amounts. The `needs_review` status ensures AI output is verified before trust. File upload (PDFs, images) also works alongside camera capture.

**The AI assistant works and is properly grounded.** RAG over pgvector embeddings + structured field lookup. The system prompt enforces "only answer from recorded data, cite your sources, say I don't know if unsure." Citation objects link back to assets/documents/timeline events. This is genuinely differentiated — most home apps don't have an AI layer at all.

**Smart add flows work.** 14 categories with tailored forms (appliance asks for brand/model/serial, boiler asks for last service date, fire alarm asks for battery type). Reminder suggestions with customizable frequency built into each flow. Room auto-creation. Document attachment prompt after saving.

**The subscription model works.** RevenueCat integration, server-side entitlement enforcement, webhook-driven subscription table. Free tier limits enforced in Edge Functions. Paywall with feature comparison.

**Supporting features work.** Contractor management (CRUD, trade-based lookup). Global search across all entities. Spending tracker. Warranty alerts. Smart nudges on the home screen. Energy meter readings. Timeline with event history. Family sharing invites. Home Passport with privacy filtering.

### What's genuinely good

The design system is cohesive — consistent tokens, dark mode support, reusable components. The data model is well-normalised with proper RLS on every table. The smart templates system is extensible — adding a new category is one object in a config file. The proactive nudge system analyses real data and generates contextual warnings.

---

## Weaknesses

### Critical functional gaps

**1. The edit flow is broken for assets.**
`app/asset/edit.tsx` uses `useState(asset?.field)` which captures the initial value on first render — but `asset` is `undefined` on first render because the React Query hasn't resolved yet. Every field initialises as empty. This is the same bug that was fixed in `property/edit.tsx` (with the `useEffect` sync pattern) but wasn't applied to asset/edit. A user taps "Edit" on their dishwasher and sees a blank form.

**2. There are two competing "add item" paths and they're confused.**
- `app/asset/new.tsx` — the old manual form with category chips, accessed from room detail
- `app/add/smart-form.tsx` — the new smart form with quick items, reminders, room picker, accessed from the [+] tab

Both create assets. The old form has no reminders, no document attachment prompt, no quick items. The room detail screen still links to the old form. Users get a different experience depending on which path they take. The old form should be replaced or redirected to the smart form.

**3. No way to add a document to an existing item from the item's detail screen.**
The asset detail shows linked documents but has no "Attach a document" or "Scan a receipt for this item" button. You can only link documents after scanning them (via the auto-match prompt on the document screen). If you're looking at your dishwasher and want to scan its warranty card, there's no direct path — you have to go to the [+] tab, scan, then hope the auto-match finds the right item.

**4. Insurance and vehicle records are not viewable or editable after creation.**
There's a create screen for insurance (`app/add/insurance.tsx`) and vehicles (`app/add/vehicle.tsx`) but no detail/edit screens. Once you add car insurance, you can't view the policy number, change the renewal date, or delete it. The My Home overview shows them in a list but they're not tappable. This is a dead end — the user can add but not manage.

**5. Room details (paint, flooring) exist in the schema but have no UI.**
`room_details` table was created in the migration, `useRoomDetails` hook exists, but no screen creates or displays room details. The smart template for "Room detail" (paint colour) creates an asset with attributes, not a room_details record. The two approaches are disconnected.

**6. The QR code feature is a placeholder.**
Tapping "Generate QR sticker" shows an alert with text. It doesn't actually generate a QR code image, doesn't offer to save/share it, and doesn't create a deep link that the app would handle. `react-native-qrcode-svg` is in package.json but isn't imported or used anywhere.

### UX weaknesses

**7. The document review form doesn't update after changes.**
When you confirm a document (`extraction_status: 'completed'`), the form stays visible with the same fields. There's no success state, no navigation to the asset or back to the documents list. The user is left looking at the same form with no indication that anything happened.

**8. Timeline events are not editable after creation.**
`app/timeline/[id].tsx` is a read-only detail view with no edit button. If you enter the wrong cost or date for a renovation, you can't fix it — only delete and recreate.

**9. The asset edit form has no date pickers.**
`app/asset/edit.tsx` uses `DateInput` for purchase date and warranty expiry (good), but also uses plain `TextField` for other dates. However, the bigger issue is the blank-form bug described above.

**10. No loading states on secondary queries.**
When you open an asset, the main data loads but linked documents, saved contractors, and rooms all load independently. There's no indication they're loading — they just appear. This creates layout shifts.

**11. The "getting started" checklist doesn't track real progress.**
It checks whether rooms/items/insurance exist, but doesn't track whether the user has done the onboarding actions. Dismissing a step and coming back shows the same uncompleted checklist. There's no way to skip individual steps.

**12. Chip selects overflow on small screens.**
Category pickers (ASSET_CATEGORIES, ROOM_TYPES, FREQUENCY_OPTIONS) render horizontally and overflow without wrapping. On narrow phones, only the first few chips are visible and there's no indication there are more.

### Data model weaknesses

**13. Single warranty per item.**
`assets.warranty_expiry` and `assets.warranty_provider` are single fields. A dishwasher might have a manufacturer warranty (2 years) and an extended warranty from Domestic & General (5 years). The current model can only store one.

**14. No contractor link on documents.**
The migration added `documents.contractor_id` but the document review form only offers contractor linking for invoices/receipts. The prompt uses an Alert with a list of contractors — if you have 15 contractors, the Alert is unusable.

**15. Vehicles and insurance are property-linked but conceptually separate.**
Car insurance and car MOT belong to the vehicle, not the property. The current schema links both to `property_id` which works but means you can't share a vehicle between properties or have insurance without a property.

### Technical weaknesses

**16. No offline support.**
The planning documents call this "activation-killing" (risk T6). Photo uploads fail if the phone has no signal. There's no local queue or retry mechanism.

**17. Push notifications don't fire.**
`send-maintenance-reminders` Edge Function exists but has no cron trigger. `eas init` hasn't been run, so devices can't register push tokens. The entire reminder system — positioned as the retention engine — is silent.

**18. No error boundaries on individual screens.**
The root `RootErrorBoundary` catches crashes but individual screens don't have error boundaries. A failed API call on one section of the home screen could crash the entire screen instead of just that section.

**19. Moving checklist still exists in the codebase.**
`app/moving/index.tsx` was supposed to be deleted but is still present in some code paths. The route is removed from `_layout.tsx` but the file remains.

---

## Derived improvements (priority order)

### Must fix (broken functionality)

1. **Fix asset edit blank form** — add `useEffect` sync pattern from property edit. Without this, editing items is broken.

2. **Unify the add flows** — redirect `app/asset/new.tsx` to the smart form (`app/add/smart-form.tsx`) with the correct category pre-selected. Remove the duplicate path.

3. **Add insurance/vehicle detail and edit screens** — users can create these records but can't view, edit, or delete them. This is a dead end.

4. **Add "Scan document for this item" to asset detail** — a button that opens the camera with the asset pre-linked. After scanning, the document's `asset_id` is set automatically.

5. **Fix document review success state** — after confirming, navigate to a success screen or show a clear "Saved" indicator and offer navigation to the linked asset or back to documents.

### Should fix (poor experience)

6. **Make insurance/vehicles tappable in My Home** — currently they render as static text in CompactRow. Each should navigate to a detail screen.

7. **Add timeline event editing** — an edit button on the event detail screen.

8. **Fix chip select overflow** — wrap instead of scroll, or add horizontal scroll indicators.

9. **Remove leftover `{true ? ... : ...}` ternaries** from delete window cleanup — these are visual noise in the code where `isWithinDeleteWindow` was replaced with `true` but the else branch (empty text) still renders.

10. **Delete the moving checklist file** — `app/moving/index.tsx` should be removed.

### Should add (missing features that users will expect)

11. **Photo gallery on items** — currently single `primary_photo_path`. Users want to photograph the front, the label, the serial plate, and any damage. Add a simple multi-photo viewer with add/remove.

12. **Actual QR code generation** — render a real QR code with `react-native-qrcode-svg`, offer share/save, handle the deep link in the app's URL scheme.

13. **Room detail recording** — connect the room_details table to a real UI. When browsing a room, show paint colour, flooring type, etc. with a form to add them.

14. **Notification preferences** — a settings screen where users toggle which reminder types they receive (maintenance, warranty, insurance, vehicle).

15. **Usage analytics display** — the `ai_usage_events` table and `household_ai_usage_monthly` view exist but have no UI. Show free-tier users how many AI questions they've used this month.

### Polish

16. **Haptic feedback** — `expo-haptics` is installed but never called. Add light impact on button presses, completion of maintenance tasks, and successful scans.

17. **Better empty states** — some screens still show `<ActivityIndicator />` instead of skeleton loading. Standardise on `SkeletonList` everywhere.

18. **Accessibility audit** — ensure all icon-only buttons have `accessibilityLabel`, test with VoiceOver.

19. **Clean up dead code** — `deleteWindow.ts` is still imported in some files after the window was removed. The `{true ? ... : ...}` ternaries create confusion.
