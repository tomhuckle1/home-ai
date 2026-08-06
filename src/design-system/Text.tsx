import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from './theme';
import type { ThemeColors, typography } from './tokens';

type Variant = keyof typeof typography;
type ColorKey = keyof ThemeColors;

export type TextProps = RNTextProps & {
  variant?: Variant;
  color?: ColorKey;
};

export function Text({ variant = 'body', color = 'textPrimary', style, ...rest }: TextProps) {
  const theme = useTheme();

  return (
    <RNText
      style={[theme.typography[variant], { color: theme.colors[color] }, style]}
      {...rest}
    />
  );
}
