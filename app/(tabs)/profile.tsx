import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Badge, Button, Card, ListRow, Screen, Text, useTheme } from '@/src/design-system';
import { useDeleteAccount, useExportData } from '@/src/hooks/useAccountActions';
import { useHousehold, useProfile } from '@/src/hooks/useProfile';
import { supabase } from '@/src/lib/supabase';

export default function ProfileScreen() {
  const theme = useTheme();
  const { data: profile } = useProfile();
  const { data: household } = useHousehold();
  const [signingOut, setSigningOut] = useState(false);
  const exportData = useExportData();
  const deleteAccount = useDeleteAccount();

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete your account?',
      'This permanently deletes every home you own — properties, rooms, items, documents and history — along with your account. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: () => {
            deleteAccount.mutate(undefined, {
              onError: (err) =>
                Alert.alert('Could not delete account', err instanceof Error ? err.message : 'Please try again.'),
            });
          },
        },
      ],
    );
  }

  const entitlement = household?.subscription?.entitlement ?? 'free';
  const isPremium = entitlement !== 'free';

  return (
    <Screen edges={['top']}>
      <View style={{ paddingVertical: theme.spacing.md, gap: theme.spacing.lg }}>
        <Text variant="largeTitle">Profile</Text>

        <Card>
          <ListRow title={profile?.full_name || 'Your name'} subtitle={profile?.email ?? undefined} />
        </Card>

        <Card>
          <ListRow
            title={household?.name ?? 'My Home'}
            subtitle="Household"
            trailing={<Badge label={isPremium ? 'Premium' : 'Free plan'} tone={isPremium ? 'accent' : 'neutral'} />}
            onPress={isPremium ? undefined : () => router.push('/subscription/paywall')}
            showChevron={!isPremium}
          />
        </Card>

        <Card>
          <ListRow title="Family sharing" showChevron onPress={() => router.push('/family')} />
        </Card>

        <View style={{ gap: theme.spacing.xs }}>
          <Card>
            <ListRow
              title="Export my data"
              showChevron
              onPress={() =>
                exportData.mutate(undefined, {
                  onError: (err) =>
                    Alert.alert('Could not export your data', err instanceof Error ? err.message : 'Please try again.'),
                })
              }
            />
          </Card>
          <Card>
            <ListRow title="Privacy policy" showChevron onPress={() => router.push('/legal/privacy')} />
          </Card>
          <Card>
            <ListRow title="Terms of service" showChevron onPress={() => router.push('/legal/terms')} />
          </Card>
        </View>

        <Button label="Sign out" variant="secondary" onPress={handleSignOut} loading={signingOut} />
        <Button
          label="Delete account"
          variant="danger"
          onPress={handleDeleteAccount}
          loading={deleteAccount.isPending}
        />
      </View>
    </Screen>
  );
}
