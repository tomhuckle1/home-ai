import { QueryClientProvider } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HeaderCloseButton, RootErrorBoundary, ThemeProvider, useTheme } from '@/src/design-system';
import { useSession, useSessionSync } from '@/src/hooks/useSession';
import { installGlobalErrorHandlers } from '@/src/lib/crashReporting';
import { queryClient } from '@/src/lib/queryClient';

export { RootErrorBoundary as ErrorBoundary };

SplashScreen.preventAutoHideAsync();
installGlobalErrorHandlers();

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
        // Without this, the native back button falls back to the PREVIOUS
        // screen's route name when that screen has no title set — e.g.
        // the (tabs) group, which has none, so the back button literally
        // read "(tabs)". Minimal mode shows just the chevron everywhere.
        headerBackButtonDisplayMode: 'minimal',
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
        <Stack.Screen
          name="timeline/new"
          options={{ headerShown: true, title: 'Add to timeline', presentation: 'modal', headerLeft: closeButton }}
        />
        <Stack.Screen
          name="subscription/paywall"
          options={{ headerShown: true, title: 'Premium', presentation: 'modal', headerLeft: closeButton }}
        />
        <Stack.Screen name="family/index" options={{ headerShown: true, title: 'Family sharing' }} />
        <Stack.Screen
          name="family/invite"
          options={{ headerShown: true, title: 'Invite family', presentation: 'modal', headerLeft: closeButton }}
        />
        <Stack.Screen name="passport/[propertyId]" options={{ headerShown: true, title: 'Home Passport' }} />
        <Stack.Screen name="legal/privacy" options={{ headerShown: true, title: 'Privacy Policy' }} />
        <Stack.Screen name="legal/terms" options={{ headerShown: true, title: 'Terms of Service' }} />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      {/* Public — reachable regardless of auth state, gated only by the passport share token itself. */}
      <Stack.Screen name="passport-view/[token]" options={{ headerShown: true, title: 'Home Passport' }} />
      <Stack.Screen name="+not-found" options={{ headerShown: true }} />
    </Stack>
  );
}
