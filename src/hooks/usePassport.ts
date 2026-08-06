import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AnalyticsEvent, track } from '@/src/lib/analytics';
import { env } from '@/src/lib/env';
import { supabase } from '@/src/lib/supabase';
import type { PassportShareRow } from '@/src/types/database';

export function passportSharesQueryKey(propertyId: string | undefined) {
  return ['passport-shares', propertyId] as const;
}

export function usePassportShares(propertyId: string | undefined) {
  return useQuery<PassportShareRow[]>({
    queryKey: passportSharesQueryKey(propertyId),
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('passport_shares')
        .select('*')
        .eq('property_id', propertyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useGeneratePassport(propertyId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!propertyId) throw new Error('No property to generate a passport for.');
      const { data, error } = await supabase.functions.invoke('generate-passport', { body: { propertyId } });
      if (error) throw error;
      return data as { token: string; expiresAt: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: passportSharesQueryKey(propertyId) });
      track(AnalyticsEvent.PassportGenerated);
    },
  });
}

export function useRevokePassportShare(propertyId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shareId: string) => {
      const { error } = await supabase.from('passport_shares').update({ revoked_at: new Date().toISOString() }).eq('id', shareId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: passportSharesQueryKey(propertyId) }),
  });
}

/**
 * The link a homeowner shares with a buyer. Once the web build is deployed
 * (EXPO_PUBLIC_APP_URL set — see env.ts), this opens a real web page
 * anyone can view. Until then it falls back to the app's deep-link scheme,
 * which only opens for someone who already has Home Memory installed.
 */
export function passportShareUrl(token: string) {
  const base = env.EXPO_PUBLIC_APP_URL ?? 'homememory://';
  return `${base.replace(/\/$/, '')}/passport-view/${token}`;
}
