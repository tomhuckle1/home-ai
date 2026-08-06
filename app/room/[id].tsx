import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, View } from 'react-native';

import { Badge, Button, Card, EmptyState, ListRow, Screen, Text, useTheme } from '@/src/design-system';
import { useAssetsByRoom } from '@/src/hooks/useAssets';
import { useRoom } from '@/src/hooks/useRooms';

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data: room } = useRoom(id);
  const { data: assets, isLoading } = useAssetsByRoom(id);

  return (
    <Screen edges={['bottom']}>
      <View style={{ paddingVertical: theme.spacing.md, gap: theme.spacing.md }}>
        <Text variant="title1">{room?.name ?? 'Room'}</Text>

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button
              label="Scan a label"
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: '/capture/scan',
                  params: { propertyId: room?.property_id, roomId: id, mode: 'asset' },
                })
              }
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="Add manually"
              onPress={() =>
                router.push({ pathname: '/asset/new', params: { propertyId: room?.property_id, roomId: id } })
              }
            />
          </View>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={assets ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl }}
          ListEmptyComponent={
            <EmptyState
              icon="📦"
              title="Nothing recorded here yet"
              description="Photograph an appliance label and Home Memory will read the brand, model and serial number for you."
            />
          }
          renderItem={({ item }) => (
            <Card>
              <ListRow
                title={item.name}
                subtitle={[item.brand, item.model].filter(Boolean).join(' · ') || undefined}
                trailing={item.warranty_expiry ? <Badge label="Under warranty" tone="accent" /> : undefined}
                showChevron
                onPress={() => router.push(`/asset/${item.id}`)}
              />
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
