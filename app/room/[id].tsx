import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, View } from 'react-native';

import { Badge, Button, Card, EmptyState, ListRow, Screen, SectionHeader, Text, Thumbnail, useTheme } from '@/src/design-system';
import { useAssetsByRoom } from '@/src/hooks/useAssets';
import { useDocumentsByRoom } from '@/src/hooks/useDocumentLinks';
import { useDeleteRoom, useRoom, useUpdateRoom } from '@/src/hooks/useRooms';
import type { DocumentType } from '@/src/types/database';

const FLOOR_OPTIONS = [
  { value: 'Basement', label: 'Basement' },
  { value: 'Ground', label: 'Ground' },
  { value: 'First', label: 'First' },
  { value: 'Second', label: 'Second' },
  { value: 'Attic', label: 'Attic' },
];

function docIcon(type: DocumentType): keyof typeof Ionicons.glyphMap {
  const map: Partial<Record<DocumentType, keyof typeof Ionicons.glyphMap>> = { receipt: 'receipt-outline', manual: 'book-outline', warranty: 'shield-checkmark-outline', certificate: 'ribbon-outline', invoice: 'document-text-outline' };
  return map[type] ?? 'document-outline';
}

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data: room } = useRoom(id);
  const { data: assets, isLoading } = useAssetsByRoom(id);
  const { data: roomDocs } = useDocumentsByRoom(id);
  const deleteRoom = useDeleteRoom();
  const updateRoom = useUpdateRoom();
  const [showPrevious, setShowPrevious] = useState(false);

  const activeAssets = (assets ?? []).filter((a) => a.status === 'active');
  const previousAssets = (assets ?? []).filter((a) => a.status !== 'active');

  function handleDelete() {
    if (!room) return;
    Alert.alert(`Delete "${room.name}"?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteRoom.mutate({ id: room.id, property_id: room.property_id }, { onSuccess: () => router.back(), onError: (err) => Alert.alert('Error', err instanceof Error ? err.message : 'Please try again.') }); } },
    ]);
  }

  function handleSetFloor(floor: string | undefined) {
    if (!room) return;
    updateRoom.mutate({ id: room.id, update: { floor: floor ?? null } });
  }

  return (
    <Screen edges={['bottom']}>
      <View style={{ paddingVertical: theme.spacing.md, gap: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text variant="title1">{room?.name ?? 'Room'}</Text>
            {room?.floor ? <Text variant="footnote" color="textSecondary">{room.floor} floor</Text> : null}
          </View>
          {room && !room.floor ? (
            <Pressable accessibilityRole="button" onPress={() => {
              Alert.alert('Which floor?', undefined, [
                ...FLOOR_OPTIONS.map((f) => ({ text: f.label, onPress: () => handleSetFloor(f.value) })),
                { text: 'Cancel', style: 'cancel' as const },
              ]);
            }}>
              <Text variant="footnote" color="accent">Set floor</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button label="Scan a label" variant="secondary" onPress={() => router.push({ pathname: '/capture/scan', params: { propertyId: room?.property_id, roomId: id, mode: 'asset' } })} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Add manually" onPress={() => router.push({ pathname: '/asset/new', params: { propertyId: room?.property_id, roomId: id } })} />
          </View>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={activeAssets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl }}
          ListEmptyComponent={
            <EmptyState icon="📦" title="Nothing recorded here yet" description="Photograph an appliance label and Home Memory will read the brand, model and serial number for you." />
          }
          renderItem={({ item }) => (
            <Card>
              <ListRow
                leading={item.primary_photo_path ? <Thumbnail bucket="documents" path={item.primary_photo_path} /> : <Text style={{ fontSize: 24, lineHeight: 28 }}>📦</Text>}
                title={item.name}
                subtitle={[item.brand, item.model].filter(Boolean).join(' · ') || undefined}
                trailing={item.warranty_expiry && new Date(item.warranty_expiry) > new Date() ? <Badge label="Under warranty" tone="accent" /> : undefined}
                showChevron
                onPress={() => router.push(`/asset/${item.id}`)}
              />
            </Card>
          )}
          ListFooterComponent={
            <View style={{ gap: theme.spacing.lg, marginTop: theme.spacing.lg }}>
              {/* Room documents */}
              {roomDocs && roomDocs.length > 0 ? (
                <View style={{ gap: theme.spacing.xs }}>
                  <SectionHeader title={`Room documents (${roomDocs.length})`} />
                  {roomDocs.map((doc) => (
                    <Card key={doc.id}>
                      <ListRow
                        leading={<View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={docIcon(doc.document_type)} size={16} color={theme.colors.textSecondary} /></View>}
                        title={doc.product_description || doc.document_type.replace(/_/g, ' ')}
                        subtitle={doc.supplier ?? undefined}
                        showChevron
                        onPress={() => router.push(`/document/${doc.id}`)}
                      />
                    </Card>
                  ))}
                </View>
              ) : null}

              {/* Previous items */}
              {previousAssets.length > 0 ? (
                <View style={{ gap: theme.spacing.xs }}>
                  <Pressable accessibilityRole="button" onPress={() => setShowPrevious(!showPrevious)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                      <Text variant="headline" color="textSecondary">Previous items ({previousAssets.length})</Text>
                      <Ionicons name={showPrevious ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.textTertiary} />
                    </View>
                  </Pressable>
                  {showPrevious ? previousAssets.map((item) => (
                    <Card key={item.id}>
                      <ListRow
                        title={item.name}
                        subtitle={[item.brand, item.status].filter(Boolean).join(' · ')}
                        trailing={<Badge label={item.status} tone="neutral" />}
                        showChevron
                        onPress={() => router.push(`/asset/${item.id}`)}
                      />
                    </Card>
                  )) : null}
                </View>
              ) : null}

              {/* Delete room */}
              {room ? (
                <Button label="Delete room" variant="danger" onPress={handleDelete} loading={deleteRoom.isPending} />
              ) : null}
            </View>
          }
        />
      )}
    </Screen>
  );
}
