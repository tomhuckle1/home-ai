-- Migration: vehicles, insurance, room details, remove delete window
-- Run after 20260806000016

-- 1. Vehicles table
CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  registration text,
  make text,
  model text,
  colour text,
  year integer,
  mot_expiry date,
  tax_expiry date,
  insurance_provider text,
  insurance_policy_number text,
  insurance_renewal date,
  service_due_date date,
  service_due_mileage integer,
  last_service_mileage integer,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage vehicles for accessible properties"
  ON vehicles FOR ALL
  USING (can_access_property(property_id))
  WITH CHECK (can_access_property(property_id));

CREATE INDEX idx_vehicles_property ON vehicles(property_id);

-- 2. Insurance policies table
CREATE TABLE insurance_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  policy_type text NOT NULL DEFAULT 'home_buildings',
  -- home_buildings, home_contents, car, life, pet, boiler_cover, gadget, travel
  provider text,
  policy_number text,
  annual_premium numeric(10,2),
  excess numeric(10,2),
  start_date date,
  renewal_date date,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage insurance for accessible properties"
  ON insurance_policies FOR ALL
  USING (can_access_property(property_id))
  WITH CHECK (can_access_property(property_id));

CREATE INDEX idx_insurance_property ON insurance_policies(property_id);
CREATE INDEX idx_insurance_renewal ON insurance_policies(renewal_date) WHERE renewal_date IS NOT NULL;

-- 3. Room details table (paint colours, flooring, etc.)
CREATE TABLE room_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  detail_type text NOT NULL DEFAULT 'paint',
  -- paint, flooring, tiles, wallpaper, curtains
  colour_name text,
  colour_code text,
  brand text,
  finish text, -- matt, eggshell, silk, gloss (for paint)
  material text, -- carpet, laminate, vinyl, wood, tile (for flooring)
  supplier text,
  quantity text, -- e.g. "3 tins", "15 sqm"
  photo_path text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE room_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage room details for accessible properties"
  ON room_details FOR ALL
  USING (can_access_property(property_id))
  WITH CHECK (can_access_property(property_id));

CREATE INDEX idx_room_details_room ON room_details(room_id);

-- 4. Remove the 30-minute delete window
-- Drop the delete-window RLS policies and replace with simple owner policies
-- The delete window was enforced by checking created_at in RLS policies.
-- We replace these with straightforward access policies.

-- Assets: allow delete anytime
DROP POLICY IF EXISTS "Users can delete own assets within window" ON assets;
CREATE POLICY "Users can delete own assets"
  ON assets FOR DELETE
  USING (can_access_property(property_id));

-- Documents: allow delete anytime
DROP POLICY IF EXISTS "Users can delete own documents within window" ON documents;
CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  USING (can_access_property(property_id));

-- Rooms: allow delete anytime (still blocked by app if room has items)
DROP POLICY IF EXISTS "Users can delete own rooms within window" ON rooms;
CREATE POLICY "Users can delete own rooms"
  ON rooms FOR DELETE
  USING (can_access_property(property_id));

-- Timeline events: allow delete anytime
DROP POLICY IF EXISTS "Users can delete own timeline events within window" ON timeline_events;
CREATE POLICY "Users can delete own timeline events"
  ON timeline_events FOR DELETE
  USING (can_access_property(property_id));
