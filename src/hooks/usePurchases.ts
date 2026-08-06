import { useMutation, useQuery } from '@tanstack/react-query';

import { AnalyticsEvent, track } from '@/src/lib/analytics';
import { fetchCurrentOffering, purchasePackage, restorePurchases } from '@/src/lib/purchases';

export function useCurrentOffering(householdId: string | undefined) {
  return useQuery({
    queryKey: ['revenuecat-offering', householdId],
    enabled: !!householdId,
    queryFn: () => fetchCurrentOffering(householdId!),
    retry: false,
  });
}

export function usePurchasePackage(householdId: string | undefined) {
  return useMutation({
    mutationFn: async (pkg: import('react-native-purchases').PurchasesPackage) => {
      if (!householdId) throw new Error('No household to purchase for.');
      track(AnalyticsEvent.UpgradeStarted, { package_id: pkg.identifier });
      const result = await purchasePackage(householdId, pkg);
      return result;
    },
    onSuccess: () => track(AnalyticsEvent.UpgradeCompleted),
  });
}

export function useRestorePurchases(householdId: string | undefined) {
  return useMutation({
    mutationFn: async () => {
      if (!householdId) throw new Error('No household to restore for.');
      return restorePurchases(householdId);
    },
  });
}
