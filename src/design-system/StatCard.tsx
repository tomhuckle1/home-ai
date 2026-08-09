import { Pressable, View } from 'react-native';

import { Text } from './Text';
import { useTheme } from './theme';
import type { ThemeColors } from './tokens';

export type StatCardProps = {
  icon: string;
  label: string;
  value: string;
  subtitle?: string;
  tone?: 'accent' | 'warning' | 'danger' | 'neutral';
  onPress?: () => void;
};

const BG_BY_TONE: Record<string, keyof ThemeColors> = {
  accent: 'accentMuted',
  warning: 'warningMuted',
  danger: 'dangerMuted',
  neutral: 'surfaceAlt',
};

export function StatCard({ icon, label, value, subtitle, tone = 'neutral', onPress }: StatCardProps) {
  const theme = useTheme();

  const content = (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors[BG_BY_TONE[tone]],
        borderRadius: theme.radius.lg,
        padding: theme.spacing.sm,
        gap: theme.spacing.xxs,
      }}
    >
      <Text style={{ fontSize: 20, lineHeight: 24 }}>{icon}</Text>
      <Text variant="title2">{value}</Text>
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      {subtitle ? (
        <Text variant="caption" color="textTertiary">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.7 : 1 })}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}
