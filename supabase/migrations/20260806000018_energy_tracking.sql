-- Migration: energy tracking
-- Meter readings, solar generation, energy costs

CREATE TABLE meter_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  meter_type text NOT NULL DEFAULT 'electricity',
  -- electricity, gas, water, solar_generation, solar_export
  reading numeric(12,2) NOT NULL,
  unit text NOT NULL DEFAULT 'kWh', -- kWh, m3, litres
  reading_date date NOT NULL DEFAULT CURRENT_DATE,
  photo_path text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE meter_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage meter readings for accessible properties"
  ON meter_readings FOR ALL
  USING (can_access_property(property_id))
  WITH CHECK (can_access_property(property_id));

CREATE INDEX idx_meter_readings_property ON meter_readings(property_id, meter_type, reading_date DESC);
