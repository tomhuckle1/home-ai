import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AnalyticsEvent, track } from '@/src/lib/analytics';
import { supabase } from '@/src/lib/supabase';
import type { RoomInsert, RoomRow } from '@/src/types/database';

export function roomsQueryKey(propertyId: string | undefined) {
  return ['rooms', propertyId] as const;
}

export function useRooms(propertyId: string | undefined) {
  return useQuery<RoomRow[]>({
    queryKey: roomsQueryKey(propertyId),
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('property_id', propertyId!)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useRoom(roomId: string | undefined) {
  return useQuery<RoomRow>({
    queryKey: ['room', roomId],
    enabled: !!roomId,
    queryFn: async () => {
      const { data, error } = await supabase.from('rooms').select('*').eq('id', roomId!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RoomInsert) => {
      const { data, error } = await supabase.from('rooms').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: roomsQueryKey(room.property_id) });
      track(AnalyticsEvent.RoomCreated, { room_id: room.id });
    },
  });
}
