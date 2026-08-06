import { buildPassportSnapshot } from './snapshot';

const baseInput = {
  property: {
    address_line1: '10 Downing Street',
    address_line2: null,
    city: 'London',
    postcode: 'SW1A 2AA',
    property_type: 'terraced',
    tenure: 'freehold',
    year_built: 1735,
  },
  rooms: [{ id: 'r1', name: 'Kitchen', room_type: 'Kitchen' }],
  assets: [],
  documents: [],
  contractors: [],
  timeline: [
    { event_type: 'renovation', title: 'Kitchen renovated', event_date: '2023-06-01', cost: 12000 },
    { event_type: 'purchase', title: 'Bought property', event_date: '2020-01-15', cost: null },
    { event_type: 'repair', title: 'Roof repaired', event_date: '2024-03-10', cost: 800 },
  ],
};

describe('buildPassportSnapshot', () => {
  it('sorts the timeline oldest-first regardless of input order', () => {
    const snapshot = buildPassportSnapshot(baseInput);
    expect(snapshot.timeline.map((e) => e.event_date)).toEqual(['2020-01-15', '2023-06-01', '2024-03-10']);
  });

  it('includes a generated_at timestamp', () => {
    const fixedDate = new Date('2026-01-01T00:00:00.000Z');
    const snapshot = buildPassportSnapshot({ ...baseInput, generatedAt: fixedDate });
    expect(snapshot.generated_at).toBe('2026-01-01T00:00:00.000Z');
  });

  it('carries through every section without mutating the input', () => {
    const snapshot = buildPassportSnapshot(baseInput);
    expect(snapshot.property.postcode).toBe('SW1A 2AA');
    expect(snapshot.rooms).toHaveLength(1);
    expect(baseInput.timeline[0].event_date).toBe('2023-06-01');
  });
});
