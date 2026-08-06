// Deno Edge Function — deploy with `supabase functions deploy extract-document`.
// Not covered by this repo's Jest suite (different runtime); the pure logic
// it depends on lives in ./extraction.ts and *is* unit tested.
import { createClient } from 'npm:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';
import { createEmbedding } from '../_shared/openai.ts';
import {
  buildEmbeddingInput,
  buildOpenAiRequestBody,
  normalizeExtractionResult,
  type RawExtractionResult,
} from './extraction.ts';

const OPENAI_MODEL = Deno.env.get('OPENAI_VISION_MODEL') ?? 'gpt-4o-mini';
const SIGNED_URL_TTL_SECONDS = 300;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header' }, 401);
  }

  // Scoped to the caller's own JWT, not the service role — every read/write
  // below goes through the same RLS policies the app itself is bound by,
  // so this function can never touch a document the caller can't already see.
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });

  let documentId: string;
  try {
    const body = await req.json();
    documentId = body.documentId;
    if (!documentId) throw new Error('documentId is required');
  } catch {
    return jsonResponse({ error: 'Invalid request body — expected { documentId }' }, 400);
  }

  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('id, file_path, property_id')
    .eq('id', documentId)
    .single();

  if (fetchError || !document) {
    return jsonResponse({ error: 'Document not found or not accessible' }, 404);
  }

  await supabase.from('documents').update({ extraction_status: 'processing' }).eq('id', documentId);

  try {
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(document.file_path, SIGNED_URL_TTL_SECONDS);
    if (signedUrlError || !signedUrlData) throw new Error(signedUrlError?.message ?? 'Could not sign file URL');

    const raw = await callOpenAi(signedUrlData.signedUrl);
    const normalized = normalizeExtractionResult(raw);

    const { error: updateError } = await supabase
      .from('documents')
      .update({
        ...normalized,
        ai_extracted: raw,
        extraction_status: 'needs_review',
        extraction_error: null,
      })
      .eq('id', documentId);
    if (updateError) throw updateError;

    // Best-effort: the document itself is already saved and reviewable even
    // if embedding generation fails, so this doesn't roll back the update above.
    try {
      const apiKey = Deno.env.get('OPENAI_API_KEY')!;
      const embedding = await createEmbedding(apiKey, buildEmbeddingInput(normalized));
      await supabase.from('document_chunks').insert({
        document_id: documentId,
        property_id: document.property_id,
        chunk_index: 0,
        content: buildEmbeddingInput(normalized),
        embedding,
      });
    } catch (embeddingError) {
      console.error('Embedding generation failed for document', documentId, embeddingError);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown extraction error';
    await supabase
      .from('documents')
      .update({ extraction_status: 'failed', extraction_error: message })
      .eq('id', documentId);
    return jsonResponse({ error: message }, 500);
  }
});

async function callOpenAi(imageUrl: string): Promise<RawExtractionResult> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured for this Supabase project');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(buildOpenAiRequestBody(imageUrl, OPENAI_MODEL)),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${detail}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('OpenAI response did not contain extraction content');

  return JSON.parse(content) as RawExtractionResult;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
