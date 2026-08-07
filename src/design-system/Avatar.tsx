import { View } from 'react-native';

import { Text } from './Text';
import { useTheme } from './theme';

export type AvatarProps = {
  name?: string | null;
  size?: number;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({ name, size = 48 }: AvatarProps) {
  const theme = useTheme();
  const fontSize = size * 0.38;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.colors.accentMuted,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        variant="headline"
        color="accentStrong"
        style={{ fontSize, lineHeight: fontSize * 1.2 }}
      >
        {name ? initials(name) : '?'}
      </Text>
    </View>
  );
}
