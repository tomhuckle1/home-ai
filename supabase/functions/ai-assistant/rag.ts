// Pure logic for the ai-assistant Edge Function: prompt construction and
// response validation. No Deno-only or network dependencies — see
// docs/planning/01-product-analysis-and-risks.md (risk T3) for why
// grounding + citations are non-negotiable here, not a nice-to-have.

export type AssetContext = {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  warranty_expiry: string | null;
  purchase_date: string | null;
  notes: string | null;
};

export type DocumentContext = {
  id: string;
  document_type: string;
  supplier: string | null;
  product_description: string | null;
  document_date: string | null;
  expiry_date: string | null;
  amount: number | null;
};

export type TimelineContext = {
  id: string;
  event_type: string;
  title: string;
  description: string | null;
  event_date: string;
  cost: number | null;
};

export type RetrievedChunk = {
  document_id: string;
  content: string;
};

export const ASSISTANT_SYSTEM_PROMPT = `You are the Home Memory assistant. You answer a homeowner's questions using \
ONLY the structured data and document excerpts provided below — never anything else, and never general knowledge \
about appliances, products, or homes. The structured data includes assets, documents, and timeline events (a \
timeline event can be the only record of something the user typed in manually, like a repair or replacement, with \
no associated document — treat it as just as valid a source as an asset or document). If the answer isn't in the \
provided data, say plainly that you don't have that information yet, and suggest what they could scan or add to \
find out. Every factual claim in your answer must be traceable to a specific asset, document, or timeline event id \
from the context; cite it. Never invent a serial number, date, or amount that is not explicitly present in the \
context. Be concise and direct — a sentence or two, not a report.`;

export const ASSISTANT_JSON_SCHEMA = {
  name: 'home_memory_assistant_answer',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      answer: { type: 'string' },
      citations: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            type: { type: 'string', enum: ['asset', 'document', 'timeline_event'] },
            id: { type: 'string' },
            label: { type: 'string' },
          },
          required: ['type', 'id', 'label'],
        },
      },
    },
    required: ['answer', 'citations'],
  },
} as const;

export type Citation = { type: 'asset' | 'document' | 'timeline_event'; id: string; label: string };
export type RawAssistantResult = { answer?: unknown; citations?: unknown };
export type NormalizedAssistantResult = { answer: string; citations: Citation[] };

function buildContextBlock(
  assets: AssetContext[],
  documents: DocumentContext[],
  timelineEvents: TimelineContext[],
  chunks: RetrievedChunk[],
): string {
  const parts = [
    `ASSETS (${assets.length}):`,
    JSON.stringify(assets, null, 0),
    `DOCUMENTS (${documents.length}):`,
    JSON.stringify(documents, null, 0),
    `TIMELINE EVENTS (${timelineEvents.length}):`,
    JSON.stringify(timelineEvents, null, 0),
  ];

  if (chunks.length > 0) {
    parts.push(
      'RELEVANT DOCUMENT EXCERPTS:',
      chunks.map((chunk) => `[document:${chunk.document_id}] ${chunk.content}`).join('\n---\n'),
    );
  }

  return parts.join('\n');
}

export function buildAssistantRequestBody(
  question: string,
  assets: AssetContext[],
  documents: DocumentContext[],
  timelineEvents: TimelineContext[],
  chunks: RetrievedChunk[],
  model: string,
) {
  return {
    model,
    messages: [
      { role: 'system', content: ASSISTANT_SYSTEM_PROMPT },
      { role: 'system', content: buildContextBlock(assets, documents, timelineEvents, chunks) },
      { role: 'user', content: question },
    ],
    response_format: { type: 'json_schema', json_schema: ASSISTANT_JSON_SCHEMA },
  };
}

function isValidCitation(value: unknown, validIds: Set<string>): value is Citation {
  if (!value || typeof value !== 'object') return false;
  const c = value as Record<string, unknown>;
  return (
    (c.type === 'asset' || c.type === 'document' || c.type === 'timeline_event') &&
    typeof c.id === 'string' &&
    validIds.has(c.id) &&
    typeof c.label === 'string' &&
    c.label.trim().length > 0
  );
}

/**
 * Drops any citation referencing an id we didn't actually supply as
 * context — the model returning structured JSON is not, by itself, a
 * guarantee it didn't fabricate an id string that looks plausible.
 */
export function normalizeAssistantResult(
  raw: RawAssistantResult,
  assets: AssetContext[],
  documents: DocumentContext[],
  timelineEvents: TimelineContext[] = [],
): NormalizedAssistantResult {
  const answer = typeof raw.answer === 'string' && raw.answer.trim() ? raw.answer.trim() : "I don't have that information yet.";

  const validIds = new Set<string>([
    ...assets.map((a) => a.id),
    ...documents.map((d) => d.id),
    ...timelineEvents.map((t) => t.id),
  ]);
  const citations = Array.isArray(raw.citations) ? raw.citations.filter((c) => isValidCitation(c, validIds)) : [];

  return { answer, citations };
}
