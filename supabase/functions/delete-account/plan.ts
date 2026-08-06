// Pure logic for delete-account: deciding what a user's household
// memberships mean for deletion. No Deno-only dependencies — testable
// directly. See docs/planning/03-database-schema.md's cascade note and
// decisions D1/D8 — the household is the tenancy boundary, so deletion
// has to key off household ownership, not just "delete everything with
// my user_id on it".

export type Membership = { household_id: string; role: 'owner' | 'member' };

export type DeletionPlan = {
  /** Households this user owns — deleted entirely (cascades to everything under them). */
  householdsToDelete: string[];
  /** Households this user is a member of but doesn't own — only their membership is removed. */
  membershipsToLeave: string[];
};

export function planAccountDeletion(memberships: Membership[]): DeletionPlan {
  const householdsToDelete: string[] = [];
  const membershipsToLeave: string[] = [];

  for (const membership of memberships) {
    if (membership.role === 'owner') {
      householdsToDelete.push(membership.household_id);
    } else {
      membershipsToLeave.push(membership.household_id);
    }
  }

  return { householdsToDelete, membershipsToLeave };
}
