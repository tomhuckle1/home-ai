import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import type { PropertyRow } from '@/src/types/database';

export const propertiesQueryKey = ['properties'] as const;

export function useProperties() {
  return useQuery<PropertyRow[]>({
    queryKey: propertiesQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}
