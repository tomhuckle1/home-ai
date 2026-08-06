// Shared OpenAI REST helpers for Edge Functions. Deliberately plain
// `fetch` calls rather than the `openai` SDK — avoids any Deno/npm
// compatibility questions for a couple of simple JSON endpoints.

const EMBEDDING_MODEL = 'text-embedding-3-small';

export async function createEmbedding(apiKey: string, input: string): Promise<number[]> {
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

  return embedding;
}
