import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import type { MeterReadingInsert, MeterReadingRow, MeterType } from '@/src/types/database';

export function useMeterReadings(propertyId: string | undefined, meterType?: MeterType) {
  return useQuery<MeterReadingRow[]>({
    queryKey: ['meter-readings', propertyId, meterType],
    enabled: !!propertyId,
    queryFn: async () => {
      let query = supabase.from('meter_readings').select('*').eq('property_id', propertyId!).order('reading_date', { ascending: false }).limit(50);
      if (meterType) query = query.eq('meter_type', meterType);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateMeterReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: MeterReadingInsert) => {
      const { data, error } = await supabase.from('meter_readings').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (r) => { queryClient.invalidateQueries({ queryKey: ['meter-readings', r.property_id] }); },
  });
}

export function useDeleteMeterReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reading: Pick<MeterReadingRow, 'id' | 'property_id'>) => {
      const { error } = await supabase.from('meter_readings').delete().eq('id', reading.id);
      if (error) throw error;
      return reading;
    },
    onSuccess: (r) => { queryClient.invalidateQueries({ queryKey: ['meter-readings', r.property_id] }); },
  });
}

/** Calculate usage between the two most recent readings */
export function useEnergyUsage(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['energy-usage', propertyId],
    enabled: !!propertyId,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('meter_readings').select('*').eq('property_id', propertyId!)
        .order('reading_date', { ascending: false }).limit(100);
      if (error) throw error;

      const byType: Record<string, MeterReadingRow[]> = {};
      for (const r of data ?? []) {
        if (!byType[r.meter_type]) byType[r.meter_type] = [];
        byType[r.meter_type].push(r);
      }

      const usage: Record<string, { latest: number; previous: number; diff: number; unit: string; period: string } | null> = {};
      for (const [type, readings] of Object.entries(byType)) {
        if (readings.length >= 2) {
          const diff = readings[0].reading - readings[1].reading;
          const days = Math.ceil((new Date(readings[0].reading_date).getTime() - new Date(readings[1].reading_date).getTime()) / 86400000);
          usage[type] = { latest: readings[0].reading, previous: readings[1].reading, diff, unit: readings[0].unit, period: `${days} days` };
        } else {
          usage[type] = null;
        }
      }
      return usage;
    },
  });
}
