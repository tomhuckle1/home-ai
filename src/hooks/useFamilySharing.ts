import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/src/hooks/useSession';
import { supabase } from '@/src/lib/supabase';
import type { HouseholdMemberRow } from '@/src/types/database';

export function useHouseholdMembers(householdId: string | undefined) {
  return useQuery<HouseholdMemberRow[]>({
    queryKey: ['household-members', householdId],
    enabled: !!householdId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('household_members')
        .select('*')
        .eq('household_id', householdId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useInviteFamilyMember(householdId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string) => {
      if (!householdId) throw new Error('No household to invite into.');
      const { error } = await supabase
        .from('household_members')
        .insert({ household_id: householdId, invited_email: email.trim().toLowerCase(), status: 'invited' });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['household-members', householdId] }),
  });
}

/** Invites addressed to the current signed-in user's own email, from any household. */
export function usePendingInvitesForMe() {
  const { session } = useSession();

  return useQuery<HouseholdMemberRow[]>({
    queryKey: ['pending-invites', session?.user.email],
    enabled: !!session?.user.email,
    queryFn: async () => {
      const { data, error } = await supabase.from('household_members').select('*').eq('status', 'invited');
      if (error) throw error;
      return data;
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (householdMemberId: string) => {
      const { error } = await supabase.rpc('accept_household_invite', { _household_member_id: householdMemberId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-invites'] });
      queryClient.invalidateQueries({ queryKey: ['household'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}
