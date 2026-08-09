import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AnalyticsEvent, track } from '@/src/lib/analytics';
import { DELETE_WINDOW_MESSAGE } from '@/src/lib/deleteWindow';
import { supabase } from '@/src/lib/supabase';
import type { AssetInsert, AssetRow, AssetUpdate } from '@/src/types/database';

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

export function useAssetsByProperty(propertyId: string | undefined) {
  return useQuery<AssetRow[]>({
    queryKey: ['assets', 'property', propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('property_id', propertyId!)
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

export function useUpdateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, update }: { id: string; update: AssetUpdate }) => {
      const { data, error } = await supabase.from('assets').update(update).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ queryKey: ['asset', asset.id] });
      queryClient.invalidateQueries({ queryKey: assetsQueryKey(asset.room_id ?? undefined) });
      queryClient.invalidateQueries({ queryKey: ['assets', 'property', asset.property_id] });
      queryClient.invalidateQueries({ queryKey: ['warranty-alerts'] });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (asset: Pick<AssetRow, 'id' | 'room_id'>) => {
      const { data, error } = await supabase.from('assets').delete().eq('id', asset.id).select('id');
      if (error) throw error;
      if (!data || data.length === 0) throw new Error(DELETE_WINDOW_MESSAGE);
      return asset;
    },
    onSuccess: (asset) => {
      queryClient.removeQueries({ queryKey: ['asset', asset.id] });
      queryClient.invalidateQueries({ queryKey: assetsQueryKey(asset.room_id ?? undefined) });
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
      queryClient.invalidateQueries({ queryKey: ['assets', 'property', asset.property_id] });
      track(AnalyticsEvent.AssetCaptured, { asset_id: asset.id, category: asset.category });
    },
  });
}
