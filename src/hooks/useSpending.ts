import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';

export type SpendingSummary = {
  totalSpent: number;
  thisYear: number;
  byCategory: Record<string, number>;
  recentItems: { title: string; cost: number; date: string }[];
};

export function useSpendingSummary(propertyId: string | undefined) {
  return useQuery<SpendingSummary>({
    queryKey: ['spending', propertyId],
    enabled: !!propertyId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data: events, error } = await supabase
        .from('timeline_events')
        .select('title, event_type, cost, event_date')
        .eq('property_id', propertyId!)
        .not('cost', 'is', null)
        .gt('cost', 0)
        .order('event_date', { ascending: false });

      if (error) throw error;

      const currentYear = new Date().getFullYear().toString();
      let totalSpent = 0;
      let thisYear = 0;
      const byCategory: Record<string, number> = {};
      const recentItems: SpendingSummary['recentItems'] = [];

      for (const event of events ?? []) {
        const cost = event.cost ?? 0;
        totalSpent += cost;
        if (event.event_date.startsWith(currentYear)) thisYear += cost;
        byCategory[event.event_type] = (byCategory[event.event_type] ?? 0) + cost;
        if (recentItems.length < 5) {
          recentItems.push({ title: event.title, cost, date: event.event_date });
        }
      }

      return { totalSpent, thisYear, byCategory, recentItems };
    },
  });
}
