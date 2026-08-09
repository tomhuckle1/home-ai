import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, View } from 'react-native';

import { Badge, Button, Card, Screen, Text, useTheme } from '@/src/design-system';
import { useHousehold } from '@/src/hooks/useProfile';
import { useCurrentOffering, usePurchasePackage, useRestorePurchases } from '@/src/hooks/usePurchases';
import { PurchasesUnavailableError } from '@/src/lib/purchases';
import type { PurchasesPackage } from 'react-native-purchases';

const FREE_FEATURES = [
  { text: '1 property', included: true },
  { text: 'Up to 5 items', included: true },
  { text: 'Up to 3 documents', included: true },
  { text: '3 AI questions per month', included: true },
  { text: 'Up to 3 reminders', included: true },
  { text: 'Smart nudges & alerts', included: false },
  { text: 'Unlimited items & documents', included: false },
  { text: 'Unlimited AI questions', included: false },
  { text: 'Vehicles & insurance tracking', included: false },
  { text: 'Family sharing', included: false },
  { text: 'Home Health Score', included: false },
  { text: 'Home Passport', included: false },
  { text: 'Spending insights', included: false },
];

const PREMIUM_FEATURES = [
  { icon: '♾️', title: 'Unlimited everything', desc: 'Items, documents, photos, AI questions, reminders' },
  { icon: '🧠', title: 'Smart nudges & alerts', desc: 'Proactive warnings about services, renewals, warranties' },
  { icon: '👨‍👩‍👧', title: 'Family sharing', desc: 'Invite your partner or housemates to see and add to the same home' },
  { icon: '🩺', title: 'Home Health Score', desc: 'See how well-documented and maintained your home is' },
  { icon: '📋', title: 'Home Passport', desc: 'Generate a shareable property record for buyers or tenants' },
  { icon: '🔍', title: 'AI manual finder', desc: 'Automatically search for product manuals online' },
  { icon: '📊', title: 'Spending insights', desc: 'Track what you\'ve spent on your home by category and year' },
];

export default function PaywallScreen() {
  const theme = useTheme();
  const { data: household } = useHousehold();
  const { data: offering, isLoading, error } = useCurrentOffering(household?.id);
  const purchase = usePurchasePackage(household?.id);
  const restore = useRestorePurchases(household?.id);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');

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
        {/* Header with logo */}
        <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
          <Image source={require('@/assets/images/logo.png')} style={{ width: 80, height: 80, borderRadius: 20 }} resizeMode="contain" />
          <Badge label="HomeAI Premium" tone="accent" />
          <Text variant="title1" style={{ textAlign: 'center' }}>Unlock the full power of HomeAI</Text>
          <Text variant="body" color="textSecondary" style={{ textAlign: 'center', lineHeight: 22 }}>
            Manage. Protect. Remind.
          </Text>
        </View>

        {/* Premium features */}
        <View style={{ gap: theme.spacing.sm }}>
          {PREMIUM_FEATURES.map((f) => (
            <View key={f.title} style={{ flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-start' }}>
              <Text style={{ fontSize: 24, lineHeight: 28 }}>{f.icon}</Text>
              <View style={{ flex: 1, gap: 1 }}>
                <Text variant="headline">{f.title}</Text>
                <Text variant="footnote" color="textSecondary">{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing */}
        {isLoading ? (
          <ActivityIndicator />
        ) : unavailable ? (
          <Card>
            <View style={{ gap: theme.spacing.sm, alignItems: 'center' }}>
              <Text variant="headline">Recommended pricing</Text>
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm, width: '100%' }}>
                <PricingCard label="Monthly" price="£4.99" per="/month" selected={selectedPlan === 'monthly'} onPress={() => setSelectedPlan('monthly')} />
                <PricingCard label="Annual" price="£34.99" per="/year" subtitle="Save 42%" selected={selectedPlan === 'annual'} onPress={() => setSelectedPlan('annual')} badge="Best value" />
              </View>
              <Text variant="caption" color="textTertiary" style={{ textAlign: 'center' }}>
                Purchases aren't available in this build — this needs a production build.
              </Text>
            </View>
          </Card>
        ) : !offering ? (
          <Card><Text variant="body" color="textSecondary">Pricing isn't available right now.</Text></Card>
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            {offering.annual ? <PackageCard pkg={offering.annual} onPress={() => handlePurchase(offering.annual!)} loading={purchase.isPending} badge="Best value" /> : null}
            {offering.monthly ? <PackageCard pkg={offering.monthly} onPress={() => handlePurchase(offering.monthly!)} loading={purchase.isPending} /> : null}
          </View>
        )}

        {actionError ? <Text variant="footnote" color="danger">{actionError}</Text> : null}

        {/* Free vs premium comparison */}
        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="headline" style={{ textAlign: 'center' }}>Free vs Premium</Text>
          {FREE_FEATURES.map((f) => (
            <View key={f.text} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, paddingVertical: 6 }}>
              <Ionicons name={f.included ? 'checkmark-circle' : 'lock-closed'} size={18} color={f.included ? theme.colors.accent : theme.colors.textTertiary} />
              <Text variant="body" color={f.included ? 'textPrimary' : 'textTertiary'} style={{ flex: 1 }}>{f.text}</Text>
              {!f.included ? <Badge label="Premium" tone="accent" /> : null}
            </View>
          ))}
        </View>

        <Button label="Restore purchases" variant="ghost" onPress={handleRestore} loading={restore.isPending} />

        <View style={{ gap: theme.spacing.xxs }}>
          <Text variant="caption" color="textTertiary">
            Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel any time in your App Store or Play Store settings.
          </Text>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <Text variant="caption" color="accent" accessibilityRole="link" onPress={() => router.push('/legal/terms')}>Terms of Service</Text>
            <Text variant="caption" color="accent" accessibilityRole="link" onPress={() => router.push('/legal/privacy')}>Privacy Policy</Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function PricingCard({ label, price, per, subtitle, selected, onPress, badge }: { label: string; price: string; per: string; subtitle?: string; selected: boolean; onPress: () => void; badge?: string }) {
  const theme = useTheme();
  return (
    <Card style={{ flex: 1, borderColor: selected ? theme.colors.accent : theme.colors.border, borderWidth: selected ? 2 : 1 }} onPress={onPress}>
      <View style={{ alignItems: 'center', gap: theme.spacing.xxs }}>
        {badge ? <Badge label={badge} tone="accent" /> : null}
        <Text variant="caption" color="textSecondary">{label}</Text>
        <Text variant="title1">{price}</Text>
        <Text variant="caption" color="textTertiary">{per}</Text>
        {subtitle ? <Text variant="caption" color="accent">{subtitle}</Text> : null}
      </View>
    </Card>
  );
}

function PackageCard({ pkg, onPress, loading, badge }: { pkg: PurchasesPackage; onPress: () => void; loading: boolean; badge?: string }) {
  const theme = useTheme();
  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ gap: 2 }}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.xs, alignItems: 'center' }}>
            <Text variant="headline">{pkg.product.title || pkg.identifier}</Text>
            {badge ? <Badge label={badge} tone="accent" /> : null}
          </View>
          <Text variant="footnote" color="textSecondary">{pkg.product.description}</Text>
        </View>
        {loading ? <ActivityIndicator /> : <Text variant="headline">{pkg.product.priceString}</Text>}
      </View>
    </Card>
  );
}
