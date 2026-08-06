import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
