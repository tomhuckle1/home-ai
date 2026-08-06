import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Screen, Text, useTheme } from '@/src/design-system';
import { useCompleteOnboarding } from '@/src/hooks/useProfile';

type Slide = { icon: string; title: string; body: string };

const SLIDES: Slide[] = [
  {
    icon: '🏠',
    title: 'Your home, remembered',
    body: 'Photograph a receipt, appliance label, manual, warranty or certificate — Home Memory reads it and builds a searchable record of your home, automatically.',
  },
  {
    icon: '💬',
    title: 'Ask anything, get a real answer',
    body: "The AI assistant only ever answers from what you've actually recorded — with a source you can check. If it doesn't know, it says so, never a guess.",
  },
  {
    icon: '🔒',
    title: 'Private, and yours to control',
    body: "Only you — and anyone you choose to invite — can see it. Export everything or delete your account at any time from Profile.",
  },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const [step, setStep] = useState(0);
  const completeOnboarding = useCompleteOnboarding();
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  function finish() {
    completeOnboarding.mutate();
    router.replace('/property/new');
  }

  return (
    <Screen edges={['top', 'bottom']} style={{ justifyContent: 'space-between', paddingVertical: theme.spacing.xl }}>
      <View style={{ alignItems: 'flex-end' }}>
        <Button label="Skip" variant="ghost" fullWidth={false} onPress={finish} />
      </View>

      <View style={{ alignItems: 'center', gap: theme.spacing.md, paddingHorizontal: theme.spacing.lg }}>
        <Text style={{ fontSize: 56, lineHeight: 64 }}>{slide.icon}</Text>
        <Text variant="title1" style={{ textAlign: 'center' }}>
          {slide.title}
        </Text>
        <Text variant="body" color="textSecondary" style={{ textAlign: 'center' }}>
          {slide.body}
        </Text>
      </View>

      <View style={{ gap: theme.spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.xs }}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: index === step ? theme.colors.accent : theme.colors.border,
              }}
            />
          ))}
        </View>
        <Button
          label={isLast ? "Let's get started" : 'Next'}
          onPress={() => (isLast ? finish() : setStep((s) => s + 1))}
        />
      </View>
    </Screen>
  );
}
