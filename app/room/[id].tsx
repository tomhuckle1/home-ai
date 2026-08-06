import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, View } from 'react-native';

import { Badge, Button, Card, EmptyState, ListRow, Screen, Text, Thumbnail, useTheme } from '@/src/design-system';
import { useAssetsByRoom } from '@/src/hooks/useAssets';
import { useDeleteRoom, useRoom } from '@/src/hooks/useRooms';
import { isWithinDeleteWindow } from '@/src/lib/deleteWindow';

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data: room } = useRoom(id);
  const { data: assets, isLoading } = useAssetsByRoom(id);
  const deleteRoom = useDeleteRoom();

  function handleDelete() {
    if (!room) return;
    Alert.alert(`Delete "${room.name}"?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteRoom.mutate(
            { id: room.id, property_id: room.property_id },
            {
              onSuccess: () => router.back(),
              onError: (err) =>
                Alert.alert('Could not delete this room', err instanceof Error ? err.message : 'Please try again.'),
            },
          );
        },
      },
    ]);
  }

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
                leading={
                  item.primary_photo_path ? (
                    <Thumbnail bucket="documents" path={item.primary_photo_path} />
                  ) : (
                    <Text style={{ fontSize: 24, lineHeight: 28 }}>📦</Text>
                  )
                }
                title={item.name}
                subtitle={[item.brand, item.model].filter(Boolean).join(' · ') || undefined}
                trailing={item.warranty_expiry ? <Badge label="Under warranty" tone="accent" /> : undefined}
                showChevron
                onPress={() => router.push(`/asset/${item.id}`)}
              />
            </Card>
          )}
          ListFooterComponent={
            room ? (
              <View style={{ marginTop: theme.spacing.lg }}>
                {isWithinDeleteWindow(room.created_at) ? (
                  <Button label="Delete room" variant="danger" onPress={handleDelete} loading={deleteRoom.isPending} />
                ) : (
                  <Text variant="footnote" color="textTertiary" style={{ textAlign: 'center' }}>
                    This can no longer be deleted — it&apos;s past the 30-minute window for undoing a mistake.
                  </Text>
                )}
              </View>
            ) : null
          }
        />
      )}
    </Screen>
  );
}
