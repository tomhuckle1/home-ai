import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useTheme } from './theme';

export type AnimatedCardProps = ViewProps & {
  onPress?: () => void;
  haptic?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedCard({ children, style, onPress, haptic = true, ...rest }: AnimatedCardProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cardStyle = [
    styles.base,
    theme.scheme === 'light' ? styles.shadow : null,
    {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
    },
    style,
  ];

  if (onPress) {
    return (
      <AnimatedPressable
        accessibilityRole="button"
        onPress={() => {
          if (haptic && Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onPress();
        }}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        style={[animatedStyle, ...cardStyle]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View style={cardStyle} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  shadow: Platform.select({
    ios: {
      shadowColor: '#111113',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
    },
    android: { elevation: 1 },
    default: {
      boxShadow: '0 1px 8px rgba(17, 17, 19, 0.04)',
    },
  }),
});
