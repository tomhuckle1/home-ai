# Home Memory — Feature Audit & Improvement Roadmap

Full audit of the codebase against what would make this a best-in-class home management app. Organised by effort level, with schema-ready features (you already have the tables/columns, just need UI) flagged first.

---

## 1. Schema exists, UI missing — quick wins

These columns and tables are already in your database but have no screens or controls to use them.

### Contractor management
`contractors` table exists with name, trade, phone, email, website, notes, rating. Currently only referenced in the passport snapshot — there's no way to add, view, or edit contractors in the app. Build:
- Contractor list screen accessible from the property detail
- Add/edit contractor form (name, trade, phone, email, notes)
- Link contractors to timeline events (the `related_contractor_id` column exists on `timeline_events`)
- "Who did the work?" prompt when logging a repair or maintenance completion (`maintenance_completions.contractor_id` already exists)

### Property detail editing
`properties` has columns for `year_built`, `bedrooms`, `tenure`, `epc_rating`, `epc_expiry`, `council_tax_band`, `purchase_date`, `purchase_price`, `address_line2` — none of these have edit UI. The property detail screen only shows address and rooms. Build an "Edit property" screen with all these fields, grouped into sections (Address, Property details, Purchase info, Energy/Council tax).

### Property cover photo
`cover_photo_path` exists on `properties` and the home screen already checks for it — but there's no way to set it. Add a tap-to-set camera/library picker on the property detail screen header.

### Room photos and floor
`rooms` has `photo_path` and `floor` columns — neither is used. Add photo capture for rooms and a floor field (Ground, First, Second, Basement, Attic) to the room creation/edit form.

### Asset editing and status
`AssetUpdate` type exists, `status` field supports active/replaced/removed — but the asset detail screen is read-only. Build an edit screen for all asset fields. When marking an asset as "replaced", prompt for the replacement (creates a new asset linked to the same room). Show status badges on the asset list.

### Document-to-asset linking
`documents.asset_id` exists and is partially used (the "Also save as an item" button sets it), but there's no way to link an existing document to an existing asset after the fact. Add a "Link to item" option on the document detail screen.

### Document-to-timeline linking
`timeline_events.related_document_id` and `related_asset_id` exist but the timeline creation form doesn't let you pick them. When adding a timeline event, offer "Attach a document" and "Related item" pickers.

### Maintenance task creation
The maintenance system exists (tasks, completions, frequencies) but users can only complete system-generated tasks — there's no "Add a custom reminder" flow. Build a form: title, frequency (once/monthly/quarterly/biannual/annual), next due date, linked asset (optional).

---

## 2. Your specific ideas — how to build each one

### Timeline filters
Add a `ChipSelect` filter row at the top of the timeline screen: filter by event type (renovation, repair, purchase, document added, etc.) and optionally by year range or cost range. The query is already simple (`eq('property_id', id).order(...)`) — add `.in('event_type', selectedTypes)` when filters are active. Show active filter count on a badge.

### File upload for documents
Currently scan-only (camera capture). Add a "Upload file" option alongside "Choose from library" on the scan screen that accepts PDFs, images, and common document formats via `expo-document-picker`. For PDFs, the extraction edge function already handles image URLs — extend it to handle PDF-to-image conversion (or use a PDF-specific extraction prompt). This is a significant gap — users have digital receipts, emailed warranties, and downloaded manuals they shouldn't need to photograph off a screen.

### Fix It — local tradesman suggestions
When an asset has a problem (or when the user asks the AI "my dishwasher is broken"), surface a "Find help" action. Two approaches:
- **Lightweight (v1):** Link out to a Google Maps search pre-filled with the asset category + "repair" + the property's postcode. e.g. `https://www.google.com/maps/search/dishwasher+repair+near+NE8+1ZE`. One line of code, immediately useful.
- **Richer (v2):** Use the contractors table to show "Your saved tradespeople" first (filtered by matching trade), with an "Or find someone new" link. When they find someone good, prompt "Save this contractor for next time?"
- **AI-enhanced (v3):** When the AI assistant detects a problem question ("my boiler isn't working"), append to its answer: the linked contractor if one exists for that trade, plus a "Find a local {trade}" button. Extend the system prompt to include contractor context.

### Document ↔ timeline/asset cross-linking
Already covered above in the schema section. The key UX: on any document detail screen, show "Linked to" chips — tap to navigate to the asset or timeline event. On any asset or timeline event, show "Documents" as a section listing linked documents. This makes the app feel connected rather than siloed.

### AI manual finder
New edge function or enhancement to the AI assistant: when a user views an asset detail screen and there's no linked manual, show a "Find manual online" button. This calls an edge function that searches for "{brand} {model} user manual PDF" using a web search API (or OpenAI with web browsing), returns the top result URL and a summary. The user can then save it as a linked document (store the URL, or download and upload the PDF). Premium feature.

---

## 3. Intelligence & AI improvements

### Proactive AI suggestions
The AI currently only responds to questions. Make it proactive:
- **On asset creation:** If a known appliance brand/model is added, suggest typical maintenance schedules ("Bosch dishwashers should have the filter cleaned monthly and the spray arms checked quarterly — add these reminders?")
- **On document scan:** If a warranty is scanned, auto-suggest creating a calendar reminder before expiry
- **On the home screen:** "You haven't recorded anything for your bathroom yet" or "Your boiler service was last recorded 14 months ago"

### AI conversation history
`ai_conversations` and `ai_messages` tables exist but the app resets chat on every visit. Show past conversations as a list, tappable to resume. This makes the AI feel like a real assistant with memory rather than a stateless Q&A box.

### Smarter AI context
The current RAG pulls all assets/documents/timeline up to 300 rows. Improve relevance:
- Weight recent documents higher
- Include contractor data in the context (currently excluded)
- Include maintenance task state (overdue items, upcoming items)
- When a question mentions a room name, filter context to that room's assets first

### AI-powered home valuation insights
Pull in property data (year built, bedrooms, postcode, EPC rating, documented improvements) and offer a "How does my home compare?" summary. Not a valuation — a contextual summary of what's been invested and maintained. Premium feature.

---

## 4. Core UX improvements

### Global search
A search bar on the home screen (or a dedicated search tab replacing one of the existing five) that searches across properties, rooms, assets, documents, timeline events, and contractors in a single query. Return results grouped by type. Currently only the documents tab has search.

### Unified "Add" bottom sheet
Replace the scattered "Add" buttons with a single FAB or "+" button that opens a bottom sheet: Add property, Add room, Scan document, Upload file, Add item, Log event, Add contractor, Add reminder. Context-aware — if you're on a room screen, "Add item to this room" is pre-selected.

### Swipe actions
Swipe-to-complete on maintenance tasks (home screen). Swipe-to-delete on items within the delete window. Uses `react-native-reanimated` (already a dependency) for gesture handling.

### Better date input
Replace the manual "YYYY-MM-DD" text fields with a proper date picker. Use `@react-native-community/datetimepicker` or build a simple one with month/year scroll wheels. Every date field in the app currently expects the user to type ISO format manually.

### Multi-property support
The app technically supports multiple properties but the UX is built around `properties?.[0]`. The timeline, ask-ai, and home health screens all hardcode the first property. Add a property switcher (segment control or dropdown at the top of the home screen) so users with multiple properties can navigate between them. The data layer already supports it — it's purely a UI limitation.

### Offline support
The scan screen uploads immediately and fails if offline. Queue uploads locally using `expo-file-system` and retry when connectivity returns. Show a "pending upload" badge on the documents tab. The roadmap mentions this (risk T6) but it's not implemented.

### Bulk scanning
Let users scan multiple documents in a row without leaving the camera screen. Show a counter badge ("3 scanned") and batch-process extractions. Currently each scan navigates away to the review screen.

---

## 5. Engagement & retention features

### Warranty expiry dashboard
A dedicated section (home screen or property detail) showing warranties expiring in the next 30/60/90 days, with actionable prompts: "Extend warranty", "Replace item", or "Dismiss". Currently buried inside the health score breakdown number.

### Spending tracker
Total up `timeline_events.cost` and `documents.amount` by year, category, or room. Show a simple summary card: "You've spent £X on your home this year" with a breakdown. Data already exists — just needs aggregation and display.

### Move-in checklist
For new property additions, offer a guided checklist: photograph meter readings, locate stopcock, record boiler model, scan insurance documents, note alarm codes. Each item creates the appropriate record (asset, document, timeline event) when completed.

### Seasonal maintenance calendar
Beyond individual task reminders, show a "This month" view of what's due across all maintenance tasks, with a calendar or timeline layout. Group by season: spring (gutters, garden), summer (AC service, deck treatment), autumn (boiler service, draught-proofing), winter (pipe insulation, smoke alarms).

### Activity feed / "What's new"
Replace or augment the timeline with a live activity feed showing recent actions across the household: "[Partner] scanned a receipt for the dishwasher", "[You] completed the annual boiler service". Useful for family sharing — you see what others have added.

---

## 6. Sharing & export improvements

### Share a single item
"Share" button on asset and document detail screens that generates a formatted summary (photo, brand, model, serial, warranty status, purchase info) as a shareable image or text block. Useful for insurance claims, warranty calls, or contractor visits. Use `expo-sharing` (already a dependency).

### Better Home Passport
The current passport is a flat JSON snapshot rendered in a basic list. Improve:
- Branded PDF export with sections, photos, and a cover page
- QR code on the PDF linking to the live web view
- Selective passport — choose which rooms/items to include (don't show the whole house if you're just selling the kitchen appliances with the sale)

### Insurance export
A dedicated "Prepare for insurance" flow that generates an inventory of all assets with serial numbers, purchase prices, purchase dates, and photos — the exact format insurers want for contents insurance claims.

---

## 7. Styling & polish

### Skeleton loading states
Replace `ActivityIndicator` spinners with shimmer/skeleton placeholders that match the shape of the content being loaded (card outlines, text line placeholders). Feels significantly more premium.

### Haptic feedback
Light haptics (`expo-haptics`, already part of Expo) on: button presses, completing maintenance tasks, successful scans, pull-to-refresh triggers, toggling filters.

### Card press animations
Cards that scale to 0.97 on press with a spring animation (via reanimated), instead of the current opacity change. Feels more tactile.

### Image viewer
Pinch-to-zoom on document and asset photos. Currently they're static `Image` components — wrap in a gesture-enabled viewer with pan/zoom. Use `react-native-reanimated` + `react-native-gesture-handler` (both dependencies).

### Floating tab bar
Detach the tab bar from the bottom edge, add rounded corners and a subtle shadow. The current tab bar is standard iOS/Android — a floating bar with a slight inset feels more modern.

### Onboarding illustrations
Replace the emoji icons in onboarding with custom illustrations or Lottie animations. The emojis work but don't convey quality.

### Dark mode refinement
The dark theme exists but some screens have hardcoded colours (the camera overlay uses `#FFFFFF` and `rgba(17, 17, 19, 0.4)` literals). Audit every screen for theme token usage.

---

## 8. Technical & infrastructure

### Push notification improvements
Currently only registers for push when maintenance items are due. Extend to: warranty expiry warnings (30 days before), document extraction completed, family member accepted invite, passport viewed by someone.

### Analytics events
The analytics setup tracks basic lifecycle events. Add: filter usage, search queries (aggregated), AI question topics (aggregated), feature adoption rates (how many users have > 3 rooms, > 10 documents, use the passport, etc.).

### Error recovery
The 30-minute delete window is strict but the error message is vague. Show the exact time remaining ("Deletable for another 12 minutes") and offer an "Edit instead" path for items outside the window.

### Rate limiting visibility
The AI assistant has usage tracking (`ai_usage_tracking` table) but no UI showing the user how many questions they've used or have remaining on the free tier.

### Accessibility
Add `accessibilityLabel` to all icon-only buttons, ensure all images have alt text, test with VoiceOver/TalkBack. The design system components mostly have labels but the screen-level usage is inconsistent.

---

## Suggested priority order

**Phase A — complete what's already built** (schema exists, just needs UI):
1. Asset editing
2. Property detail editing + cover photo
3. Contractor management
4. Custom maintenance reminders
5. Document ↔ asset/timeline linking

**Phase B — your requested features:**
6. Timeline filters
7. File upload for documents
8. Fix It (v1 — Google Maps link, then v2 with contractors)
9. AI manual finder

**Phase C — differentiation:**
10. AI conversation history
11. Global search
12. Warranty expiry dashboard
13. Spending tracker
14. Share a single item

**Phase D — polish:**
15. Skeleton loading states
16. Date pickers
17. Haptic feedback
18. Card animations
19. Multi-property switcher
