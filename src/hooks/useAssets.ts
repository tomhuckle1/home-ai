import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AnalyticsEvent, track } from '@/src/lib/analytics';
import { supabase } from '@/src/lib/supabase';
import type { AssetInsert, AssetRow } from '@/src/types/database';

export function assetsQueryKey(roomId: string | undefined) {
  return ['assets', 'room', roomId] as const;
}

export function useAssetsByRoom(roomId: string | undefined) {
  return useQuery<AssetRow[]>({
    queryKey: assetsQueryKey(roomId),
    enabled: !!roomId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('room_id', roomId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useAsset(assetId: string | undefined) {
  return useQuery<AssetRow>({
    queryKey: ['asset', assetId],
    enabled: !!assetId,
    queryFn: async () => {
      const { data, error } = await supabase.from('assets').select('*').eq('id', assetId!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (asset: Pick<AssetRow, 'id' | 'room_id'>) => {
      // Deliberately not removing storage here: an asset's primary_photo_path
      // is always a copy of the source document's file_path (see
      // handleSaveAsItem in app/document/[id].tsx) — that document may still
      // exist and reference the same object, so deleting it here could break
      // that document's photo. The document's own delete flow owns cleanup
      // of that storage object.
      const { error } = await supabase.from('assets').delete().eq('id', asset.id);
      if (error) throw error;
      return asset;
    },
    onSuccess: (asset) => {
      queryClient.removeQueries({ queryKey: ['asset', asset.id] });
      queryClient.invalidateQueries({ queryKey: assetsQueryKey(asset.room_id ?? undefined) });
      // Deleting an asset may have unlinked a timeline/maintenance entry.
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AssetInsert) => {
      const { data, error } = await supabase.from('assets').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ queryKey: assetsQueryKey(asset.room_id ?? undefined) });
      track(AnalyticsEvent.AssetCaptured, { asset_id: asset.id, category: asset.category });
    },
  });
}
