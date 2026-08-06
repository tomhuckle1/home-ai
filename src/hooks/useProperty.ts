import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AnalyticsEvent, track } from '@/src/lib/analytics';
import { supabase } from '@/src/lib/supabase';
import type { PropertyInsert, PropertyRow } from '@/src/types/database';

import { propertiesQueryKey } from './useProperties';

export function useProperty(propertyId: string | undefined) {
  return useQuery<PropertyRow>({
    queryKey: ['property', propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase.from('properties').select('*').eq('id', propertyId!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PropertyInsert) => {
      const { data, error } = await supabase.from('properties').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (property) => {
      queryClient.invalidateQueries({ queryKey: propertiesQueryKey });
      track(AnalyticsEvent.PropertyCreated, { property_id: property.id });
    },
  });
}
