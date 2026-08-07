import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Text } from './Text';
import { useTheme } from './theme';
import type { ThemeColors } from './tokens';

type Tone = 'accent' | 'warning' | 'danger';

const MUTED_BY_TONE: Record<Tone, keyof ThemeColors> = {
  accent: 'accentMuted',
  warning: 'warningMuted',
  danger: 'dangerMuted',
};

export type ProgressRingProps = {
  /** 0–100 */
  value: number;
  tone?: Tone;
  size?: number;
  /** Shown inside the ring */
  label?: string;
};

/**
 * A simple circular progress indicator built from View elements
 * (no SVG dependency). Shows a coloured ring background with the
 * label centred inside. The background opacity animates on mount.
 */
export function ProgressRing({ value, tone = 'accent', size = 64, label }: ProgressRingProps) {
  const theme = useTheme();

  const animatedOpacity = useSharedValue(0);

  useEffect(() => {
    animatedOpacity.value = withTiming(1, { duration: 600 });
  }, [animatedOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: animatedOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 4,
          borderColor: theme.colors[tone],
          backgroundColor: theme.colors[MUTED_BY_TONE[tone]],
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedStyle,
      ]}
    >
      {label ? (
        <Text variant="headline" color={tone}>
          {label}
        </Text>
      ) : null}
    </Animated.View>
  );
}
