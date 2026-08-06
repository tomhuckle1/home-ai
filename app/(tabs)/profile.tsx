import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Badge, Button, Card, ListRow, Screen, Text, useTheme } from '@/src/design-system';
import { useHousehold, useProfile } from '@/src/hooks/useProfile';
import { supabase } from '@/src/lib/supabase';

export default function ProfileScreen() {
  const theme = useTheme();
  const { data: profile } = useProfile();
  const { data: household } = useHousehold();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
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

        <Button label="Sign out" variant="secondary" onPress={handleSignOut} loading={signingOut} />
      </View>
    </Screen>
  );
}
