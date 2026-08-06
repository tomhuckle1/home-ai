import { AnalyticsEvent } from '@/src/lib/analytics';

describe('AnalyticsEvent', () => {
  it('has no duplicate event name values', () => {
    const values = Object.values(AnalyticsEvent);
    expect(new Set(values).size).toBe(values.length);
  });

  it('uses snake_case string values', () => {
    for (const value of Object.values(AnalyticsEvent)) {
      expect(value).toMatch(/^[a-z]+(_[a-z]+)*$/);
    }
  });
});
