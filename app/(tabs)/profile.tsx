import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Avatar, Badge, Button, Card, Divider, ListRow, Screen, Text, useTheme } from '@/src/design-system';
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
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}>
        <View style={{ paddingVertical: theme.spacing.md }}>
          <Text variant="largeTitle">Profile</Text>
        </View>

        {/* User card */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
            <Avatar name={profile?.full_name} size={56} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="headline">{profile?.full_name || 'Your name'}</Text>
              {profile?.email ? (
                <Text variant="footnote" color="textSecondary">
                  {profile.email}
                </Text>
              ) : null}
            </View>
            <Badge label={isPremium ? 'Premium' : 'Free'} tone={isPremium ? 'accent' : 'neutral'} />
          </View>
        </Card>

        {/* Upgrade prompt for free users */}
        {!isPremium ? (
          <Card
            style={{ marginTop: theme.spacing.sm }}
            onPress={() => router.push('/subscription/paywall')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.colors.accentMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="sparkles" size={20} color={theme.colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="headline">Upgrade to Premium</Text>
                <Text variant="footnote" color="textSecondary">
                  Unlimited AI, family sharing, and more
                </Text>
              </View>
              <Text variant="body" color="textTertiary">›</Text>
            </View>
          </Card>
        ) : null}

        <Divider spacing="lg" />

        {/* Household & sharing */}
        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="caption" color="textTertiary" style={{ marginBottom: 2 }}>
            HOUSEHOLD
          </Text>
          <Card>
            <ListRow
              leading={<Ionicons name="home-outline" size={20} color={theme.colors.textSecondary} />}
              title={household?.name ?? 'My Home'}
              subtitle="Household"
            />
          </Card>
          <Card>
            <ListRow
              leading={<Ionicons name="people-outline" size={20} color={theme.colors.textSecondary} />}
              title="Family sharing"
              showChevron
              onPress={() => router.push('/family')}
            />
          </Card>
        </View>

        <Divider spacing="lg" />

        {/* Data & legal */}
        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="caption" color="textTertiary" style={{ marginBottom: 2 }}>
            DATA & PRIVACY
          </Text>
          <Card>
            <ListRow
              leading={<Ionicons name="download-outline" size={20} color={theme.colors.textSecondary} />}
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
            <ListRow
              leading={<Ionicons name="shield-outline" size={20} color={theme.colors.textSecondary} />}
              title="Privacy policy"
              showChevron
              onPress={() => router.push('/legal/privacy')}
            />
          </Card>
          <Card>
            <ListRow
              leading={<Ionicons name="document-outline" size={20} color={theme.colors.textSecondary} />}
              title="Terms of service"
              showChevron
              onPress={() => router.push('/legal/terms')}
            />
          </Card>
        </View>

        <Divider spacing="lg" />

        <View style={{ gap: theme.spacing.sm }}>
          <Button label="Sign out" variant="secondary" onPress={handleSignOut} loading={signingOut} />
          <Button
            label="Delete account"
            variant="danger"
            onPress={handleDeleteAccount}
            loading={deleteAccount.isPending}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
