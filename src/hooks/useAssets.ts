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
