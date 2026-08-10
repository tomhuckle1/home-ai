import type { InsurancePolicyType, MeterType } from '@/src/types/database';

export const POLICY_TYPE_LABELS: Record<InsurancePolicyType | string, string> = {
  home_buildings: 'Buildings Insurance',
  home_contents: 'Contents Insurance',
  car: 'Car Insurance',
  life: 'Life Insurance',
  pet: 'Pet Insurance',
  boiler_cover: 'Boiler Cover',
  gadget: 'Gadget Insurance',
  travel: 'Travel Insurance',
  other: 'Other Policy',
};

export function policyTypeLabel(type: string): string {
  return POLICY_TYPE_LABELS[type] ?? type.replace(/_/g, ' ');
}

export const METER_TYPE_LABELS: Record<MeterType | string, string> = {
  electricity: 'Electricity',
  gas: 'Gas',
  water: 'Water',
  solar_generation: 'Solar Generated',
  solar_export: 'Solar Exported',
};

export function meterTypeLabel(type: string): string {
  return METER_TYPE_LABELS[type] ?? type.replace(/_/g, ' ');
}
