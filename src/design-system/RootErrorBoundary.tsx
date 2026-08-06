import { useEffect } from 'react';
import { View } from 'react-native';

import { captureException } from '@/src/lib/analytics';

import { Button } from './Button';
import { Text } from './Text';
import { useTheme } from './theme';

type ErrorBoundaryProps = {
  error: Error;
  retry: () => Promise<void>;
};

/**
 * expo-router renders this in place of any route that throws during render —
 * see app/_layout.tsx's `export { RootErrorBoundary as ErrorBoundary }`.
 */
export function RootErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const theme = useTheme();

  useEffect(() => {
    captureException(error, { source: 'route_error_boundary' });
  }, [error]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.md,
        padding: theme.spacing.xl,
        backgroundColor: theme.colors.background,
      }}
    >
      <Text style={{ fontSize: 40 }}>⚠️</Text>
      <Text variant="title2" style={{ textAlign: 'center' }}>
        Something went wrong
      </Text>
      <Text variant="body" color="textSecondary" style={{ textAlign: 'center' }}>
        This screen hit an unexpected error. It&apos;s been reported — try again, or go back and retry in a moment.
      </Text>
      <Button label="Try again" onPress={() => retry()} fullWidth={false} />
    </View>
  );
}
