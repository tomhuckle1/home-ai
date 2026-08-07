import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';

import { Button, Card, EmptyState, ListRow, QuickAction, Screen, SectionHeader, Text, useTheme } from '@/src/design-system';
import { useProperty } from '@/src/hooks/useProperty';
import { useRooms } from '@/src/hooks/useRooms';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data: property } = useProperty(id);
  const { data: rooms, isLoading, refetch, isRefetching } = useRooms(id);

  const roomCount = rooms?.length ?? 0;

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

        {/* Quick actions */}
        <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
          <QuickAction
            icon="scan"
            label="Scan"
            onPress={() =>
              router.push({ pathname: '/capture/scan', params: { propertyId: id, mode: 'document' } })
            }
          />
          <QuickAction
            icon="add-circle-outline"
            label="Add room"
            onPress={() => router.push({ pathname: '/room/new', params: { propertyId: id } })}
          />
          <QuickAction
            icon="ribbon-outline"
            label="Passport"
            onPress={() => router.push(`/passport/${id}`)}
          />
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={rooms ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={theme.colors.accent}
            />
          }
          ListHeaderComponent={
            roomCount > 0 ? (
              <SectionHeader
                title={`${roomCount} room${roomCount === 1 ? '' : 's'}`}
              />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="🚪"
              title="No rooms yet"
              description="Add your first room — kitchen, bathroom, garden — to start recording what's in it."
            />
          }
          renderItem={({ item }) => (
            <Card>
              <ListRow
                leading={
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: theme.colors.accentMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={roomIcon(item.room_type)} size={18} color={theme.colors.accent} />
                  </View>
                }
                title={item.name}
                subtitle={item.room_type ?? undefined}
                showChevron
                onPress={() => router.push(`/room/${item.id}`)}
              />
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

function roomIcon(roomType: string | null): keyof typeof Ionicons.glyphMap {
  switch (roomType?.toLowerCase()) {
    case 'kitchen':
      return 'restaurant-outline';
    case 'bathroom':
      return 'water-outline';
    case 'bedroom':
      return 'bed-outline';
    case 'living room':
      return 'tv-outline';
    case 'garden':
      return 'leaf-outline';
    case 'garage':
      return 'car-outline';
    case 'hallway':
      return 'enter-outline';
    default:
      return 'cube-outline';
  }
}
