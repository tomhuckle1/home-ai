import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Screen, Text, useTheme } from '@/src/design-system';
import { useProperties } from '@/src/hooks/useProperties';
import { SMART_CATEGORIES, SPECIAL_CATEGORIES } from '@/src/lib/smart-templates';

export default function AddPickerScreen() {
  const theme = useTheme();
  const { data: properties } = useProperties();
  const property = properties?.[0];

  if (!property) {
    return (
      <Screen edges={['top', 'bottom']} style={{ justifyContent: 'center', alignItems: 'center', gap: theme.spacing.md }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} style={{ position: 'absolute', top: theme.spacing.lg, right: theme.spacing.lg }} hitSlop={12}>
          <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
        </Pressable>
        <Text style={{ fontSize: 48 }}>🏠</Text>
        <Text variant="body" color="textSecondary">Add a property first.</Text>
      </Screen>
    );
  }

  const allCategories = [
    ...SMART_CATEGORIES.map((c) => ({ id: c.id, icon: c.icon, label: c.label, desc: c.description, onPress: () => router.push({ pathname: '/add/smart-form', params: { categoryId: c.id, propertyId: property.id } }) })),
    ...SPECIAL_CATEGORIES.map((c) => ({ id: c.id, icon: c.icon, label: c.label, desc: c.description, onPress: () => {
      if (c.id === 'document') router.push({ pathname: '/capture/scan', params: { propertyId: property.id, mode: 'document' } });
      else router.push({ pathname: c.route as any, params: { propertyId: property.id } });
    }})),
  ];

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.md }}>
        <Text variant="title1">What are you adding?</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {allCategories.map((cat, index) => (
            <Animated.View key={cat.id} entering={FadeInDown.delay(index * 30).duration(300)} style={{ width: '48%', marginBottom: theme.spacing.sm }}>
              <Pressable
                accessibilityRole="button"
                onPress={cat.onPress}
                style={({ pressed }) => ({
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.lg,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  paddingVertical: theme.spacing.md,
                  paddingHorizontal: theme.spacing.sm,
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  opacity: pressed ? 0.7 : 1,
                  minHeight: 110,
                  justifyContent: 'center',
                })}
              >
                <Text style={{ fontSize: 32, lineHeight: 38 }}>{cat.icon}</Text>
                <Text variant="headline" style={{ textAlign: 'center' }} numberOfLines={1}>{cat.label}</Text>
                <Text variant="caption" color="textSecondary" style={{ textAlign: 'center' }} numberOfLines={2}>{cat.desc}</Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
