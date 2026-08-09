import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';

import { Badge, Button, Card, EmptyState, ListRow, QuickAction, Screen, SectionHeader, Text, useTheme } from '@/src/design-system';
import { useContractors } from '@/src/hooks/useContractors';
import { useProperty } from '@/src/hooks/useProperty';
import { useRooms } from '@/src/hooks/useRooms';
import { useSignedUrl } from '@/src/hooks/useSignedUrl';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data: property } = useProperty(id);
  const { data: rooms, isLoading, refetch, isRefetching } = useRooms(id);
  const { data: contractors } = useContractors(id);
  const { data: coverUrl } = useSignedUrl('property-photos', property?.cover_photo_path);

  const roomCount = rooms?.length ?? 0;
  const contractorCount = contractors?.length ?? 0;

  return (
    <Screen edges={['bottom']}>
      {/* Cover photo */}
      {coverUrl ? (
        <Image source={{ uri: coverUrl }} style={{ width: '100%', height: 180, borderRadius: theme.radius.lg, marginBottom: theme.spacing.sm }} contentFit="cover" />
      ) : null}

      <View style={{ paddingVertical: theme.spacing.md, gap: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text variant="title1">{property?.address_line1 ?? 'Property'}</Text>
            {property?.city || property?.postcode ? (
              <Text variant="body" color="textSecondary">{[property?.city, property?.postcode].filter(Boolean).join(', ')}</Text>
            ) : null}
            {property?.property_type ? (
              <Badge label={property.property_type.replace(/_/g, ' ')} tone="neutral" />
            ) : null}
          </View>
          <Button label="Edit" variant="ghost" fullWidth={false} onPress={() => router.push({ pathname: '/property/edit', params: { id } })} />
        </View>

        {/* Quick actions */}
        <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
          <QuickAction icon="scan" label="Scan" onPress={() => router.push({ pathname: '/capture/scan', params: { propertyId: id, mode: 'document' } })} />
          <QuickAction icon="add-circle-outline" label="Add room" onPress={() => router.push({ pathname: '/room/new', params: { propertyId: id } })} />
          <QuickAction icon="ribbon-outline" label="Passport" onPress={() => router.push(`/passport/${id}`)} />
          <QuickAction icon="alarm-outline" label="Reminder" onPress={() => router.push({ pathname: '/maintenance/new', params: { propertyId: id } })} />
        </View>

        {/* Property details summary */}
        {(property?.bedrooms || property?.year_built || property?.epc_rating) ? (
          <Card>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
              {property?.bedrooms ? <MiniStat label="Bedrooms" value={String(property.bedrooms)} /> : null}
              {property?.year_built ? <MiniStat label="Built" value={String(property.year_built)} /> : null}
              {property?.epc_rating ? <MiniStat label="EPC" value={property.epc_rating} /> : null}
              {property?.council_tax_band ? <MiniStat label="Council tax" value={`Band ${property.council_tax_band}`} /> : null}
            </View>
          </Card>
        ) : null}
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={rooms ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={theme.colors.accent} />}
          ListHeaderComponent={
            <View style={{ gap: theme.spacing.sm }}>
              {roomCount > 0 ? <SectionHeader title={`${roomCount} room${roomCount === 1 ? '' : 's'}`} /> : null}
            </View>
          }
          ListEmptyComponent={<EmptyState icon="🚪" title="No rooms yet" description="Add your first room to start recording what's in it." />}
          renderItem={({ item }) => (
            <Card>
              <ListRow
                leading={
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.accentMuted, alignItems: 'center', justifyContent: 'center' }}>
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
          ListFooterComponent={
            <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
              {/* Contractors section */}
              <SectionHeader
                title={`Contractors${contractorCount > 0 ? ` (${contractorCount})` : ''}`}
                actionLabel="Manage"
                onAction={() => router.push({ pathname: '/contractor', params: { propertyId: id } })}
              />
              {contractorCount === 0 ? (
                <Card>
                  <ListRow
                    leading={<Ionicons name="construct-outline" size={20} color={theme.colors.textTertiary} />}
                    title="Save your tradespeople"
                    subtitle="Plumbers, electricians, builders — all in one place"
                    showChevron
                    onPress={() => router.push({ pathname: '/contractor/new', params: { propertyId: id } })}
                  />
                </Card>
              ) : (
                contractors?.slice(0, 3).map((c) => (
                  <Card key={c.id}>
                    <ListRow title={c.name} subtitle={c.trade ?? undefined} showChevron onPress={() => router.push(`/contractor/${c.id}`)} />
                  </Card>
                ))
              )}
            </View>
          }
        />
      )}
    </Screen>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 1 }}>
      <Text variant="caption" color="textTertiary">{label}</Text>
      <Text variant="headline">{value}</Text>
    </View>
  );
}

function roomIcon(roomType: string | null): keyof typeof Ionicons.glyphMap {
  switch (roomType?.toLowerCase()) {
    case 'kitchen': return 'restaurant-outline';
    case 'bathroom': return 'water-outline';
    case 'bedroom': return 'bed-outline';
    case 'living room': return 'tv-outline';
    case 'garden': return 'leaf-outline';
    case 'garage': return 'car-outline';
    case 'hallway': return 'enter-outline';
    default: return 'cube-outline';
  }
}
