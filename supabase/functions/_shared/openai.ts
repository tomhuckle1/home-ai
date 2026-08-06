// Shared OpenAI REST helpers for Edge Functions. Deliberately plain
// `fetch` calls rather than the `openai` SDK — avoids any Deno/npm
// compatibility questions for a couple of simple JSON endpoints.

const EMBEDDING_MODEL = 'text-embedding-3-small';

export type OpenAiUsage = { promptTokens: number; completionTokens: number; totalTokens: number };

export type EmbeddingResult = { embedding: number[]; usage: OpenAiUsage };

export async function createEmbedding(apiKey: string, input: string): Promise<EmbeddingResult> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI embeddings request failed (${response.status}): ${detail}`);
  }

  const payload = await response.json();
  const embedding = payload.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) throw new Error('OpenAI embeddings response missing embedding array');

  return { embedding, usage: extractUsage(payload) };
}

export function extractUsage(payload: { usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }): OpenAiUsage {
  const usage = payload.usage ?? {};
  return {
    promptTokens: usage.prompt_tokens ?? 0,
    completionTokens: usage.completion_tokens ?? 0,
    totalTokens: usage.total_tokens ?? (usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0),
  };
}

// deno-lint-ignore no-explicit-any
export async function logAiUsage(
  supabase: any,
  event: {
    householdId: string;
    propertyId?: string;
    kind: 'document_extraction' | 'embedding' | 'ai_assistant';
    model: string;
    usage: OpenAiUsage;
  },
) {
  const { error } = await supabase.from('ai_usage_events').insert({
    household_id: event.householdId,
    property_id: event.propertyId ?? null,
    kind: event.kind,
    model: event.model,
    prompt_tokens: event.usage.promptTokens,
    completion_tokens: event.usage.completionTokens,
    total_tokens: event.usage.totalTokens,
  });
  // Best-effort — usage logging must never break the actual feature.
  if (error) console.error('Failed to log AI usage event', error);
}
