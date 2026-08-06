import { View } from 'react-native';

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
    <View
      style={{
        alignItems: 'center',
        paddingVertical: theme.spacing.xxl,
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.xs,
      }}
    >
      {icon ? (
        <Text style={{ fontSize: 40, marginBottom: theme.spacing.xs }}>{icon}</Text>
      ) : null}
      <Text variant="title2" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      {description ? (
        <Text
          variant="body"
          color="textSecondary"
          style={{ textAlign: 'center', marginBottom: theme.spacing.sm }}
        >
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} fullWidth={false} />
      ) : null}
    </View>
  );
}
