import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';

import { Badge, Button, Card, ChipSelect, EmptyState, ListRow, Screen, SectionHeader, SkeletonList, Text, TextField, Thumbnail, useTheme } from '@/src/design-system';
import { useAssetsByProperty } from '@/src/hooks/useAssets';
import { useContractors } from '@/src/hooks/useContractors';
import { usePropertyAssets, usePropertyDocuments } from '@/src/hooks/useDocumentLinks';
import { useAllDocuments } from '@/src/hooks/useDocuments';
import { useProperties } from '@/src/hooks/useProperties';
import { useRooms } from '@/src/hooks/useRooms';
import { useTimeline } from '@/src/hooks/useTimeline';
import { TIMELINE_EVENT_ICON } from '@/src/lib/timeline-icons';
import type { DocumentRow, DocumentType, ExtractionStatus, PropertyRow, TimelineEventRow } from '@/src/types/database';

type ViewMode = 'rooms' | 'documents' | 'timeline';

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'rooms', label: 'Rooms & items' },
  { value: 'documents', label: 'Documents' },
  { value: 'timeline', label: 'Timeline' },
];

export default function MyHomeScreen() {
  const theme = useTheme();
  const { data: properties, isLoading, refetch, isRefetching } = useProperties();
  const property = properties?.[0];
  const [view, setView] = useState<ViewMode>('rooms');

  if (isLoading) return (<Screen edges={['top']}><View style={{ paddingVertical: theme.spacing.md }}><Text variant="largeTitle">My home</Text></View><SkeletonList count={3} /></Screen>);

  if (!property) {
    return (<Screen edges={['top']} style={{ justifyContent: 'center' }}><EmptyState icon="🏠" title="No property yet" description="Add your property to start building its record." actionLabel="Add property" onAction={() => router.push('/property/new')} /></Screen>);
  }

  return (
    <Screen edges={['top']}>
      <View style={{ paddingTop: theme.spacing.md, paddingBottom: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text variant="largeTitle">My home</Text>
            <Text variant="footnote" color="textSecondary" style={{ marginTop: 2 }}>{property.address_line1}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Search" onPress={() => router.push('/search')}>
            <Ionicons name="search" size={22} color={theme.colors.textSecondary} />
          </Pressable>
        </View>
      </View>
      <View style={{ paddingBottom: theme.spacing.sm }}>
        <ChipSelect options={VIEW_OPTIONS} value={view} onChange={(v) => setView(v ?? 'rooms')} allowDeselect={false} />
      </View>
      {view === 'rooms' ? <RoomsView property={property} refetch={refetch} isRefetching={isRefetching} /> : null}
      {view === 'documents' ? <DocumentsView property={property} /> : null}
      {view === 'timeline' ? <TimelineView property={property} /> : null}
    </Screen>
  );
}

/* ── Rooms view with property-level assets and docs ───────────────── */

function RoomsView({ property, refetch, isRefetching }: { property: PropertyRow; refetch: () => void; isRefetching: boolean }) {
  const theme = useTheme();
  const { data: rooms, isLoading } = useRooms(property.id);
  const { data: contractors } = useContractors(property.id);
  const { data: propertyAssets } = usePropertyAssets(property.id);
  const { data: propertyDocs } = usePropertyDocuments(property.id);
  const roomCount = rooms?.length ?? 0;
  const contractorCount = contractors?.length ?? 0;

  if (isLoading) return <SkeletonList count={3} />;

  return (
    <FlatList
      data={rooms ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.accent} />}
      ListHeaderComponent={
        <View style={{ gap: theme.spacing.sm }}>
          {/* Property-level assets (structural, no room) */}
          {propertyAssets && propertyAssets.length > 0 ? (
            <View style={{ gap: theme.spacing.xs }}>
              <SectionHeader title="Property" actionLabel="Add" onAction={() => router.push({ pathname: '/asset/new', params: { propertyId: property.id } })} />
              {propertyAssets.map((a) => (
                <Card key={a.id}>
                  <ListRow
                    leading={<View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="cube-outline" size={18} color={theme.colors.textSecondary} /></View>}
                    title={a.name}
                    subtitle={[a.brand, a.model, a.warranty_expiry ? `Warranty ${new Date(a.warranty_expiry) > new Date() ? 'active' : 'expired'}` : null].filter(Boolean).join(' · ') || a.category}
                    showChevron
                    onPress={() => router.push(`/asset/${a.id}`)}
                  />
                </Card>
              ))}
            </View>
          ) : (
            <Card onPress={() => router.push({ pathname: '/asset/new', params: { propertyId: property.id } })}>
              <ListRow leading={<Ionicons name="cube-outline" size={20} color={theme.colors.textTertiary} />} title="Add property-level items" subtitle="Roof, boiler, wiring, alarm, solar panels" showChevron />
            </Card>
          )}

          {/* Property-level documents (insurance, EPC, mortgage) */}
          {propertyDocs && propertyDocs.length > 0 ? (
            <View style={{ gap: theme.spacing.xs }}>
              <SectionHeader title="Property documents" />
              {propertyDocs.slice(0, 4).map((doc) => (
                <Card key={doc.id}>
                  <ListRow
                    leading={<View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={docIconFor(doc.document_type)} size={16} color={theme.colors.textSecondary} /></View>}
                    title={doc.product_description || doc.document_type.replace(/_/g, ' ')}
                    subtitle={doc.expiry_date ? (new Date(doc.expiry_date) < new Date() ? `Expired ${doc.expiry_date}` : `Expires ${doc.expiry_date}`) : (doc.document_date ?? undefined)}
                    trailing={doc.expiry_date && new Date(doc.expiry_date) < new Date() ? <Badge label="Expired" tone="danger" /> : undefined}
                    showChevron
                    onPress={() => router.push(`/document/${doc.id}`)}
                  />
                </Card>
              ))}
            </View>
          ) : null}

          {/* Edit property */}
          <Card onPress={() => router.push({ pathname: '/property/edit', params: { id: property.id } })}>
            <ListRow
              leading={<Ionicons name="create-outline" size={20} color={theme.colors.textSecondary} />}
              title="Edit property details"
              subtitle={[property.property_type?.replace(/_/g, ' '), property.bedrooms ? `${property.bedrooms} bed` : null, property.epc_rating ? `EPC ${property.epc_rating}` : null].filter(Boolean).join(' · ') || 'Add bedrooms, year built, EPC'}
              showChevron
            />
          </Card>

          {/* Rooms header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.sm }}>
            <Text variant="headline">{roomCount} room{roomCount === 1 ? '' : 's'}</Text>
            <Button label="Add room" variant="ghost" fullWidth={false} onPress={() => router.push({ pathname: '/room/new', params: { propertyId: property.id } })} />
          </View>
        </View>
      }
      ListEmptyComponent={<EmptyState icon="🚪" title="No rooms yet" description="Add your first room to start recording what's in it." actionLabel="Add a room" onAction={() => router.push({ pathname: '/room/new', params: { propertyId: property.id } })} />}
      renderItem={({ item }) => (
        <Card>
          <ListRow
            leading={<View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.accentMuted, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={roomIcon(item.room_type)} size={18} color={theme.colors.accent} /></View>}
            title={item.name}
            subtitle={[item.room_type, item.floor ? `${item.floor} floor` : null].filter(Boolean).join(' · ') || undefined}
            showChevron
            onPress={() => router.push(`/room/${item.id}`)}
          />
        </Card>
      )}
      ListFooterComponent={
        <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
          <SectionHeader title={`Contractors${contractorCount > 0 ? ` (${contractorCount})` : ''}`} actionLabel="Manage" onAction={() => router.push({ pathname: '/contractor', params: { propertyId: property.id } })} />
          {contractorCount === 0 ? (
            <Card onPress={() => router.push({ pathname: '/contractor/new', params: { propertyId: property.id } })}><ListRow leading={<Ionicons name="construct-outline" size={20} color={theme.colors.textTertiary} />} title="Save your tradespeople" subtitle="Plumbers, electricians, builders" showChevron /></Card>
          ) : contractors?.slice(0, 3).map((c) => (
            <Card key={c.id}><ListRow title={c.name} subtitle={c.trade ?? undefined} showChevron onPress={() => router.push(`/contractor/${c.id}`)} /></Card>
          ))}
          <Card onPress={() => router.push(`/passport/${property.id}`)}>
            <ListRow leading={<Ionicons name="ribbon-outline" size={20} color={theme.colors.accent} />} title="Home Passport" subtitle="Generate a shareable property record" showChevron />
          </Card>
        </View>
      }
    />
  );
}

/* ── Documents view ───────────────────────────────────────────────── */

function statusBadge(status: ExtractionStatus) {
  if (status === 'completed') return null;
  if (status === 'failed') return <Badge label="Needs info" tone="warning" />;
  return <Badge label="Reading…" tone="neutral" />;
}

function DocumentsView({ property }: { property: PropertyRow }) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const { data: documents, isLoading, refetch, isRefetching } = useAllDocuments(search);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingBottom: theme.spacing.sm }}><TextField placeholder="Search by supplier, brand, product…" value={search} onChangeText={setSearch} autoCapitalize="none" /></View>
      {isLoading ? <ActivityIndicator /> : (
        <FlatList
          data={documents ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={theme.colors.accent} />}
          ListEmptyComponent={<EmptyState icon="📄" title={search ? 'No matches' : 'No documents yet'} description={search ? 'Try a different search term.' : 'Tap the + button to scan a receipt, manual or warranty.'} />}
          renderItem={({ item }: { item: DocumentRow }) => {
            const isExpired = item.expiry_date && new Date(item.expiry_date) < new Date();
            return (
              <Card style={isExpired ? { opacity: 0.6 } : undefined}>
                <ListRow
                  leading={<View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={docIconFor(item.document_type)} size={18} color={theme.colors.textSecondary} /></View>}
                  title={item.product_description || item.original_filename || item.document_type.replace(/_/g, ' ')}
                  subtitle={[item.supplier, item.document_date, isExpired ? 'Expired' : null].filter(Boolean).join(' · ') || item.document_type.replace(/_/g, ' ')}
                  trailing={statusBadge(item.extraction_status)}
                  showChevron
                  onPress={() => router.push(`/document/${item.id}`)}
                />
              </Card>
            );
          }}
        />
      )}
    </View>
  );
}

/* ── Timeline view ────────────────────────────────────────────────── */

function TimelineView({ property }: { property: PropertyRow }) {
  const theme = useTheme();
  const { data: events, isLoading, refetch, isRefetching } = useTimeline(property.id);

  if (isLoading) return <SkeletonList count={3} />;

  const sorted = [...(events ?? [])].sort((a, b) => b.event_date.localeCompare(a.event_date));
  const totalCost = sorted.reduce((sum, e) => sum + (e.cost ?? 0), 0);

  return (
    <FlatList
      data={sorted}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={theme.colors.accent} />}
      ListHeaderComponent={sorted.length > 0 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="footnote" color="textSecondary">{sorted.length} event{sorted.length === 1 ? '' : 's'}{totalCost > 0 ? ` · £${Math.round(totalCost).toLocaleString()}` : ''}</Text>
          <Button label="Add" variant="ghost" fullWidth={false} onPress={() => router.push({ pathname: '/timeline/new', params: { propertyId: property.id } })} />
        </View>
      ) : null}
      ListEmptyComponent={<EmptyState icon="🕓" title="No history yet" description="Your property's history builds itself as you add rooms, items and documents." actionLabel="Add a past event" onAction={() => router.push({ pathname: '/timeline/new', params: { propertyId: property.id } })} />}
      renderItem={({ item }: { item: TimelineEventRow }) => {
        const hasCost = item.cost != null && item.cost > 0;
        return (
          <Card>
            <ListRow
              leading={<View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 18, lineHeight: 22 }}>{TIMELINE_EVENT_ICON[item.event_type]}</Text></View>}
              title={item.title}
              subtitle={[item.event_date, hasCost ? `£${item.cost}` : null].filter(Boolean).join(' · ') || undefined}
              showChevron
              onPress={() => router.push(`/timeline/${item.id}`)}
            />
          </Card>
        );
      }}
    />
  );
}

function roomIcon(roomType: string | null): keyof typeof Ionicons.glyphMap {
  switch (roomType?.toLowerCase()) {
    case 'kitchen': return 'restaurant-outline'; case 'bathroom': return 'water-outline'; case 'bedroom': return 'bed-outline';
    case 'living room': return 'tv-outline'; case 'garden': return 'leaf-outline'; case 'garage': return 'car-outline';
    case 'hallway': return 'enter-outline'; case 'loft': return 'arrow-up-outline'; case 'exterior': return 'sunny-outline';
    default: return 'cube-outline';
  }
}

function docIconFor(type: DocumentType): keyof typeof Ionicons.glyphMap {
  const map: Partial<Record<DocumentType, keyof typeof Ionicons.glyphMap>> = {
    receipt: 'receipt-outline', manual: 'book-outline', warranty: 'shield-checkmark-outline',
    certificate: 'ribbon-outline', invoice: 'document-text-outline', insurance_policy: 'umbrella-outline',
    epc: 'leaf-outline', gas_safety_record: 'flame-outline', mortgage_document: 'home-outline',
  };
  return map[type] ?? 'document-outline';
}
