import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button } from './Button';
import { Text } from './Text';
import { useTheme } from './theme';

export type EmptyStateProps = {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={{
        alignItems: 'center',
        paddingVertical: theme.spacing.xxl,
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.sm,
      }}
    >
      {icon ? (
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: theme.colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.xxs,
          }}
        >
          <Text style={{ fontSize: 32, lineHeight: 38 }}>{icon}</Text>
        </View>
      ) : null}
      <Text variant="title2" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      {description ? (
        <Text
          variant="body"
          color="textSecondary"
          style={{ textAlign: 'center', lineHeight: 22, maxWidth: 300 }}
        >
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: theme.spacing.xs }}>
          <Button label={actionLabel} onPress={onAction} fullWidth={false} />
        </View>
      ) : null}
    </Animated.View>
  );
}
