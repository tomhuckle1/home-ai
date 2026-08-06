import type { AssetCategory, DocumentType } from '@/src/types/database';

export const ASSET_CATEGORIES: { value: AssetCategory; label: string }[] = [
  { value: 'appliance', label: 'Appliance' },
  { value: 'heating', label: 'Heating' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'structural', label: 'Structural' },
  { value: 'fixture', label: 'Fixture' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'garden', label: 'Garden' },
  { value: 'security', label: 'Security' },
  { value: 'other', label: 'Other' },
];

export const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'receipt', label: 'Receipt' },
  { value: 'manual', label: 'Manual' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'insurance_policy', label: 'Insurance' },
  { value: 'epc', label: 'EPC' },
  { value: 'gas_safety_record', label: 'Gas safety' },
  { value: 'fensa_certificate', label: 'FENSA' },
  { value: 'mortgage_document', label: 'Mortgage' },
  { value: 'other', label: 'Other' },
];
