import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import { useSession } from '@/src/hooks/useSession';
import type { HouseholdRow, ProfileRow, SubscriptionRow } from '@/src/types/database';

export function useProfile() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery<ProfileRow | null>({
    queryKey: ['profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useHousehold() {
  const { session } = useSession();
  const userId = session?.user.id;

  return useQuery<(HouseholdRow & { subscription: SubscriptionRow | null }) | null>({
    queryKey: ['household', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: household, error: householdError } = await supabase
        .from('households')
        .select('*')
        .single();
      if (householdError) throw householdError;

      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('household_id', household.id)
        .maybeSingle();
      if (subscriptionError) throw subscriptionError;

      return { ...household, subscription };
    },
  });
}
