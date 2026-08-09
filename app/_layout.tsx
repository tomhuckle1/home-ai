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
    if (status !== 'loading') SplashScreen.hideAsync();
  }, [status]);

  if (status === 'loading') return null;

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
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />

        {/* Property */}
        <Stack.Screen name="property/new" options={{ headerShown: true, title: 'Add property', presentation: 'modal', headerLeft: closeButton }} />
        <Stack.Screen name="property/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="property/edit" options={{ headerShown: true, title: 'Edit property' }} />

        {/* Room */}
        <Stack.Screen name="room/new" options={{ headerShown: true, title: 'Add room', presentation: 'modal', headerLeft: closeButton }} />
        <Stack.Screen name="room/[id]" options={{ headerShown: true, title: '' }} />

        {/* Asset */}
        <Stack.Screen name="asset/new" options={{ headerShown: true, title: 'Add item', presentation: 'modal', headerLeft: closeButton }} />
        <Stack.Screen name="asset/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="asset/edit" options={{ headerShown: true, title: 'Edit item' }} />

        {/* Add flows */}
        <Stack.Screen name="add/index" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="add/smart-form" options={{ headerShown: false }} />
        <Stack.Screen name="add/insurance" options={{ headerShown: false }} />
        <Stack.Screen name="add/vehicle" options={{ headerShown: false }} />

        {/* Capture */}
        <Stack.Screen name="capture/scan" options={{ headerShown: false, presentation: 'fullScreenModal' }} />

        {/* Document */}
        <Stack.Screen name="document/[id]" options={{ headerShown: true, title: 'Document' }} />

        {/* Timeline */}
        <Stack.Screen name="timeline/new" options={{ headerShown: true, title: 'Add to timeline', presentation: 'modal', headerLeft: closeButton }} />
        <Stack.Screen name="timeline/[id]" options={{ headerShown: true, title: 'Event' }} />

        {/* Contractor */}
        <Stack.Screen name="contractor/index" options={{ headerShown: true, title: 'Contractors' }} />
        <Stack.Screen name="contractor/new" options={{ headerShown: true, title: 'Add contractor', presentation: 'modal', headerLeft: closeButton }} />
        <Stack.Screen name="contractor/[id]" options={{ headerShown: true, title: 'Contractor' }} />

        {/* Maintenance */}
        <Stack.Screen name="maintenance/new" options={{ headerShown: true, title: 'Add reminder', presentation: 'modal', headerLeft: closeButton }} />

        {/* Energy */}
        <Stack.Screen name="energy/index" options={{ headerShown: false }} />

        {/* Search */}
        <Stack.Screen name="search/index" options={{ headerShown: false }} />

        {/* AI History */}
        <Stack.Screen name="ai-history/index" options={{ headerShown: true, title: 'Past conversations' }} />
        <Stack.Screen name="ai-history/[id]" options={{ headerShown: true, title: 'Conversation' }} />

        {/* Subscription */}
        <Stack.Screen name="subscription/paywall" options={{ headerShown: true, title: 'Premium', presentation: 'modal', headerLeft: closeButton }} />

        {/* Family */}
        <Stack.Screen name="family/index" options={{ headerShown: true, title: 'Family sharing' }} />
        <Stack.Screen name="family/invite" options={{ headerShown: true, title: 'Invite family', presentation: 'modal', headerLeft: closeButton }} />

        {/* Passport */}
        <Stack.Screen name="passport/[propertyId]" options={{ headerShown: true, title: 'Home Passport' }} />

        {/* Moving house */}
        <Stack.Screen name="moving/index" options={{ headerShown: false }} />

        {/* Legal */}
        <Stack.Screen name="legal/privacy" options={{ headerShown: true, title: 'Privacy Policy' }} />
        <Stack.Screen name="legal/terms" options={{ headerShown: true, title: 'Terms of Service' }} />
      </Stack.Protected>

      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Screen name="passport-view/[token]" options={{ headerShown: true, title: 'Home Passport' }} />
      <Stack.Screen name="+not-found" options={{ headerShown: true }} />
    </Stack>
  );
}
