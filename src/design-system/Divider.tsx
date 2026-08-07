import { StyleSheet, View } from 'react-native';

import { useTheme } from './theme';

export type DividerProps = {
  spacing?: 'sm' | 'md' | 'lg';
};

export function Divider({ spacing = 'md' }: DividerProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.colors.border,
        marginVertical: theme.spacing[spacing],
      }}
    />
  );
}
