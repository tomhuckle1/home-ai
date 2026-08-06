import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/src/design-system';
import { useSession, useSessionSync } from '@/src/hooks/useSession';
import { queryClient } from '@/src/lib/queryClient';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useSessionSync();
  const { status } = useSession();

  useEffect(() => {
    if (status !== 'loading') {
      SplashScreen.hideAsync();
    }
  }, [status]);

  if (status === 'loading') {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={status === 'signedIn'}>
              <Stack.Screen name="(tabs)" />
            </Stack.Protected>
            <Stack.Protected guard={status === 'signedOut'}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>
            <Stack.Screen name="+not-found" options={{ headerShown: true }} />
          </Stack>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
