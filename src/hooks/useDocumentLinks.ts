import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import type { AssetRow, DocumentRow, DocumentType, DocumentUpdate } from '@/src/types/database';

/** Documents linked to a specific asset (via asset_id or document_assets junction) */
export function useDocumentsByAsset(assetId: string | undefined) {
  return useQuery<DocumentRow[]>({
    queryKey: ['documents', 'asset', assetId],
    enabled: !!assetId,
    queryFn: async () => {
      // Direct link
      const { data: direct, error: directErr } = await supabase
        .from('documents')
        .select('*')
        .eq('asset_id', assetId!)
        .order('created_at', { ascending: false });
      if (directErr) throw directErr;

      // Junction table links
      const { data: junctionLinks, error: junctionErr } = await supabase
        .from('document_assets')
        .select('document_id')
        .eq('asset_id', assetId!);
      if (junctionErr) throw junctionErr;

      const junctionDocIds = (junctionLinks ?? []).map((l) => l.document_id);
      const directIds = new Set((direct ?? []).map((d) => d.id));
      const extraIds = junctionDocIds.filter((id) => !directIds.has(id));

      if (extraIds.length === 0) return direct ?? [];

      const { data: extra, error: extraErr } = await supabase
        .from('documents')
        .select('*')
        .in('id', extraIds)
        .order('created_at', { ascending: false });
      if (extraErr) throw extraErr;

      return [...(direct ?? []), ...(extra ?? [])];
    },
  });
}

/** Documents linked to a specific room */
export function useDocumentsByRoom(roomId: string | undefined) {
  return useQuery<DocumentRow[]>({
    queryKey: ['documents', 'room', roomId],
    enabled: !!roomId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('room_id', roomId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/** Property-level documents — no asset or room link */
export function usePropertyDocuments(propertyId: string | undefined) {
  return useQuery<DocumentRow[]>({
    queryKey: ['documents', 'property-level', propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('property_id', propertyId!)
        .is('asset_id', null)
        .is('room_id', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/** Property-level assets — items with no room (structural, property-wide) */
export function usePropertyAssets(propertyId: string | undefined) {
  return useQuery<AssetRow[]>({
    queryKey: ['assets', 'property-level', propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('property_id', propertyId!)
        .is('room_id', null)
        .eq('status', 'active')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

/** Auto-match: find assets that match a document's brand/model */
export function useAutoMatchAssets(propertyId: string | undefined, brand: string | null, model: string | null) {
  return useQuery<AssetRow[]>({
    queryKey: ['auto-match', propertyId, brand, model],
    enabled: !!propertyId && !!(brand || model),
    queryFn: async () => {
      let query = supabase.from('assets').select('*').eq('property_id', propertyId!);

      if (brand && model) {
        query = query.or(`brand.ilike.%${brand}%,model.ilike.%${model}%`);
      } else if (brand) {
        query = query.ilike('brand', `%${brand}%`);
      } else if (model) {
        query = query.ilike('model', `%${model}%`);
      }

      const { data, error } = await query.limit(5);
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}

/** Find a previous version of a renewable document */
export function usePreviousDocument(propertyId: string | undefined, documentType: DocumentType, currentDocId: string | undefined) {
  return useQuery<DocumentRow | null>({
    queryKey: ['previous-document', propertyId, documentType, currentDocId],
    enabled: !!propertyId && !!currentDocId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('property_id', propertyId!)
        .eq('document_type', documentType)
        .neq('id', currentDocId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Link a document to an asset via the junction table */
export function useLinkDocumentToAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, assetId }: { documentId: string; assetId: string }) => {
      const { error } = await supabase.from('document_assets').insert({ document_id: documentId, asset_id: assetId });
      if (error) throw error;
    },
    onSuccess: (_, { documentId, assetId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'asset', assetId] });
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
    },
  });
}

/** Update a document's primary asset_id link */
export function useLinkDocumentPrimary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, assetId, contractorId }: { documentId: string; assetId?: string | null; contractorId?: string | null }) => {
      const update: DocumentUpdate = {};
      if (assetId !== undefined) update.asset_id = assetId;
      if (contractorId !== undefined) update.contractor_id = contractorId;
      const { error } = await supabase.from('documents').update(update).eq('id', documentId);
      if (error) throw error;
    },
    onSuccess: (_, { documentId, assetId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (assetId) queryClient.invalidateQueries({ queryKey: ['documents', 'asset', assetId] });
    },
  });
}
