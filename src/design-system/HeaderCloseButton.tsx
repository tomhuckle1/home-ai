import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable } from 'react-native';

import { useTheme } from './theme';

/** For modal-presented screens, which don't get a native back affordance. */
export function HeaderCloseButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Close"
      onPress={onPress}
      hitSlop={12}
      style={{ paddingHorizontal: theme.spacing.xxs, paddingVertical: theme.spacing.xxs }}
    >
      <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
    </Pressable>
  );
}
