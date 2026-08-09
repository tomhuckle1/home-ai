import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AnalyticsEvent, track } from '@/src/lib/analytics';
import { supabase } from '@/src/lib/supabase';
import type { ContractorInsert, ContractorRow } from '@/src/types/database';

export function contractorsQueryKey(propertyId: string | undefined) {
  return ['contractors', propertyId] as const;
}

export function useContractors(propertyId: string | undefined) {
  return useQuery<ContractorRow[]>({
    queryKey: contractorsQueryKey(propertyId),
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contractors')
        .select('*')
        .eq('property_id', propertyId!)
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useContractor(contractorId: string | undefined) {
  return useQuery<ContractorRow>({
    queryKey: ['contractor', contractorId],
    enabled: !!contractorId,
    queryFn: async () => {
      const { data, error } = await supabase.from('contractors').select('*').eq('id', contractorId!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useContractorsByTrade(propertyId: string | undefined, trade: string | undefined) {
  return useQuery<ContractorRow[]>({
    queryKey: ['contractors', propertyId, 'trade', trade],
    enabled: !!propertyId && !!trade,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contractors')
        .select('*')
        .eq('property_id', propertyId!)
        .ilike('trade', `%${trade}%`)
        .order('rating', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateContractor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ContractorInsert) => {
      const { data, error } = await supabase.from('contractors').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (contractor) => {
      queryClient.invalidateQueries({ queryKey: contractorsQueryKey(contractor.property_id) });
    },
  });
}

export function useUpdateContractor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, update }: { id: string; update: Partial<ContractorInsert> }) => {
      const { data, error } = await supabase.from('contractors').update(update).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (contractor) => {
      queryClient.invalidateQueries({ queryKey: ['contractor', contractor.id] });
      queryClient.invalidateQueries({ queryKey: contractorsQueryKey(contractor.property_id) });
    },
  });
}

export function useDeleteContractor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contractor: Pick<ContractorRow, 'id' | 'property_id'>) => {
      const { error } = await supabase.from('contractors').delete().eq('id', contractor.id);
      if (error) throw error;
      return contractor;
    },
    onSuccess: (contractor) => {
      queryClient.removeQueries({ queryKey: ['contractor', contractor.id] });
      queryClient.invalidateQueries({ queryKey: contractorsQueryKey(contractor.property_id) });
    },
  });
}
