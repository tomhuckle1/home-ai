import { planAccountDeletion } from './plan';

describe('planAccountDeletion', () => {
  it('deletes every household the user owns', () => {
    const plan = planAccountDeletion([
      { household_id: 'h1', role: 'owner' },
      { household_id: 'h2', role: 'owner' },
    ]);
    expect(plan.householdsToDelete).toEqual(['h1', 'h2']);
    expect(plan.membershipsToLeave).toEqual([]);
  });

  it('only leaves a household the user is a member of, without deleting it', () => {
    const plan = planAccountDeletion([{ household_id: 'shared-home', role: 'member' }]);
    expect(plan.householdsToDelete).toEqual([]);
    expect(plan.membershipsToLeave).toEqual(['shared-home']);
  });

  it('handles a mix correctly — own household deleted, shared household just left', () => {
    const plan = planAccountDeletion([
      { household_id: 'my-home', role: 'owner' },
      { household_id: 'parents-home', role: 'member' },
    ]);
    expect(plan.householdsToDelete).toEqual(['my-home']);
    expect(plan.membershipsToLeave).toEqual(['parents-home']);
  });

  it('returns empty plans for no memberships', () => {
    expect(planAccountDeletion([])).toEqual({ householdsToDelete: [], membershipsToLeave: [] });
  });
});
