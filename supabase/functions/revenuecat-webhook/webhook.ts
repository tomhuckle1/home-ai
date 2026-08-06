// Pure logic for the revenuecat-webhook Edge Function: mapping a
// RevenueCat event to the row we write into `subscriptions`. No
// Deno-only or network dependencies, so it's unit testable directly.
// Event type reference: https://www.revenuecat.com/docs/webhooks/event-types-and-fields

export type RevenueCatEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'UNCANCELLATION'
  | 'PRODUCT_CHANGE'
  | 'NON_RENEWING_PURCHASE'
  | 'CANCELLATION'
  | 'EXPIRATION'
  | 'BILLING_ISSUE'
  | 'TRANSFER'
  | 'SUBSCRIPTION_PAUSED'
  | 'TEMPORARY_ENTITLEMENT_GRANT';

export type RevenueCatEvent = {
  type: RevenueCatEventType;
  app_user_id: string;
  product_id?: string;
  period_type?: 'TRIAL' | 'INTRO' | 'NORMAL';
  expiration_at_ms?: number | null;
};

export type SubscriptionUpdate = {
  household_id: string;
  entitlement: 'free' | 'premium';
  status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired';
  product_id: string | null;
  current_period_end: string | null;
};

/**
 * CANCELLATION doesn't end access immediately (the user keeps Premium
 * until the period actually lapses, at which point RevenueCat sends
 * EXPIRATION) — so it's intentionally not mapped here; there is nothing
 * to change in `subscriptions` yet when it arrives.
 */
export function mapRevenueCatEvent(event: RevenueCatEvent): SubscriptionUpdate | null {
  const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null;
  const productId = event.product_id ?? null;

  switch (event.type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'UNCANCELLATION':
    case 'PRODUCT_CHANGE':
    case 'NON_RENEWING_PURCHASE':
    case 'TEMPORARY_ENTITLEMENT_GRANT':
      return {
        household_id: event.app_user_id,
        entitlement: 'premium',
        status: event.period_type === 'TRIAL' ? 'trialing' : 'active',
        product_id: productId,
        current_period_end: expiresAt,
      };
    case 'BILLING_ISSUE':
      // Grace period: RevenueCat/the store is still retrying payment —
      // access is kept (entitlement stays premium) but flagged.
      return {
        household_id: event.app_user_id,
        entitlement: 'premium',
        status: 'past_due',
        product_id: productId,
        current_period_end: expiresAt,
      };
    case 'EXPIRATION':
      return {
        household_id: event.app_user_id,
        entitlement: 'free',
        status: 'expired',
        product_id: productId,
        current_period_end: expiresAt,
      };
    case 'CANCELLATION':
    case 'TRANSFER':
    case 'SUBSCRIPTION_PAUSED':
      return null;
    default:
      return null;
  }
}
