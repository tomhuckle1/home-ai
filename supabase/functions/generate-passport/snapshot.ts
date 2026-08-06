// Pure logic for the generate-passport Edge Function: shaping the raw
// query results into the JSON snapshot stored on passport_shares. No
// Deno-only or network dependencies, so it's unit testable directly.

export type PassportProperty = {
  address_line1: string;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  property_type: string | null;
  tenure: string | null;
  year_built: number | null;
};

export type PassportRoom = { id: string; name: string; room_type: string | null };

export type PassportAsset = {
  id: string;
  room_id: string | null;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  warranty_expiry: string | null;
  primary_photo_path: string | null;
};

export type PassportDocument = {
  id: string;
  asset_id: string | null;
  document_type: string;
  supplier: string | null;
  product_description: string | null;
  document_date: string | null;
  expiry_date: string | null;
  file_path: string;
};

export type PassportContractor = { id: string; name: string; trade: string | null; phone: string | null; email: string | null };

export type PassportTimelineEvent = {
  event_type: string;
  title: string;
  event_date: string;
  cost: number | null;
};

export type PassportSnapshot = {
  generated_at: string;
  property: PassportProperty;
  rooms: PassportRoom[];
  assets: PassportAsset[];
  documents: PassportDocument[];
  contractors: PassportContractor[];
  timeline: PassportTimelineEvent[];
};

export function buildPassportSnapshot(input: {
  property: PassportProperty;
  rooms: PassportRoom[];
  assets: PassportAsset[];
  documents: PassportDocument[];
  contractors: PassportContractor[];
  timeline: PassportTimelineEvent[];
  generatedAt?: Date;
}): PassportSnapshot {
  return {
    generated_at: (input.generatedAt ?? new Date()).toISOString(),
    property: input.property,
    rooms: input.rooms,
    assets: input.assets,
    documents: input.documents,
    contractors: input.contractors,
    // Oldest first — a passport reads as the property's story, not an activity feed.
    timeline: [...input.timeline].sort((a, b) => a.event_date.localeCompare(b.event_date)),
  };
}
