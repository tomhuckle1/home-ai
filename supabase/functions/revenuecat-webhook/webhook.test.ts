import { mapRevenueCatEvent } from './webhook';

describe('mapRevenueCatEvent', () => {
  it('grants premium on INITIAL_PURCHASE', () => {
    const update = mapRevenueCatEvent({
      type: 'INITIAL_PURCHASE',
      app_user_id: 'household-1',
      product_id: 'premium_annual',
      period_type: 'NORMAL',
      expiration_at_ms: 1_800_000_000_000,
    });
    expect(update).toEqual({
      household_id: 'household-1',
      entitlement: 'premium',
      status: 'active',
      product_id: 'premium_annual',
      current_period_end: new Date(1_800_000_000_000).toISOString(),
    });
  });

  it('marks trialing when period_type is TRIAL', () => {
    const update = mapRevenueCatEvent({ type: 'INITIAL_PURCHASE', app_user_id: 'h1', period_type: 'TRIAL' });
    expect(update?.status).toBe('trialing');
    expect(update?.entitlement).toBe('premium');
  });

  it('revokes premium on EXPIRATION', () => {
    const update = mapRevenueCatEvent({ type: 'EXPIRATION', app_user_id: 'household-1' });
    expect(update).toEqual({
      household_id: 'household-1',
      entitlement: 'free',
      status: 'expired',
      product_id: null,
      current_period_end: null,
    });
  });

  it('keeps premium but flags past_due on BILLING_ISSUE (grace period)', () => {
    const update = mapRevenueCatEvent({ type: 'BILLING_ISSUE', app_user_id: 'h1' });
    expect(update?.entitlement).toBe('premium');
    expect(update?.status).toBe('past_due');
  });

  it('does not change anything on CANCELLATION — access continues until EXPIRATION', () => {
    expect(mapRevenueCatEvent({ type: 'CANCELLATION', app_user_id: 'h1' })).toBeNull();
  });

  it('restores premium on UNCANCELLATION', () => {
    const update = mapRevenueCatEvent({ type: 'UNCANCELLATION', app_user_id: 'h1' });
    expect(update?.entitlement).toBe('premium');
    expect(update?.status).toBe('active');
  });

  it('ignores TRANSFER and SUBSCRIPTION_PAUSED', () => {
    expect(mapRevenueCatEvent({ type: 'TRANSFER', app_user_id: 'h1' })).toBeNull();
    expect(mapRevenueCatEvent({ type: 'SUBSCRIPTION_PAUSED', app_user_id: 'h1' })).toBeNull();
  });
});
