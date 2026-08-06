import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AnalyticsEvent, track } from '@/src/lib/analytics';
import { supabase } from '@/src/lib/supabase';
import type { DocumentInsert, DocumentRow, DocumentUpdate } from '@/src/types/database';

const SEARCHABLE_COLUMNS = ['original_filename', 'supplier', 'product_description', 'brand', 'model'] as const;

function applySearch<T extends { or: (filters: string) => T }>(query: T, search?: string): T {
  const term = search?.trim();
  if (!term) return query;
  const escaped = term.replace(/[%,]/g, '');
  const filters = SEARCHABLE_COLUMNS.map((column) => `${column}.ilike.%${escaped}%`).join(',');
  return query.or(filters);
}

export const allDocumentsQueryKey = (search?: string) => ['documents', 'all', search ?? ''] as const;

export function useAllDocuments(search?: string) {
  return useQuery<DocumentRow[]>({
    queryKey: allDocumentsQueryKey(search),
    queryFn: async () => {
      const filtered = applySearch(supabase.from('documents').select('*'), search);
      const { data, error } = await filtered.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function documentsByPropertyQueryKey(propertyId: string | undefined) {
  return ['documents', 'property', propertyId] as const;
}

export function useDocumentsByProperty(propertyId: string | undefined) {
  return useQuery<DocumentRow[]>({
    queryKey: documentsByPropertyQueryKey(propertyId),
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('property_id', propertyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useDocument(documentId: string | undefined) {
  return useQuery<DocumentRow>({
    queryKey: ['document', documentId],
    enabled: !!documentId,
    queryFn: async () => {
      const { data, error } = await supabase.from('documents').select('*').eq('id', documentId!).single();
      if (error) throw error;
      return data;
    },
    // The extraction Edge Function updates this row asynchronously;
    // poll while it's still processing so the review screen updates itself.
    refetchInterval: (query) => {
      const status = query.state.data?.extraction_status;
      return status === 'pending' || status === 'processing' ? 2000 : false;
    },
  });
}

export function useCreateDocumentDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DocumentInsert) => {
      const { data, error } = await supabase.from('documents').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (document) => {
      queryClient.invalidateQueries({ queryKey: documentsByPropertyQueryKey(document.property_id) });
      queryClient.invalidateQueries({ queryKey: ['documents', 'all'] });
      track(AnalyticsEvent.DocumentScanned, { document_id: document.id, document_type: document.document_type });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, update }: { id: string; update: DocumentUpdate }) => {
      const { data, error } = await supabase.from('documents').update(update).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (document) => {
      queryClient.setQueryData(['document', document.id], document);
      queryClient.invalidateQueries({ queryKey: documentsByPropertyQueryKey(document.property_id) });
      queryClient.invalidateQueries({ queryKey: ['documents', 'all'] });
      if (document.extraction_status === 'completed') {
        track(AnalyticsEvent.ExtractionConfirmed, { document_id: document.id });
      }
    },
  });
}

/** Kicks off (or retries) AI extraction for a document that's already been uploaded. */
export function useRequestExtraction() {
  return useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase.functions.invoke('extract-document', {
        body: { documentId },
      });
      if (error) throw error;
    },
  });
}
