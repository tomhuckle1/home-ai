import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button, Screen, Text, useTheme } from '@/src/design-system';
import { useCompleteOnboarding } from '@/src/hooks/useProfile';
import { AnalyticsEvent, track } from '@/src/lib/analytics';

// Second and last step of the guided onboarding wizard — see onboarding.tsx.
// Gets the user to their first scan (or lets them opt out) before handing
// off to the normal app, rather than leaving "find your first item" as
// something they have to discover on their own on an empty Home tab.
export default function OnboardingScanScreen() {
  const theme = useTheme();
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const completeOnboarding = useCompleteOnboarding();

  function skip() {
    track(AnalyticsEvent.OnboardingCompleted, { scanned_first_item: false, skipped_at: 'first_scan' });
    completeOnboarding.mutate();
    router.replace('/(tabs)');
  }

  function scanNow() {
    track(AnalyticsEvent.OnboardingCompleted, { scanned_first_item: true });
    completeOnboarding.mutate();
    // Land the stack on the Home tab first, then push the scanner on top of
    // it — so confirming the scan and pressing back both return to Home,
    // not back through the onboarding screens themselves.
    router.replace('/(tabs)');
    router.push({ pathname: '/capture/scan', params: { propertyId, mode: 'document' } });
  }

  return (
    <Screen edges={['top', 'bottom']} style={{ justifyContent: 'space-between', paddingVertical: theme.spacing.xl }}>
      <View style={{ alignItems: 'flex-end' }}>
        <Pressable accessibilityRole="button" onPress={skip} hitSlop={12}>
          <Text variant="body" color="textTertiary">Skip for now</Text>
        </Pressable>
      </View>

      <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: 'center', gap: theme.spacing.lg, paddingHorizontal: theme.spacing.lg }}>
        <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: theme.colors.accentMuted, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 48, lineHeight: 56 }}>📸</Text>
        </View>
        <Text variant="title1" style={{ textAlign: 'center' }}>Your home&apos;s set up. Let&apos;s scan your first item.</Text>
        <Text variant="body" color="textSecondary" style={{ textAlign: 'center', lineHeight: 24, maxWidth: 320 }}>
          Grab anything nearby — an appliance label, a receipt, a warranty card. AI reads it and builds your first
          record in seconds.
        </Text>
      </Animated.View>

      <Button label="Scan now" size="lg" onPress={scanNow} />
    </Screen>
  );
}
