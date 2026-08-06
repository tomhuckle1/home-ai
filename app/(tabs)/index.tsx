import { router } from 'expo-router';
import { ActivityIndicator, FlatList, View } from 'react-native';

import { Button, Card, EmptyState, ListRow, Screen, Text, useTheme } from '@/src/design-system';
import { useProfile } from '@/src/hooks/useProfile';
import { useProperties } from '@/src/hooks/useProperties';

export default function HomeScreen() {
  const theme = useTheme();
  const { data: profile } = useProfile();
  const { data: properties, isLoading } = useProperties();

  const firstName = profile?.full_name?.split(' ')[0];

  return (
    <Screen edges={['top']}>
      <View
        style={{
          paddingVertical: theme.spacing.md,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text variant="largeTitle">{firstName ? `Hi ${firstName}` : 'Home'}</Text>
        {properties && properties.length > 0 ? (
          <Button label="Add" variant="ghost" fullWidth={false} onPress={() => router.push('/property/new')} />
        ) : null}
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={properties ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl }}
          ListEmptyComponent={
            <EmptyState
              icon="🏠"
              title="No properties yet"
              description="Add your property to start building its record — rooms, appliances, receipts and warranties, all in one place."
              actionLabel="Add your property"
              onAction={() => router.push('/property/new')}
            />
          }
          renderItem={({ item }) => (
            <Card>
              <ListRow
                title={item.address_line1}
                subtitle={[item.city, item.postcode].filter(Boolean).join(', ') || undefined}
                showChevron
                onPress={() => router.push(`/property/${item.id}`)}
              />
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
