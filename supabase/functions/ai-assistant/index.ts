// Deno Edge Function — deploy with `supabase functions deploy ai-assistant`.
// Not covered by this repo's Jest suite (different runtime); the pure logic
// it depends on lives in ./rag.ts and *is* unit tested.
import { createClient } from 'npm:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';
import { createEmbedding, extractUsage, logAiUsage } from '../_shared/openai.ts';
import {
  buildAssistantRequestBody,
  normalizeAssistantResult,
  type AssetContext,
  type DocumentContext,
  type RawAssistantResult,
  type RetrievedChunk,
  type TimelineContext,
} from './rag.ts';

const CHAT_MODEL = Deno.env.get('OPENAI_CHAT_MODEL') ?? 'gpt-4o-mini';
const MAX_CONTEXT_ROWS = 300;
const MATCH_COUNT = 6;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header' }, 401);
  }

  // Scoped to the caller's own JWT — every read below is RLS-limited to
  // properties this user can access, and the context we hand the model is
  // built exclusively from those RLS-filtered rows.
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });

  let propertyId: string;
  let question: string;
  let conversationId: string | undefined;
  try {
    const body = await req.json();
    propertyId = body.propertyId;
    question = typeof body.question === 'string' ? body.question.trim() : '';
    conversationId = body.conversationId;
    if (!propertyId || !question) throw new Error('propertyId and question are required');
  } catch {
    return jsonResponse({ error: 'Invalid request body — expected { propertyId, question }' }, 400);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonResponse({ error: 'Not authenticated' }, 401);

  // AI assistant is a Premium feature (see supabase/migrations/20260806000008_entitlements.sql),
  // with one exception: free households get exactly one question, ever,
  // as a taste of it (see migration 20260806000012_free_ai_question.sql).
  // Checked here, not just hidden in the UI — the same principle as the
  // DB-level limits on properties/documents/family sharing.
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('household_id')
    .eq('id', propertyId)
    .single();
  if (propertyError || !property) return jsonResponse({ error: 'Property not found or not accessible' }, 404);

  const { data: isPremium, error: premiumError } = await supabase.rpc('is_premium', {
    _household_id: property.household_id,
  });
  if (premiumError) return jsonResponse({ error: premiumError.message }, 500);
  if (!isPremium) {
    const { data: hasUsedFreeQuestion, error: freeQuestionError } = await supabase.rpc('has_used_free_ai_question', {
      _household_id: property.household_id,
    });
    if (freeQuestionError) return jsonResponse({ error: freeQuestionError.message }, 500);
    if (hasUsedFreeQuestion) {
      return jsonResponse(
        {
          error: 'premium_required',
          message: "You've used your free AI question — upgrade to Premium for unlimited questions.",
        },
        402,
      );
    }
  }

  try {
    const [assetsResult, documentsResult, timelineResult, apiKey] = await Promise.all([
      supabase
        .from('assets')
        .select('id, name, category, brand, model, serial_number, warranty_expiry, purchase_date, notes')
        .eq('property_id', propertyId)
        .limit(MAX_CONTEXT_ROWS),
      supabase
        .from('documents')
        .select('id, document_type, supplier, product_description, document_date, expiry_date, amount')
        .eq('property_id', propertyId)
        .limit(MAX_CONTEXT_ROWS),
      supabase
        .from('timeline_events')
        .select('id, event_type, title, description, event_date, cost')
        .eq('property_id', propertyId)
        .limit(MAX_CONTEXT_ROWS),
      Promise.resolve(Deno.env.get('OPENAI_API_KEY')),
    ]);

    if (assetsResult.error) throw assetsResult.error;
    if (documentsResult.error) throw documentsResult.error;
    if (timelineResult.error) throw timelineResult.error;
    if (!apiKey) throw new Error('OPENAI_API_KEY is not configured for this Supabase project');

    const assets = (assetsResult.data ?? []) as AssetContext[];
    const documents = (documentsResult.data ?? []) as DocumentContext[];
    const timelineEvents = (timelineResult.data ?? []) as TimelineContext[];

    // If this property has no data at all, don't bother calling OpenAI —
    // the honest answer is fixed and free.
    if (assets.length === 0 && documents.length === 0 && timelineEvents.length === 0) {
      const answer =
        "I don't have any information recorded for this property yet — scan a document or add an item first.";
      const conversation = await ensureConversation(supabase, conversationId, propertyId, user.id, question);
      await saveTurn(supabase, conversation, question, answer, []);
      return jsonResponse({ conversationId: conversation, answer, citations: [] });
    }

    const { embedding: questionEmbedding, usage: embeddingUsage } = await createEmbedding(apiKey, question);
    await logAiUsage(supabase, {
      householdId: property.household_id,
      propertyId,
      kind: 'embedding',
      model: 'text-embedding-3-small',
      usage: embeddingUsage,
    });
    const { data: chunkRows, error: chunkError } = await supabase.rpc('match_document_chunks', {
      _property_id: propertyId,
      _query_embedding: questionEmbedding,
      _match_count: MATCH_COUNT,
    });
    if (chunkError) throw chunkError;
    const chunks = (chunkRows ?? []) as RetrievedChunk[];

    const requestBody = buildAssistantRequestBody(question, assets, documents, timelineEvents, chunks, CHAT_MODEL);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`OpenAI request failed (${response.status}): ${detail}`);
    }

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('OpenAI response did not contain an answer');

    await logAiUsage(supabase, {
      householdId: property.household_id,
      propertyId,
      kind: 'ai_assistant',
      model: CHAT_MODEL,
      usage: extractUsage(payload),
    });

    const raw = JSON.parse(content) as RawAssistantResult;
    const normalized = normalizeAssistantResult(raw, assets, documents, timelineEvents);

    const conversation = await ensureConversation(supabase, conversationId, propertyId, user.id, question);
    await saveTurn(supabase, conversation, question, normalized.answer, normalized.citations);

    return jsonResponse({ conversationId: conversation, answer: normalized.answer, citations: normalized.citations });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown assistant error';
    return jsonResponse({ error: message }, 500);
  }
});

// deno-lint-ignore no-explicit-any
async function ensureConversation(
  supabase: any,
  conversationId: string | undefined,
  propertyId: string,
  userId: string,
  question: string,
): Promise<string> {
  if (conversationId) return conversationId;

  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({ property_id: propertyId, user_id: userId, title: question.slice(0, 80) })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function saveTurn(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  conversationId: string,
  question: string,
  answer: string,
  citations: unknown,
) {
  await supabase.from('ai_messages').insert([
    { conversation_id: conversationId, role: 'user', content: question },
    { conversation_id: conversationId, role: 'assistant', content: answer, citations },
  ]);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
