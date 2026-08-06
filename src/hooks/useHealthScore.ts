import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';

export function useHomeHealthScore(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['health-score', propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('compute_home_health_score', { _property_id: propertyId! });
      if (error) throw error;
      return data[0] as { score: number; breakdown: Record<string, unknown> };
    },
    staleTime: 5 * 60_000,
  });
}
