// Pure logic for the extract-document Edge Function: prompt/schema
// construction and response normalization. Deliberately has no Deno-only
// or network dependencies so it can be unit tested with any JS runtime.
//
// Keep ALLOWED_DOCUMENT_TYPES in sync with the `document_type` enum in
// supabase/migrations/20260806000001_extensions_and_enums.sql.

export const ALLOWED_DOCUMENT_TYPES = [
  'receipt',
  'manual',
  'warranty',
  'certificate',
  'invoice',
  'insurance_policy',
  'epc',
  'gas_safety_record',
  'fensa_certificate',
  'mortgage_document',
  'other',
] as const;

export type AllowedDocumentType = (typeof ALLOWED_DOCUMENT_TYPES)[number];

export const EXTRACTION_SYSTEM_PROMPT = `You are reading a photo taken by a UK homeowner using the Home Memory app. \
The photo is a receipt, appliance manual, warranty card, certificate, invoice, or a label photographed directly off \
an appliance/fixture. Extract only what you can actually read in the image — leave a field null rather than guessing \
or inferring a plausible-sounding value. Dates must be ISO 8601 (YYYY-MM-DD); if you can only make out a partial or \
ambiguous date, return null for it instead of guessing the missing part. Choose document_type from the given list, \
picking "other" if nothing else clearly fits.`;

export const EXTRACTION_JSON_SCHEMA = {
  name: 'home_memory_document_extraction',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      document_type: { type: 'string', enum: ALLOWED_DOCUMENT_TYPES as unknown as string[] },
      supplier: { type: ['string', 'null'] },
      product_description: { type: ['string', 'null'] },
      brand: { type: ['string', 'null'] },
      model: { type: ['string', 'null'] },
      serial_number: { type: ['string', 'null'] },
      amount: { type: ['number', 'null'] },
      currency: { type: ['string', 'null'] },
      document_date: { type: ['string', 'null'] },
      expiry_date: { type: ['string', 'null'] },
    },
    required: [
      'document_type',
      'supplier',
      'product_description',
      'brand',
      'model',
      'serial_number',
      'amount',
      'currency',
      'document_date',
      'expiry_date',
    ],
  },
} as const;

export type RawExtractionResult = {
  document_type?: unknown;
  supplier?: unknown;
  product_description?: unknown;
  brand?: unknown;
  model?: unknown;
  serial_number?: unknown;
  amount?: unknown;
  currency?: unknown;
  document_date?: unknown;
  expiry_date?: unknown;
};

export type NormalizedExtraction = {
  document_type: AllowedDocumentType;
  supplier: string | null;
  product_description: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  amount: number | null;
  currency: string | null;
  document_date: string | null;
  expiry_date: string | null;
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toIsoDate(value: unknown): string | null {
  const str = toNullableString(value);
  return str && ISO_DATE_PATTERN.test(str) ? str : null;
}

function toDocumentType(value: unknown): AllowedDocumentType {
  return (ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(value as string)
    ? (value as AllowedDocumentType)
    : 'other';
}

function toAmount(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100) / 100;
}

/** Never throws — untrustworthy/malformed model output degrades to nulls, not an error. */
export function normalizeExtractionResult(raw: RawExtractionResult): NormalizedExtraction {
  return {
    document_type: toDocumentType(raw.document_type),
    supplier: toNullableString(raw.supplier),
    product_description: toNullableString(raw.product_description),
    brand: toNullableString(raw.brand),
    model: toNullableString(raw.model),
    serial_number: toNullableString(raw.serial_number),
    amount: toAmount(raw.amount),
    currency: toNullableString(raw.currency),
    document_date: toIsoDate(raw.document_date),
    expiry_date: toIsoDate(raw.expiry_date),
  };
}

/**
 * The text that gets embedded for semantic search (see
 * supabase/migrations/20260806000006_document_chunk_search.sql). Kept
 * separate from the raw extraction so the embedding reflects a clean,
 * human-readable summary rather than null-heavy JSON.
 */
export function buildEmbeddingInput(normalized: NormalizedExtraction): string {
  const lines = [
    `Document type: ${normalized.document_type.replace(/_/g, ' ')}`,
    normalized.product_description ? `Item: ${normalized.product_description}` : null,
    normalized.brand ? `Brand: ${normalized.brand}` : null,
    normalized.model ? `Model: ${normalized.model}` : null,
    normalized.serial_number ? `Serial number: ${normalized.serial_number}` : null,
    normalized.supplier ? `Supplier: ${normalized.supplier}` : null,
    normalized.amount ? `Amount: ${normalized.currency ?? 'GBP'} ${normalized.amount}` : null,
    normalized.document_date ? `Date: ${normalized.document_date}` : null,
    normalized.expiry_date ? `Expiry/warranty date: ${normalized.expiry_date}` : null,
  ].filter((line): line is string => !!line);

  return lines.join('\n');
}

/**
 * Turns whatever got thrown into a readable string. Real Error instances
 * (including PostgrestError, which extends Error) are the common case, but
 * a thrown value isn't guaranteed to behave like one — `instanceof Error`
 * can fail for an error-shaped object crossing a module/realm boundary
 * (e.g. Deno's npm: compat layer resolving a different copy of a package
 * than the one that constructed the error), so this reads `.message` via
 * plain property access rather than gating on `instanceof` first. It also
 * doesn't trust JSON.stringify to find `.message`/`.stack` on its own —
 * those are non-enumerable on a real Error, so JSON.stringify(realError)
 * is famously just "{}". Only after checking the known Postgrest/Supabase
 * error fields and every own property (enumerable or not) does this give
 * up with the generic message.
 */
export function errorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    for (const key of ['message', 'hint', 'details', 'error_description', 'error']) {
      const value = obj[key];
      if (typeof value === 'string' && value) return value;
    }
    try {
      const ownProps: Record<string, unknown> = {};
      for (const key of Object.getOwnPropertyNames(obj)) ownProps[key] = obj[key];
      const serialized = JSON.stringify(ownProps);
      if (serialized && serialized !== '{}') return serialized;
    } catch {
      // Not serializable — fall through.
    }
    const str = String(obj);
    if (str && str !== '[object Object]') return str;
  }
  if (typeof error === 'string' && error) return error;
  return 'Unknown extraction error';
}

export function buildOpenAiRequestBody(imageUrl: string, model: string) {
  return {
    model,
    messages: [
      { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract the structured fields from this photo.' },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ],
    response_format: { type: 'json_schema', json_schema: EXTRACTION_JSON_SCHEMA },
  };
}
