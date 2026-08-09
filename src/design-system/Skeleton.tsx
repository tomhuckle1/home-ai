import { useEffect } from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from './theme';

export type SkeletonProps = ViewProps & {
  width?: number | string;
  height?: number;
  radius?: number;
  variant?: 'text' | 'circle' | 'rect';
};

export function Skeleton({ width = '100%', height = 16, radius, variant = 'text', style, ...rest }: SkeletonProps) {
  const theme = useTheme();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 800 }), withTiming(0.4, { duration: 800 })),
      -1,
      false,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const resolvedRadius =
    radius ?? (variant === 'circle' ? (typeof height === 'number' ? height / 2 : 999) : theme.radius.sm);
  const resolvedWidth = variant === 'circle' ? height : width;

  return (
    <Animated.View
      style={[
        {
          width: resolvedWidth as number,
          height,
          borderRadius: resolvedRadius,
          backgroundColor: theme.colors.surfaceAlt,
        },
        animatedStyle,
        style,
      ]}
      {...rest}
    />
  );
}

/** A card-shaped skeleton placeholder */
export function SkeletonCard() {
  const theme = useTheme();
  return (
    <View
      style={{
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        <Skeleton variant="circle" height={40} />
        <View style={{ flex: 1, gap: theme.spacing.xxs }}>
          <Skeleton height={16} width="70%" />
          <Skeleton height={12} width="40%" />
        </View>
      </View>
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}
