import { router } from 'expo-router';
import { Image, Pressable, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button, Screen, Text, useTheme } from '@/src/design-system';
import { useCompleteOnboarding } from '@/src/hooks/useProfile';
import { AnalyticsEvent, track } from '@/src/lib/analytics';

// One screen, not a slide deck — every extra tap here is time not spent
// getting to a scanned item. See docs/planning/01-product-analysis-and-risks.md
// P1: activation depends on reaching value in the first session, fast.
export default function OnboardingScreen() {
  const theme = useTheme();
  const completeOnboarding = useCompleteOnboarding();

  function skip() {
    track(AnalyticsEvent.OnboardingCompleted, { scanned_first_item: false, skipped_at: 'welcome' });
    completeOnboarding.mutate();
    router.replace('/(tabs)');
  }

  function start() {
    track(AnalyticsEvent.OnboardingStarted);
    router.push({ pathname: '/property/new', params: { onboarding: '1' } });
  }

  return (
    <Screen edges={['top', 'bottom']} style={{ justifyContent: 'space-between', paddingVertical: theme.spacing.xl }}>
      <View style={{ alignItems: 'flex-end' }}>
        <Pressable accessibilityRole="button" onPress={skip} hitSlop={12}>
          <Text variant="body" color="textTertiary">Skip</Text>
        </Pressable>
      </View>

      <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: 'center', gap: theme.spacing.lg, paddingHorizontal: theme.spacing.lg }}>
        <Image source={require('@/assets/images/logo.png')} style={{ width: 96, height: 96 }} resizeMode="contain" />
        <Text variant="title1" style={{ textAlign: 'center' }}>Welcome to Home Memory</Text>
        <Text variant="body" color="textSecondary" style={{ textAlign: 'center', lineHeight: 24, maxWidth: 320 }}>
          Photograph a receipt, appliance label, or warranty card and AI reads it for you. Ask your home questions.
          Never miss a renewal.
        </Text>
        <Text variant="footnote" color="textTertiary" style={{ textAlign: 'center' }}>
          Let&apos;s add your address, then scan your first item — takes about a minute.
        </Text>
      </Animated.View>

      <Button label="Get started" size="lg" onPress={start} />
    </Screen>
  );
}
