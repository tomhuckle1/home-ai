import { View } from 'react-native';

import { Text } from './Text';
import { useTheme } from './theme';

type Tone = 'neutral' | 'accent' | 'warning' | 'danger';

export type BadgeProps = {
  label: string;
  tone?: Tone;
};

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const theme = useTheme();

  const backgroundColor = {
    neutral: theme.colors.surfaceAlt,
    accent: theme.colors.accentMuted,
    warning: theme.colors.warningMuted,
    danger: theme.colors.dangerMuted,
  }[tone];

  const textColor = {
    neutral: theme.colors.textSecondary,
    accent: theme.colors.accentStrong,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
  }[tone];

  return (
    <View
      style={{
        backgroundColor,
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 3,
        alignSelf: 'flex-start',
      }}
    >
      <Text variant="caption" style={{ color: textColor }}>
        {label}
      </Text>
    </View>
  );
}
