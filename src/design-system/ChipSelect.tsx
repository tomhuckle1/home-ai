import { Pressable, View } from 'react-native';

import { Text } from './Text';
import { useTheme } from './theme';

export type ChipOption<T extends string> = { value: T; label: string };

export type ChipSelectProps<T extends string> = {
  options: ChipOption<T>[];
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  allowDeselect?: boolean;
};

export function ChipSelect<T extends string>({
  options,
  value,
  onChange,
  allowDeselect = true,
}: ChipSelectProps<T>) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(selected && allowDeselect ? undefined : option.value)}
            style={{
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xxs,
              borderRadius: theme.radius.pill,
              borderWidth: 1,
              borderColor: selected ? theme.colors.accent : theme.colors.border,
              backgroundColor: selected ? theme.colors.accentMuted : theme.colors.surface,
            }}
          >
            <Text variant="footnote" color={selected ? 'accentStrong' : 'textSecondary'}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
