import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeInRight, FadeOutLeft } from 'react-native-reanimated';

import { Button, Screen, Text, useTheme } from '@/src/design-system';
import { useCompleteOnboarding } from '@/src/hooks/useProfile';

type Slide = { icon: string; title: string; body: string; visual: string };

const SLIDES: Slide[] = [
  {
    icon: '📸',
    title: 'Scan anything',
    body: 'Photograph a receipt, appliance label, or warranty card — AI reads it and builds a structured record instantly.',
    visual: '📦 → 📸 → ✨',
  },
  {
    icon: '🔔',
    title: 'Never miss a deadline',
    body: 'MOT, boiler service, insurance renewal, smoke alarm batteries — set it once, get reminded automatically.',
    visual: '🔧 🛡️ 🚗 🔑',
  },
  {
    icon: '💬',
    title: 'Ask your home',
    body: '"When was the boiler last serviced?" "Is the dishwasher under warranty?" — answers from your records, with proof.',
    visual: '❓ → 💬 → ✅',
  },
  {
    icon: '🏠',
    title: "Let's set up your home",
    body: "It only takes a minute. We'll walk you through adding your address, then your first few items.",
    visual: '1️⃣ 2️⃣ 3️⃣',
  },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const [step, setStep] = useState(0);
  const completeOnboarding = useCompleteOnboarding();
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  const finish = useCallback(() => {
    completeOnboarding.mutate();
    router.replace('/property/new');
  }, [completeOnboarding]);

  return (
    <Screen edges={['top', 'bottom']} style={{ justifyContent: 'space-between', paddingVertical: theme.spacing.xl }}>
      {/* Skip */}
      <View style={{ alignItems: 'flex-end' }}>
        <Pressable accessibilityRole="button" onPress={finish} hitSlop={12}>
          <Text variant="body" color="textTertiary">Skip</Text>
        </Pressable>
      </View>

      {/* Slide content */}
      <Animated.View
        key={step}
        entering={FadeInRight.duration(350)}
        exiting={FadeOutLeft.duration(250)}
        style={{ alignItems: 'center', gap: theme.spacing.lg, paddingHorizontal: theme.spacing.lg }}
      >
        {/* Visual element */}
        <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: theme.colors.accentMuted, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 48, lineHeight: 56 }}>{slide.icon}</Text>
        </View>

        {/* Visual flow indicator */}
        <Text style={{ fontSize: 28, lineHeight: 36, textAlign: 'center', letterSpacing: 4 }}>{slide.visual}</Text>

        <Text variant="title1" style={{ textAlign: 'center' }}>{slide.title}</Text>
        <Text variant="body" color="textSecondary" style={{ textAlign: 'center', lineHeight: 24, maxWidth: 320 }}>{slide.body}</Text>
      </Animated.View>

      {/* Navigation */}
      <View style={{ gap: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.xs }}>
          {SLIDES.map((_, index) => (
            <Animated.View key={index} entering={FadeIn} style={{ width: index === step ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: index === step ? theme.colors.accent : theme.colors.border }} />
          ))}
        </View>
        <Button label={isLast ? "Add my property" : 'Next'} size="lg" onPress={() => isLast ? finish() : setStep((s) => s + 1)} />
      </View>
    </Screen>
  );
}
