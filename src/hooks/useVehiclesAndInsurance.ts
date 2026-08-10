import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import type {
  InsurancePolicyInsert,
  InsurancePolicyRow,
  InsurancePolicyUpdate,
  RoomDetailInsert,
  RoomDetailRow,
  VehicleInsert,
  VehicleRow,
  VehicleUpdate,
} from '@/src/types/database';

/* ── Vehicles ─────────────────────────────────────────────────────── */

export function useVehicles(propertyId: string | undefined) {
  return useQuery<VehicleRow[]>({
    queryKey: ['vehicles', propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase.from('vehicles').select('*').eq('property_id', propertyId!).order('created_at');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: VehicleInsert) => {
      const { data, error } = await supabase.from('vehicles').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (v) => { queryClient.invalidateQueries({ queryKey: ['vehicles', v.property_id] }); },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, update }: { id: string; update: VehicleUpdate }) => {
      const { data, error } = await supabase.from('vehicles').update(update).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (v) => { queryClient.invalidateQueries({ queryKey: ['vehicles', v.property_id] }); },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vehicle: Pick<VehicleRow, 'id' | 'property_id'>) => {
      const { error } = await supabase.from('vehicles').delete().eq('id', vehicle.id);
      if (error) throw error;
      return vehicle;
    },
    onSuccess: (v) => { queryClient.invalidateQueries({ queryKey: ['vehicles', v.property_id] }); },
  });
}

/* ── Insurance ────────────────────────────────────────────────────── */

export function useInsurancePolicies(propertyId: string | undefined) {
  return useQuery<InsurancePolicyRow[]>({
    queryKey: ['insurance', propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase.from('insurance_policies').select('*').eq('property_id', propertyId!).order('renewal_date', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateInsurancePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: InsurancePolicyInsert) => {
      const { data, error } = await supabase.from('insurance_policies').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (p) => { queryClient.invalidateQueries({ queryKey: ['insurance', p.property_id] }); },
  });
}

export function useUpdateInsurancePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, update }: { id: string; update: InsurancePolicyUpdate }) => {
      const { data, error } = await supabase.from('insurance_policies').update(update).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (p) => { queryClient.invalidateQueries({ queryKey: ['insurance', p.property_id] }); },
  });
}

export function useDeleteInsurancePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (policy: Pick<InsurancePolicyRow, 'id' | 'property_id'>) => {
      const { error } = await supabase.from('insurance_policies').delete().eq('id', policy.id);
      if (error) throw error;
      return policy;
    },
    onSuccess: (p) => { queryClient.invalidateQueries({ queryKey: ['insurance', p.property_id] }); },
  });
}

/* ── Room details ─────────────────────────────────────────────────── */

export function useRoomDetails(roomId: string | undefined) {
  return useQuery<RoomDetailRow[]>({
    queryKey: ['room-details', roomId],
    enabled: !!roomId,
    queryFn: async () => {
      const { data, error } = await supabase.from('room_details').select('*').eq('room_id', roomId!).order('created_at');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateRoomDetail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RoomDetailInsert) => {
      const { data, error } = await supabase.from('room_details').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => { queryClient.invalidateQueries({ queryKey: ['room-details', d.room_id] }); },
  });
}

export function useDeleteRoomDetail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (detail: Pick<RoomDetailRow, 'id' | 'room_id'>) => {
      const { error } = await supabase.from('room_details').delete().eq('id', detail.id);
      if (error) throw error;
      return detail;
    },
    onSuccess: (d) => { queryClient.invalidateQueries({ queryKey: ['room-details', d.room_id] }); },
  });
}
