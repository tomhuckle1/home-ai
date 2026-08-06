import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { Badge, Button, Card, Screen, Text, useTheme } from '@/src/design-system';
import { useHousehold } from '@/src/hooks/useProfile';
import { useCurrentOffering, usePurchasePackage, useRestorePurchases } from '@/src/hooks/usePurchases';
import { PurchasesUnavailableError } from '@/src/lib/purchases';
import type { PurchasesPackage } from 'react-native-purchases';

const FEATURES = [
  'Unlimited documents and photos',
  'AI assistant that answers from your own home records',
  'Family sharing',
  'Home Health Score',
  'Home Passport for selling your property',
];

export default function PaywallScreen() {
  const theme = useTheme();
  const { data: household } = useHousehold();
  const { data: offering, isLoading, error } = useCurrentOffering(household?.id);
  const purchase = usePurchasePackage(household?.id);
  const restore = useRestorePurchases(household?.id);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handlePurchase(pkg: PurchasesPackage) {
    setActionError(null);
    try {
      await purchase.mutateAsync(pkg);
      router.back();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Purchase could not be completed.');
    }
  }

  async function handleRestore() {
    setActionError(null);
    try {
      await restore.mutateAsync();
      router.back();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Nothing to restore.');
    }
  }

  const unavailable = error instanceof PurchasesUnavailableError;

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.xxs }}>
          <Badge label="Home Memory Premium" tone="accent" />
          <Text variant="title1">Everything about your home, remembered</Text>
        </View>

        <View style={{ gap: theme.spacing.xs }}>
          {FEATURES.map((feature) => (
            <View key={feature} style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
              <Text variant="body" color="accent">
                ✓
              </Text>
              <Text variant="body" style={{ flex: 1 }}>
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {isLoading ? (
          <ActivityIndicator />
        ) : unavailable ? (
          <Card>
            <Text variant="body" color="textSecondary">
              Purchases aren&apos;t available in this build (Expo Go doesn&apos;t include the payments module — this
              needs a development or production build).
            </Text>
          </Card>
        ) : !offering ? (
          <Card>
            <Text variant="body" color="textSecondary">
              Pricing isn&apos;t available right now — check back shortly.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            {offering.monthly ? (
              <PackageCard pkg={offering.monthly} onPress={() => handlePurchase(offering.monthly!)} loading={purchase.isPending} />
            ) : null}
            {offering.annual ? (
              <PackageCard
                pkg={offering.annual}
                onPress={() => handlePurchase(offering.annual!)}
                loading={purchase.isPending}
                badge="Best value"
              />
            ) : null}
          </View>
        )}

        {actionError ? (
          <Text variant="footnote" color="danger">
            {actionError}
          </Text>
        ) : null}

        <Button label="Restore purchases" variant="ghost" onPress={handleRestore} loading={restore.isPending} />

        {/* Apple App Store Review Guideline 3.1.2 requires this disclosure
            and functional links near the purchase button for auto-renewable
            subscriptions. */}
        <View style={{ gap: theme.spacing.xxs }}>
          <Text variant="caption" color="textTertiary">
            Subscriptions renew automatically at the price shown unless cancelled at least 24 hours before the end of
            the current period. Manage or cancel any time in your App Store or Play Store account settings.
          </Text>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <Text
              variant="caption"
              color="accent"
              accessibilityRole="link"
              onPress={() => router.push('/legal/terms')}
            >
              Terms of Service
            </Text>
            <Text
              variant="caption"
              color="accent"
              accessibilityRole="link"
              onPress={() => router.push('/legal/privacy')}
            >
              Privacy Policy
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function PackageCard({
  pkg,
  onPress,
  loading,
  badge,
}: {
  pkg: PurchasesPackage;
  onPress: () => void;
  loading: boolean;
  badge?: string;
}) {
  const theme = useTheme();
  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ gap: 2 }}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.xs, alignItems: 'center' }}>
            <Text variant="headline">{pkg.product.title || pkg.identifier}</Text>
            {badge ? <Badge label={badge} tone="accent" /> : null}
          </View>
          <Text variant="footnote" color="textSecondary">
            {pkg.product.description}
          </Text>
        </View>
        {loading ? <ActivityIndicator /> : <Text variant="headline">{pkg.product.priceString}</Text>}
      </View>
    </Card>
  );
}
