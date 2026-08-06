import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import { timelineQueryKey } from '@/src/hooks/useTimeline';
import type { MaintenanceTaskRow } from '@/src/types/database';

export function maintenanceQueryKey(propertyId: string | undefined) {
  return ['maintenance', propertyId] as const;
}

export function useUpcomingMaintenance(propertyId: string | undefined) {
  return useQuery<MaintenanceTaskRow[]>({
    queryKey: maintenanceQueryKey(propertyId),
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .select('*')
        .eq('property_id', propertyId!)
        .eq('is_active', true)
        .order('next_due_date', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCompleteMaintenanceTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { taskId: string; propertyId: string; cost?: number | null }) => {
      const { error } = await supabase.from('maintenance_completions').insert({
        maintenance_task_id: input.taskId,
        property_id: input.propertyId,
        cost: input.cost ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: maintenanceQueryKey(input.propertyId) });
      queryClient.invalidateQueries({ queryKey: timelineQueryKey(input.propertyId) });
    },
  });
}
