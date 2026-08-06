import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Text } from './Text';
import { useTheme } from './theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = true,
  disabled,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const backgroundColor = {
    primary: theme.colors.accent,
    secondary: theme.colors.surfaceAlt,
    ghost: 'transparent',
    danger: theme.colors.danger,
  }[variant];

  const textColor = {
    primary: theme.colors.onAccent,
    secondary: theme.colors.textPrimary,
    ghost: theme.colors.accent,
    danger: theme.colors.onAccent,
  }[variant];

  const borderColor = variant === 'secondary' ? theme.colors.border : 'transparent';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        {
          backgroundColor,
          borderColor,
          borderWidth: variant === 'secondary' ? StyleSheet.hairlineWidth * 2 : 0,
          opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          borderRadius: theme.radius.md,
        },
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text variant="headline" style={{ color: textColor }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
});
