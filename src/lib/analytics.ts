import PostHog from 'posthog-react-native';
import type { PostHogEventProperties } from '@posthog/core';

import { env } from './env';

// A small, deliberate set of lifecycle events — not autocapture — so
// analytics stays aligned with the activation/retention risks in
// docs/planning/01-product-analysis-and-risks.md instead of screen-view noise.
export const AnalyticsEvent = {
  SignedUp: 'signed_up',
  SignedIn: 'signed_in',
  SignedOut: 'signed_out',
  PropertyCreated: 'property_created',
  RoomCreated: 'room_created',
  AssetCaptured: 'asset_captured',
  DocumentScanned: 'document_scanned',
  ExtractionConfirmed: 'extraction_confirmed',
  ReminderCompleted: 'reminder_completed',
  AiQuestionAsked: 'ai_question_asked',
  PassportGenerated: 'passport_generated',
  UpgradeStarted: 'upgrade_started',
  UpgradeCompleted: 'upgrade_completed',
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

let client: PostHog | null = null;

export function getAnalyticsClient(): PostHog | null {
  if (!env.EXPO_PUBLIC_POSTHOG_API_KEY) {
    return null;
  }
  if (!client) {
    client = new PostHog(env.EXPO_PUBLIC_POSTHOG_API_KEY, {
      host: env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
      // We fire a small, explicit event set — the SDK's own autocapture is
      // intentionally left off (see AnalyticsEvent above).
      captureAppLifecycleEvents: false,
    });
  }
  return client;
}

export function track(event: AnalyticsEventName, properties?: PostHogEventProperties) {
  getAnalyticsClient()?.capture(event, properties);
}

export function identifyUser(userId: string, properties?: PostHogEventProperties) {
  getAnalyticsClient()?.identify(userId, properties);
}

export function resetAnalytics() {
  getAnalyticsClient()?.reset();
}

export function captureException(error: unknown, context?: PostHogEventProperties) {
  getAnalyticsClient()?.captureException(error, context);
}
