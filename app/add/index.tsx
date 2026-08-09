import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { Screen, Text, useTheme } from '@/src/design-system';
import { useProperties } from '@/src/hooks/useProperties';
import { SMART_CATEGORIES, SPECIAL_CATEGORIES } from '@/src/lib/smart-templates';

export default function AddPickerScreen() {
  const theme = useTheme();
  const { data: properties } = useProperties();
  const property = properties?.[0];

  if (!property) {
    return (
      <Screen edges={['top', 'bottom']} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="body" color="textSecondary">Add a property first.</Text>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.md }}>
        <Text variant="title1">What are you adding?</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}>
        {/* Asset-based categories */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {SMART_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/add/smart-form', params: { categoryId: cat.id, propertyId: property.id } })}
              style={({ pressed }) => ({
                width: '47.5%',
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.lg,
                borderWidth: 1,
                borderColor: theme.colors.border,
                padding: theme.spacing.md,
                gap: theme.spacing.xs,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontSize: 28, lineHeight: 34 }}>{cat.icon}</Text>
              <Text variant="headline">{cat.label}</Text>
              <Text variant="caption" color="textSecondary" numberOfLines={2}>{cat.description}</Text>
            </Pressable>
          ))}

          {/* Special categories */}
          {SPECIAL_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              accessibilityRole="button"
              onPress={() => {
                if (cat.id === 'document') {
                  router.push({ pathname: '/capture/scan', params: { propertyId: property.id, mode: 'document' } });
                } else {
                  router.push({ pathname: cat.route as any, params: { propertyId: property.id } });
                }
              }}
              style={({ pressed }) => ({
                width: '47.5%',
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.lg,
                borderWidth: 1,
                borderColor: theme.colors.border,
                padding: theme.spacing.md,
                gap: theme.spacing.xs,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontSize: 28, lineHeight: 34 }}>{cat.icon}</Text>
              <Text variant="headline">{cat.label}</Text>
              <Text variant="caption" color="textSecondary" numberOfLines={2}>{cat.description}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
