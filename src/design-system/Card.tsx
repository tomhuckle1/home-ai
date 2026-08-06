import { Platform, Pressable, StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from './theme';

export type CardProps = ViewProps & {
  onPress?: () => void;
};

export function Card({ children, style, onPress, ...rest }: CardProps) {
  const theme = useTheme();

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
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [...cardStyle, { opacity: pressed ? 0.85 : 1 }]}
      >
        {children}
      </Pressable>
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
  // Cards sit on a white background in light mode, so structure comes from
  // a soft shadow, not colour contrast — a border alone reads flat.
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
