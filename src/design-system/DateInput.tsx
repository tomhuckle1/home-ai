import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { Text } from './Text';
import { useTheme } from './theme';

export type DateInputProps = {
  label: string;
  value: string; // ISO date string YYYY-MM-DD or empty
  onChange: (isoDate: string) => void;
  placeholder?: string;
};

function parseDate(str: string): Date {
  if (!str) return new Date();
  const d = new Date(str + 'T00:00:00');
  return isNaN(d.getTime()) ? new Date() : d;
}

function formatDisplay(str: string): string {
  if (!str) return '';
  const d = new Date(str + 'T00:00:00');
  if (isNaN(d.getTime())) return str;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function DateInput({ label, value, onChange, placeholder }: DateInputProps) {
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  function handleChange(_event: unknown, selectedDate: Date | undefined) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selectedDate) {
      const iso = selectedDate.toISOString().slice(0, 10);
      onChange(iso);
    }
  }

  return (
    <View style={{ gap: theme.spacing.xxs }}>
      <Text variant="footnote" color="textSecondary">{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setShowPicker(true)}
        style={{
          backgroundColor: theme.colors.surfaceAlt,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: 14,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <Text variant="body" color={value ? 'textPrimary' : 'textTertiary'}>
          {value ? formatDisplay(value) : (placeholder || 'Tap to select date')}
        </Text>
      </Pressable>

      {showPicker ? (
        Platform.OS === 'ios' ? (
          <View style={{ backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' }}>
            <DateTimePicker
              value={parseDate(value)}
              mode="date"
              display="spinner"
              onChange={handleChange}
              themeVariant={theme.scheme}
              style={{ height: 160 }}
            />
            <Pressable onPress={() => setShowPicker(false)} style={{ padding: theme.spacing.sm, alignItems: 'center' }}>
              <Text variant="body" color="accent">Done</Text>
            </Pressable>
          </View>
        ) : (
          <DateTimePicker
            value={parseDate(value)}
            mode="date"
            display="default"
            onChange={handleChange}
          />
        )
      ) : null}
    </View>
  );
}
