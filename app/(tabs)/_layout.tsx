import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Alert, Platform, Pressable, View } from 'react-native';
import { Tabs } from 'expo-router';

import { useTheme } from '@/src/design-system';
import { useProperties } from '@/src/hooks/useProperties';
import type { PropertyRow } from '@/src/types/database';

function startScan(properties: PropertyRow[] | undefined) {
  if (!properties || properties.length === 0) {
    router.push('/property/new');
    return;
  }
  if (properties.length === 1) {
    router.push({ pathname: '/capture/scan', params: { propertyId: properties[0].id, mode: 'document' } });
    return;
  }
  Alert.alert('Scan for which property?', undefined, [
    ...properties.map((p) => ({
      text: p.address_line1,
      onPress: () => router.push({ pathname: '/capture/scan', params: { propertyId: p.id, mode: 'document' } }),
    })),
    { text: 'Cancel', style: 'cancel' as const },
  ]);
}

export default function TabsLayout() {
  const theme = useTheme();
  const { data: properties } = useProperties();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="my-home"
        options={{
          title: 'My home',
          tabBarIcon: ({ color, size }) => <Ionicons name="layers" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: '',
          tabBarIcon: () => (
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: theme.colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: Platform.OS === 'ios' ? 16 : 4,
                shadowColor: theme.colors.accent,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Ionicons name="add" size={28} color={theme.colors.onAccent} />
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/add');
          },
        }}
      />
      <Tabs.Screen
        name="ask-ai"
        options={{
          title: 'Ask AI',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" color={color} size={size} />
          ),
        }}
      />
      {/* Hidden tabs — no longer primary navigation */}
      <Tabs.Screen name="timeline" options={{ href: null }} />
      <Tabs.Screen name="documents" options={{ href: null }} />
    </Tabs>
  );
}
