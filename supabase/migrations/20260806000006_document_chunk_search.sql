-- Home Memory: semantic search RPC for the AI assistant (Phase 3)
-- SECURITY INVOKER (the default) so this runs as the calling user —
-- document_chunks' existing RLS policy already scopes results to
-- properties they can access; this function does not need to re-derive
-- that access rule itself.

create or replace function public.match_document_chunks(
  _property_id uuid,
  _query_embedding extensions.vector(1536),
  _match_count int default 6
)
returns table (
  document_id uuid,
  content text,
  similarity float
)
language sql
stable
set search_path = public, extensions
as $$
  select
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> _query_embedding) as similarity
  from public.document_chunks dc
  where dc.property_id = _property_id
    and dc.embedding is not null
  order by dc.embedding <=> _query_embedding
  limit _match_count;
$$;
