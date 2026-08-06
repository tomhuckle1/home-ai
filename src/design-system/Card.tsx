import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from './theme';

export type CardProps = ViewProps & {
  onPress?: () => void;
};

export function Card({ children, style, onPress, ...rest }: CardProps) {
  const theme = useTheme();

  const cardStyle = [
    styles.base,
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
});
