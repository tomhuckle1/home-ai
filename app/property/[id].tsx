import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, View } from 'react-native';

import { Button, Card, EmptyState, ListRow, Screen, Text, useTheme } from '@/src/design-system';
import { useProperty } from '@/src/hooks/useProperty';
import { useRooms } from '@/src/hooks/useRooms';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data: property } = useProperty(id);
  const { data: rooms, isLoading } = useRooms(id);

  return (
    <Screen edges={['bottom']}>
      <View style={{ paddingVertical: theme.spacing.md, gap: theme.spacing.md }}>
        <View>
          <Text variant="title1">{property?.address_line1 ?? 'Property'}</Text>
          {property?.city || property?.postcode ? (
            <Text variant="body" color="textSecondary">
              {[property?.city, property?.postcode].filter(Boolean).join(', ')}
            </Text>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button
              label="Scan a document"
              variant="secondary"
              onPress={() => router.push({ pathname: '/capture/scan', params: { propertyId: id, mode: 'document' } })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Add room" onPress={() => router.push({ pathname: '/room/new', params: { propertyId: id } })} />
          </View>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={rooms ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl }}
          ListEmptyComponent={
            <EmptyState
              icon="🚪"
              title="No rooms yet"
              description="Add your first room — kitchen, bathroom, garden — to start recording what's in it."
            />
          }
          renderItem={({ item }) => (
            <Card>
              <ListRow title={item.name} subtitle={item.room_type ?? undefined} showChevron onPress={() => router.push(`/room/${item.id}`)} />
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
