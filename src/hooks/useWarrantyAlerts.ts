import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import type { AssetRow } from '@/src/types/database';

export type WarrantyAlert = {
  asset: AssetRow;
  daysUntilExpiry: number;
  status: 'expired' | 'expiring_soon' | 'active';
};

export function useWarrantyAlerts(propertyId: string | undefined) {
  return useQuery<WarrantyAlert[]>({
    queryKey: ['warranty-alerts', propertyId],
    enabled: !!propertyId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('property_id', propertyId!)
        .not('warranty_expiry', 'is', null)
        .order('warranty_expiry', { ascending: true });

      if (error) throw error;

      const now = dayjs();
      const alerts: WarrantyAlert[] = [];

      for (const asset of data ?? []) {
        if (!asset.warranty_expiry) continue;
        const expiry = dayjs(asset.warranty_expiry);
        const daysUntilExpiry = expiry.diff(now, 'day');

        if (daysUntilExpiry < 90) {
          alerts.push({
            asset,
            daysUntilExpiry,
            status: daysUntilExpiry < 0 ? 'expired' : 'expiring_soon',
          });
        }
      }

      return alerts;
    },
  });
}
