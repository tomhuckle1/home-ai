import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { DELETE_BLOCKED_MESSAGE } from '@/src/lib/deleteGuard';
import { supabase } from '@/src/lib/supabase';
import type { TimelineEventInsert, TimelineEventRow } from '@/src/types/database';

export function timelineQueryKey(propertyId: string | undefined) {
  return ['timeline', propertyId] as const;
}

export function useTimeline(propertyId: string | undefined) {
  return useQuery<TimelineEventRow[]>({
    queryKey: timelineQueryKey(propertyId),
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('property_id', propertyId!)
        .order('event_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useTimelineEvent(eventId: string | undefined) {
  return useQuery<TimelineEventRow & { contractor: { name: string; trade: string | null } | null }>({
    queryKey: ['timeline-event', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data: event, error } = await supabase.from('timeline_events').select('*').eq('id', eventId!).single();
      if (error) throw error;

      // A separate query, not a Postgrest embed — this schema's generated
      // types declare no table relationships (see NoRelationships in
      // src/types/database.ts), so an embed here can't be typed safely.
      let contractor: { name: string; trade: string | null } | null = null;
      if (event.related_contractor_id) {
        const { data: contractorRow } = await supabase
          .from('contractors')
          .select('name, trade')
          .eq('id', event.related_contractor_id)
          .maybeSingle();
        contractor = contractorRow ?? null;
      }

      return { ...event, contractor };
    },
  });
}

export function useDeleteTimelineEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: Pick<TimelineEventRow, 'id' | 'property_id'>) => {
      const { data, error } = await supabase.from('timeline_events').delete().eq('id', event.id).select('id');
      if (error) throw error;
      if (!data || data.length === 0) throw new Error(DELETE_BLOCKED_MESSAGE);
      return event;
    },
    onSuccess: (event) => {
      queryClient.removeQueries({ queryKey: ['timeline-event', event.id] });
      queryClient.invalidateQueries({ queryKey: timelineQueryKey(event.property_id) });
    },
  });
}

export function useCreateTimelineEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TimelineEventInsert) => {
      const { data, error } = await supabase.from('timeline_events').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: timelineQueryKey(event.property_id) });
    },
  });
}

export function useUpdateTimelineEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, update }: { id: string; update: Partial<{ title: string; event_date: string; cost: number | null; description: string | null }> }) => {
      const { data, error } = await supabase.from('timeline_events').update(update).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ['timeline-event', event.id] });
      queryClient.invalidateQueries({ queryKey: ['timeline', event.property_id] });
    },
  });
}
