import { forwardRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from './Text';
import { useTheme } from './theme';

export type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, style, ...rest },
  ref,
) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.xxs }}>
      {label ? (
        <Text variant="footnote" color="textSecondary">
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={theme.colors.textTertiary}
        style={[
          {
            borderWidth: StyleSheet.hairlineWidth * 2,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: 12,
            fontSize: theme.typography.body.fontSize,
            color: theme.colors.textPrimary,
            backgroundColor: theme.colors.surface,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
});
