import { router } from 'expo-router';
import { ActivityIndicator, FlatList, View } from 'react-native';

import { Badge, Button, Card, EmptyState, ListRow, Screen, Text, useTheme } from '@/src/design-system';
import { useAcceptInvite, useHouseholdMembers, usePendingInvitesForMe } from '@/src/hooks/useFamilySharing';
import { useHousehold } from '@/src/hooks/useProfile';
import { useSession } from '@/src/hooks/useSession';

export default function FamilySharingScreen() {
  const theme = useTheme();
  const { session } = useSession();
  const { data: household } = useHousehold();
  const { data: members, isLoading } = useHouseholdMembers(household?.id);
  const { data: pendingForMe } = usePendingInvitesForMe();
  const acceptInvite = useAcceptInvite();
  const isPremium = household?.subscription?.entitlement !== 'free';

  const myPendingInvites = (pendingForMe ?? []).filter((invite) => invite.household_id !== household?.id);

  return (
    <Screen edges={['bottom']}>
      <View style={{ paddingVertical: theme.spacing.md, gap: theme.spacing.md }}>
        {myPendingInvites.length > 0 ? (
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="headline">Invitations for you</Text>
            {myPendingInvites.map((invite) => (
              <Card key={invite.id}>
                <ListRow title="You've been invited to a home" subtitle="Join to see its full record" />
                <Button
                  label="Accept"
                  onPress={() => acceptInvite.mutate(invite.id)}
                  loading={acceptInvite.isPending}
                />
              </Card>
            ))}
          </View>
        ) : null}

        {isPremium ? (
          <Button label="Invite a family member" onPress={() => router.push('/family/invite')} />
        ) : (
          <Card>
            <Text variant="body" color="textSecondary">
              Family sharing is a Premium feature.
            </Text>
            <Button label="Upgrade to Premium" variant="secondary" onPress={() => router.push('/subscription/paywall')} />
          </Card>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={members ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl }}
          ListEmptyComponent={<EmptyState icon="👨‍👩‍👧" title="No members yet" />}
          renderItem={({ item }) => (
            <Card>
              <ListRow
                title={
                  item.status === 'invited'
                    ? (item.invited_email ?? 'Invited')
                    : item.user_id === session?.user.id
                      ? `You${item.role === 'owner' ? ' (owner)' : ''}`
                      : item.role === 'owner'
                        ? 'Owner'
                        : 'Family member'
                }
                subtitle={item.status === 'invited' ? 'Invitation pending' : undefined}
                trailing={item.status === 'invited' ? <Badge label="Pending" tone="neutral" /> : undefined}
              />
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
