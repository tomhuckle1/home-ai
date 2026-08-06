import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from './theme';

export type ScreenProps = ViewProps & {
  edges?: Edge[];
  padded?: boolean;
};

export function Screen({ children, style, edges = ['top'], padded = true, ...rest }: ScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.flex,
          padded ? { paddingHorizontal: theme.spacing.lg } : null,
          style,
        ]}
        {...rest}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
