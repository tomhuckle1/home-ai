import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { useTheme } from './theme';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
};

export function ListRow({ title, subtitle, leading, trailing, onPress, showChevron }: ListRowProps) {
  const theme = useTheme();

  const content = (
    <View style={[styles.row, { paddingVertical: theme.spacing.sm }]}>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.middle}>
        <Text variant="body" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="footnote" color="textSecondary" numberOfLines={1} style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      {showChevron ? (
        <Text variant="body" color="textTertiary" style={{ marginLeft: theme.spacing.xs }}>
          ›
        </Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leading: {
    marginRight: 12,
  },
  middle: {
    flex: 1,
  },
  trailing: {
    marginLeft: 12,
  },
});
