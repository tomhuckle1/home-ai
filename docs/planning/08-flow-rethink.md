# Home Memory — Flow Rethink

## The problem

The app currently thinks like a database: Property → Room → Item. But homeowners don't think that way. They think:

- "I want to add my boiler" — but where? It's in the kitchen but it serves the whole house.
- "I want to record my paint colour" — that's a room attribute, not an "item."
- "I want to add my home insurance" — that's not in any room.
- "I have fire alarms" — they're in multiple rooms. Do I add it four times?
- "I just got my car taxed" — my car isn't in the house at all.

The room-first hierarchy forces users to create organisational structure before they can record anything useful. That's backwards. The app should let you add things naturally and organise itself around what you've added.

---

## The fix: smart categories with tailored flows

### Kill the room-first hierarchy

Rooms become an optional location tag on items, not a required organisational layer. You can still browse by room, but you don't have to create a room before adding something.

The primary "add" flow becomes: **"What are you adding?"** → pick from smart categories → answer a tailored set of questions → done.

### The add menu

When you tap [+], show a clean grid of what you can add:

| Icon | Label | What it covers |
|---|---|---|
| 📦 | Appliance | Kitchen and household appliances, white goods |
| 🔥 | Heating & hot water | Boiler, radiators, thermostat, hot water tank |
| ⚡ | Electrics | Consumer unit, sockets, wiring, EV charger |
| 🚿 | Plumbing | Pipes, taps, shower, bath, toilet, water tank |
| 🛡️ | Safety | Fire alarms, CO detectors, burglar alarm, CCTV, locks |
| 🏗️ | Structure | Roof, windows, doors, walls, insulation, gutters |
| 🎨 | Room detail | Paint colour, flooring, tiles, wallpaper, curtains |
| 🛋️ | Furniture | Sofa, bed, wardrobe, table |
| 🌳 | Garden & outdoor | Decking, fencing, shed, lawn mower, BBQ, hot tub |
| 📡 | Technology | WiFi router, smart home, TV, sound system |
| 🔑 | Insurance & policies | Home, contents, car, life, boiler cover |
| 🚗 | Vehicles | Car, motorbike — MOT, tax, insurance, service |
| ⚡ | Utilities & meters | Gas, electric, water meters, stopcock location, broadband |
| 📄 | Document | Scan or upload a receipt, manual, certificate |

Each category opens a tailored flow — NOT a generic form. The fields, prompts, follow-up questions, and suggested reminders are all specific to what you're adding.

### Tailored flows — what each one asks

#### 📦 Appliance (dishwasher, fridge, washing machine, oven, etc.)

1. "What is it?" → dropdown/search of common appliances, or type custom
2. "Take a photo of the label" → AI extracts brand, model, serial
3. "Which room is it in?" → picker (optional, auto-suggests based on type — dishwasher → Kitchen)
4. "Got the receipt?" → scan/upload/skip
5. "Warranty details?" → if receipt was scanned, AI may have extracted these → confirm or enter manually
6. **Smart follow-up:** "Set a reminder for [typical maintenance]?" e.g. dishwasher filter clean (monthly), fridge coil clean (annual)

#### 🔥 Boiler / heating

1. "Take a photo of the label" → AI extracts make, model
2. "When was it last serviced?" → date picker → if > 12 months: "⚠️ Your boiler is overdue for a service"
3. "Do you have a gas engineer?" → add contractor or pick existing
4. **Auto-reminders:** Annual boiler service, gas safety certificate renewal
5. "Upload your gas safety certificate?" → scan/upload/skip
6. "Is it under a care plan?" → provider, renewal date → set renewal reminder

#### 🛡️ Fire alarm / CO detector

1. "How many do you have?" → number
2. "Which rooms?" → multi-select room picker
3. "Battery type?" → pick (9V, AA, 10-year sealed, hardwired)
4. **Auto-reminders:**
   - Battery replacement (6 months for replaceable, skip for sealed/hardwired)
   - Test reminder (monthly)
   - Replacement reminder (10 years from install for sealed units)
5. "Installation date?" (optional)

#### 🔑 Home insurance

1. "Buildings or contents?" → pick or both
2. "Provider" → text
3. "Policy number" → text
4. "Annual premium (£)" → number
5. "Start date" → date
6. "Renewal date" → date
7. **Auto-reminder:** 30 days before renewal: "Your home insurance with [provider] renews on [date]"
8. "Upload your policy document?" → scan/upload/skip
9. "Excess amount?" → number

#### 🚗 Vehicle

1. "Registration number" → text (could auto-lookup make/model via DVLA API later)
2. "Make and model" → text
3. "MOT expiry" → date → **auto-reminder 30 days before**
4. "Tax expiry" → date → **auto-reminder 30 days before**
5. "Insurance provider" → text
6. "Insurance renewal" → date → **auto-reminder 30 days before**
7. "Next service due" → date or mileage → **auto-reminder**
8. "Mileage at last service" → number

#### 🎨 Room detail (paint colour, flooring, etc.)

1. "Which room?" → picker
2. "What are you recording?" → Paint colour / Flooring / Tiles / Wallpaper / Curtains/Blinds
3. For **paint**:
   - "Colour name" → text (e.g. "Cornforth White")
   - "Colour code" → text (e.g. "No. 228")
   - "Brand" → text (e.g. "Farrow & Ball")
   - "Finish" → Matt / Eggshell / Silk / Gloss
   - "Where did you buy it?" → text
   - "How many tins?" → number
4. For **flooring**:
   - "Type" → Carpet / Laminate / Vinyl / Wood / Tile / Stone
   - "Brand/range" → text
   - "Supplier" → text
   - Photo
5. Smart: "Take a photo of the paint tin label for reference?"

#### 🏗️ Structure (roof, windows, insulation)

1. "What is it?" → Roof / Windows / Front door / Insulation / Gutters / Chimney / Walls / Extension / Loft conversion
2. For **windows**:
   - "Type" → Single / Double / Triple glazing
   - "Material" → uPVC / Wood / Aluminium
   - "Installer" → contractor picker
   - "Install date" → date
   - "FENSA certificate?" → upload
   - "Guarantee length" → years → calculate and set reminder
3. For **roof**:
   - "Last repaired/replaced" → date
   - "Material" → Slate / Tile / Flat
   - "Contractor" → picker
   - "Cost" → number
   - "Guarantee?" → years → reminder
4. For **insulation**:
   - "Type" → Loft / Cavity wall / External wall / Floor
   - "Installer" → contractor
   - "Install date"
   - "Certificate?" → upload

#### ⚡ Utilities & meters

1. "What?" → Gas meter / Electric meter / Water meter / Stopcock / Broadband
2. For **meters**:
   - "Location" → text (e.g. "Under the stairs", "External left side")
   - "Meter number" → text
   - "Photo of the meter" → scan
3. For **stopcock**:
   - "Location" → text ("Under kitchen sink")
   - Photo
   - Tip: "Make sure everyone in your household knows where this is!"
4. For **broadband**:
   - "Provider" → text
   - "Contract end date" → date → **auto-reminder 30 days before**
   - "Monthly cost" → number
   - "Router model" → text
   - "WiFi password" → text (stored securely)

---

## Rooms rethink

Rooms don't disappear — they become a lightweight tag and a browsing view.

**Adding a room is optional and fast.** When you add an appliance and pick "Kitchen" as its location, if you don't have a room called Kitchen yet, the app auto-creates it. No separate "Add room" step needed.

**Room detail screen becomes a summary view:**
- Items in this room (with photos and warranty status)
- Room-specific details: paint colour, flooring, curtains
- Room documents (renovation invoices, certificates)
- "What's missing?" prompts: "Most kitchens have a smoke alarm — add one?"

**Browsing by room is one view option in My Home.** The other is browsing by category (all appliances, all insurance, all safety devices).

---

## Onboarding rethink

### First-time walkthrough (even for free users)

After property creation, guide the user through adding their first 2–3 things with real value:

**Step 1: "Let's start with the important stuff"**
Show a checklist of quick wins:
- ✅ Add your boiler → 1 minute, unlocks service reminders
- ✅ Record your fire alarms → 30 seconds, unlocks battery reminders
- ✅ Add your home insurance → 30 seconds, never miss a renewal
- 🔲 Scan a receipt → see AI extraction in action

Each step is optional and skippable. But completing even one gives the user immediate value (a reminder set, a document recorded).

**Step 2: "Quick scan"**
"Got a receipt, warranty card, or appliance label nearby? Take a photo and watch Home Memory read it."

This demonstrates the core AI feature and creates the first piece of real data.

---

## Navigation changes

### My Home tab rethink

Instead of the room-centric view, My Home shows your property organized by **what matters**:

**Top section: Quick stats**
- X items recorded, Y documents, Z reminders active

**Sections (collapsible):**

1. **Home systems** — Boiler, heating, electrics, plumbing, alarm
2. **Appliances** — Kitchen and household
3. **Safety** — Fire alarms, CO detectors, locks
4. **Insurance & policies** — Home, contents, car, with renewal countdown badges
5. **Vehicles** — With MOT/tax/insurance countdown badges
6. **Rooms** — Tap to browse by room (shows items, paint, flooring)
7. **Structure & exterior** — Roof, windows, gutters, fencing
8. **Documents** — All documents, searchable

Each section shows a count and the most urgent item (expiring warranty, overdue service, upcoming renewal).

### The [+] button

Centre tab, always visible. Opens the add menu grid described above. Every add flow ends with the item saved and visible in My Home.

---

## Delete policy

Remove the 30-minute delete window. Users should be able to edit and delete their own data at any time. This is their personal data about their own home. The delete window creates friction and confusion. Replace with a simple confirmation dialog: "Delete [item name]? This can't be undone."

---

## Back buttons

Every screen that isn't a root tab must have a visible back button. Expo Router handles this automatically for stack screens, but modals and custom headers need explicit back/close buttons. Audit every screen.

---

## File upload everywhere

Every screen where you can "Scan a label" or "Scan a document" should also offer "Choose from library" and "Upload a file" (for PDFs, images, documents). The current scan screen has this but it needs to be clearer — three equal-weight buttons: Camera / Library / Upload file.

---

## Smart reminders for everything

The app should proactively suggest reminders based on what you add:

| Item added | Suggested reminder |
|---|---|
| Fire alarm (battery) | Replace batteries every 6 months |
| Fire alarm (sealed) | Replace unit after 10 years |
| Fire alarm (any) | Test monthly |
| CO detector | Replace after 5–7 years |
| Boiler | Annual service |
| Gas safety cert | Annual renewal |
| Home insurance | 30 days before renewal |
| Car insurance | 30 days before renewal |
| Car MOT | 30 days before expiry |
| Car tax | 30 days before expiry |
| Vehicle service | By date or mileage |
| Broadband contract | 30 days before end |
| EPC | Before expiry (10 years) |
| Smoke alarm batteries | Every 6 months |
| Gutter cleaning | Autumn (annual) |
| Boiler pressure check | Monthly |
| Appliance filter (dishwasher, dryer, etc.) | Monthly |
| Roof inspection | Every 5 years |
| External paint/stain | Every 3–5 years |
| Chimney sweep | Annual |
| Septic tank empty | Annual |
| Window seal check | Annual |
| Landlord's gas safety | Annual (if let) |

These should be offered as opt-in during the add flow, not silently created. "Want a reminder to replace the batteries every 6 months?" → Yes / No.

---

## Complete list of what a home contains

Every one of these should be addable through the smart category system:

**Kitchen:** Oven, hob, extractor hood, dishwasher, fridge, freezer, fridge-freezer, washing machine, tumble dryer, washer-dryer, microwave, kettle, toaster, coffee machine, food processor, kitchen sink, taps, worktops, kitchen units, splashback, flooring, paint colour, lighting, smoke alarm

**Bathroom:** Bath, shower, shower screen/door, toilet, basin, taps, towel rail, heated towel rail, extractor fan, mirror, flooring, tiles, paint colour, lighting

**Bedroom:** Bed, mattress, wardrobe, chest of drawers, bedside tables, curtains/blinds, paint colour, carpet/flooring, lighting

**Living room:** Sofa, TV, TV stand/mount, coffee table, bookshelf, fireplace, curtains/blinds, paint colour, carpet/flooring, lighting, surround sound

**Home systems:** Boiler, hot water cylinder, thermostat (Hive, Nest, etc.), underfloor heating, radiators, central heating programmer, consumer unit (fuse box), water softener, water tank, sump pump, solar panels, battery storage, EV charger, heat pump

**Safety:** Smoke alarms (each room), carbon monoxide detectors, burglar alarm, CCTV cameras, door locks (smart/traditional), window locks, fire extinguisher, fire blanket, key safe, safe

**Exterior:** Roof, chimney, gutters, fascia/soffit, external walls, rendering/cladding, windows (each type), front door, back door, patio doors, garage door, driveway, patio, decking, fencing, garden gate, shed, greenhouse, external lighting, doorbell (smart/traditional)

**Utilities:** Gas meter (location + number), electric meter, water meter, stopcock (location), broadband router, phone line, TV aerial/satellite dish

**Garden:** Lawn mower, strimmer, garden furniture, BBQ, hot tub, swimming pool, trampoline, play equipment, plants/trees (notable ones), pond, irrigation system, garden lighting, water butt

**Vehicles:** Car, motorbike, bicycle, caravan — each with reg, MOT, tax, insurance, service history

**Insurance & policies:** Home buildings insurance, home contents insurance, car insurance, life insurance, pet insurance, boiler care plan, home emergency cover, gadget insurance, travel insurance

**Décor (per room):** Paint colour (name, code, brand, finish), wallpaper (pattern, brand), flooring (type, brand), curtains/blinds (type, dimensions), tiles (type, brand, colour)

---

## Implementation priority

1. **New add flow with smart categories and tailored forms** — this is the biggest UX change
2. **Remove 30-minute delete window** — simple backend change, massive UX improvement
3. **Smart reminder suggestions** — built into each add flow
4. **My Home reorganisation** — category-based browsing instead of room-first
5. **Onboarding walkthrough** — guided first-item addition
6. **File upload on all capture screens** — already partially done
7. **Back buttons audit** — ensure every non-tab screen has navigation back
8. **Insurance & vehicle flows** — extend the data model for non-home items
9. **Room details (paint, flooring)** — as a sub-flow of room browsing
