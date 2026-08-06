import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';

import { Badge, Button, Card, EmptyState, ListRow, Screen, Text, useTheme } from '@/src/design-system';
import { useHousehold } from '@/src/hooks/useProfile';
import { useGeneratePassport, usePassportShares, useRevokePassportShare, passportShareUrl } from '@/src/hooks/usePassport';

export default function PassportScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const theme = useTheme();
  const { data: household } = useHousehold();
  const { data: shares, isLoading } = usePassportShares(propertyId);
  const generate = useGeneratePassport(propertyId);
  const revoke = useRevokePassportShare(propertyId);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const isPremium = household?.subscription?.entitlement !== 'free';

  async function handleCopy(token: string, id: string) {
    await Clipboard.setStringAsync(passportShareUrl(token));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <Screen edges={['bottom']}>
      <View style={{ paddingVertical: theme.spacing.md, gap: theme.spacing.md }}>
        <Text variant="body" color="textSecondary">
          A Home Passport is a secure link with your property&apos;s full record — appliances, manuals, receipts,
          improvements and maintenance history — for a buyer to view without needing the app. Links expire after 90
          days, and you can revoke one at any time.
        </Text>
        {isPremium ? (
          <Button label="Generate a new passport" onPress={() => generate.mutate()} loading={generate.isPending} />
        ) : (
          <Card>
            <Text variant="body" color="textSecondary">
              Home Passport is a Premium feature.
            </Text>
          </Card>
        )}
        {generate.isError ? (
          <Text variant="footnote" color="danger">
            {generate.error instanceof Error ? generate.error.message : 'Could not generate a passport.'}
          </Text>
        ) : null}
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={shares ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl }}
          ListEmptyComponent={<EmptyState icon="🔑" title="No passports generated yet" />}
          renderItem={({ item }) => {
            const expired = new Date(item.expires_at) < new Date();
            const status = item.revoked_at ? 'Revoked' : expired ? 'Expired' : 'Active';
            return (
              <Card>
                <ListRow
                  title={`Generated ${item.created_at.slice(0, 10)}`}
                  subtitle={`${item.viewed_count} view${item.viewed_count === 1 ? '' : 's'} · expires ${item.expires_at.slice(0, 10)}`}
                  trailing={<Badge label={status} tone={status === 'Active' ? 'accent' : 'neutral'} />}
                />
                {status === 'Active' ? (
                  <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
                    <View style={{ flex: 1 }}>
                      <Button
                        label={copiedId === item.id ? 'Copied!' : 'Copy link'}
                        variant="secondary"
                        onPress={() => handleCopy(item.token, item.id)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button label="Revoke" variant="danger" onPress={() => revoke.mutate(item.id)} loading={revoke.isPending} />
                    </View>
                  </View>
                ) : null}
              </Card>
            );
          }}
        />
      )}
    </Screen>
  );
}
