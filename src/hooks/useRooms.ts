import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AnalyticsEvent, track } from '@/src/lib/analytics';
import { DELETE_BLOCKED_MESSAGE } from '@/src/lib/deleteGuard';
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

export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (room: Pick<RoomRow, 'id' | 'property_id'>) => {
      // Assets/documents point back at a room with ON DELETE SET NULL, not
      // CASCADE — they'd survive a room delete, but there's nowhere in the
      // app to see an "unassigned" item afterwards. Block it instead of
      // silently orphaning them.
      const { count, error: countError } = await supabase
        .from('assets')
        .select('id', { count: 'exact', head: true })
        .eq('room_id', room.id);
      if (countError) throw countError;
      if (count && count > 0) {
        throw new Error(`Move or delete the ${count} item${count === 1 ? '' : 's'} in this room first.`);
      }

      const { data, error } = await supabase.from('rooms').delete().eq('id', room.id).select('id');
      if (error) throw error;
      if (!data || data.length === 0) throw new Error(DELETE_BLOCKED_MESSAGE);
      return room;
    },
    onSuccess: (room) => {
      queryClient.removeQueries({ queryKey: ['room', room.id] });
      queryClient.invalidateQueries({ queryKey: roomsQueryKey(room.property_id) });
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

export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, update }: { id: string; update: Partial<Pick<RoomRow, 'name' | 'room_type' | 'floor' | 'photo_path' | 'sort_order'>> }) => {
      const { data, error } = await supabase.from('rooms').update(update).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ['room', room.id] });
      queryClient.invalidateQueries({ queryKey: roomsQueryKey(room.property_id) });
    },
  });
}
