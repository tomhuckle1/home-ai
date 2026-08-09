-- Migration: document linking, structural support, document versioning
-- Run after all existing migrations (20260806000001–20260806000015)

-- 1. Add contractor_id to documents (repair invoices link to the contractor)
ALTER TABLE documents ADD COLUMN contractor_id uuid REFERENCES contractors(id) ON DELETE SET NULL;
CREATE INDEX idx_documents_contractor ON documents(contractor_id) WHERE contractor_id IS NOT NULL;

-- 2. Add supersedes_id for document versioning (new gas safety cert replaces old one)
ALTER TABLE documents ADD COLUMN supersedes_id uuid REFERENCES documents(id) ON DELETE SET NULL;
CREATE INDEX idx_documents_supersedes ON documents(supersedes_id) WHERE supersedes_id IS NOT NULL;

-- 3. Junction table for many-to-many document ↔ asset linking (multi-item receipts)
CREATE TABLE document_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_id, asset_id)
);

CREATE INDEX idx_document_assets_document ON document_assets(document_id);
CREATE INDEX idx_document_assets_asset ON document_assets(asset_id);

-- 4. RLS for document_assets — reuse the existing can_access_property pattern
ALTER TABLE document_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view document_assets for accessible properties"
  ON document_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_assets.document_id
        AND can_access_property(d.property_id)
    )
  );

CREATE POLICY "Users can insert document_assets for accessible properties"
  ON document_assets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_assets.document_id
        AND can_access_property(d.property_id)
    )
  );

CREATE POLICY "Users can delete document_assets for accessible properties"
  ON document_assets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_assets.document_id
        AND can_access_property(d.property_id)
    )
  );

-- 5. Add floor to rooms if not already populated (column exists but ensure index)
CREATE INDEX IF NOT EXISTS idx_rooms_floor ON rooms(property_id, floor) WHERE floor IS NOT NULL;

-- 6. Index for property-level assets (no room)
CREATE INDEX idx_assets_property_no_room ON assets(property_id) WHERE room_id IS NULL AND status = 'active';

-- 7. Index for documents by room
CREATE INDEX IF NOT EXISTS idx_documents_room ON documents(room_id) WHERE room_id IS NOT NULL;

-- 8. Index for documents by contractor
CREATE INDEX IF NOT EXISTS idx_documents_contractor_id ON documents(contractor_id) WHERE contractor_id IS NOT NULL;
