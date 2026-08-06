import { QueryClientProvider } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderCloseButton, ThemeProvider, useTheme } from '@/src/design-system';
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
          <RootNavigator status={status} />
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator({ status }: { status: 'signedIn' | 'signedOut' }) {
  const theme = useTheme();

  const closeButton = () => <HeaderCloseButton onPress={() => router.back()} />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: { color: theme.colors.textPrimary, fontSize: 17, fontWeight: '600' },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="property/new"
          options={{ headerShown: true, title: 'Add property', presentation: 'modal', headerLeft: closeButton }}
        />
        <Stack.Screen name="property/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen
          name="room/new"
          options={{ headerShown: true, title: 'Add room', presentation: 'modal', headerLeft: closeButton }}
        />
        <Stack.Screen name="room/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen
          name="asset/new"
          options={{ headerShown: true, title: 'Add item', presentation: 'modal', headerLeft: closeButton }}
        />
        <Stack.Screen name="asset/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="capture/scan" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="document/[id]" options={{ headerShown: true, title: 'Document' }} />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Screen name="+not-found" options={{ headerShown: true }} />
    </Stack>
  );
}
