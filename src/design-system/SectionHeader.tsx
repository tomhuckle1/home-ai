import { View } from 'react-native';

import { Button } from './Button';
import { Text } from './Text';
import { useTheme } from './theme';

export type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.xxs,
      }}
    >
      <Text variant="headline">{title}</Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="ghost" fullWidth={false} onPress={onAction} />
      ) : null}
    </View>
  );
}
