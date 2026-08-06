import type { TimelineEventType } from '@/src/types/database';

export const TIMELINE_EVENT_ICON: Record<TimelineEventType, string> = {
  purchase: '🏡',
  sale: '💰',
  renovation: '🔨',
  repair: '🔧',
  maintenance_completed: '✅',
  document_added: '📄',
  asset_added: '📦',
  insurance_renewed: '🛡️',
  other: '📌',
};
