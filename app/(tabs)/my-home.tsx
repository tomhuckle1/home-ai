import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { Badge, Button, Card, ChipSelect, EmptyState, ListRow, Screen, SectionHeader, SkeletonList, Text, TextField, Thumbnail, useTheme } from '@/src/design-system';
import { useAssetsByProperty } from '@/src/hooks/useAssets';
import { useContractors } from '@/src/hooks/useContractors';
import { usePropertyAssets, usePropertyDocuments } from '@/src/hooks/useDocumentLinks';
import { useAllDocuments } from '@/src/hooks/useDocuments';
import { useProperties } from '@/src/hooks/useProperties';
import { useRooms } from '@/src/hooks/useRooms';
import { useInsurancePolicies, useVehicles } from '@/src/hooks/useVehiclesAndInsurance';
import type { AssetRow, DocumentRow, InsurancePolicyRow, PropertyRow, VehicleRow } from '@/src/types/database';

type ViewMode = 'overview' | 'rooms' | 'documents';
const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'rooms', label: 'By room' },
  { value: 'documents', label: 'Documents' },
];

export default function MyHomeScreen() {
  const theme = useTheme();
  const { data: properties, isLoading, refetch, isRefetching } = useProperties();
  const property = properties?.[0];
  const [view, setView] = useState<ViewMode>('overview');

  if (isLoading) return (<Screen edges={['top']}><View style={{ paddingVertical: theme.spacing.md }}><Text variant="largeTitle">My home</Text></View><SkeletonList count={4} /></Screen>);

  if (!property) {
    return (<Screen edges={['top']} style={{ justifyContent: 'center' }}><EmptyState icon="🏠" title="No property yet" description="Add your property to get started." actionLabel="Add property" onAction={() => router.push('/property/new')} /></Screen>);
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
        <ChipSelect options={VIEW_OPTIONS} value={view} onChange={(v) => setView(v ?? 'overview')} allowDeselect={false} />
      </View>
      {view === 'overview' ? <OverviewView property={property} refetch={refetch} isRefetching={isRefetching} /> : null}
      {view === 'rooms' ? <RoomsView property={property} refetch={refetch} isRefetching={isRefetching} /> : null}
      {view === 'documents' ? <DocumentsView /> : null}
    </Screen>
  );
}

/* ── Overview — category-based browsing ───────────────────────────── */

function OverviewView({ property, refetch, isRefetching }: { property: PropertyRow; refetch: () => void; isRefetching: boolean }) {
  const theme = useTheme();
  const { data: allAssets } = useAssetsByProperty(property.id);
  const { data: insurance } = useInsurancePolicies(property.id);
  const { data: vehicles } = useVehicles(property.id);
  const { data: propertyDocs } = usePropertyDocuments(property.id);
  const { data: contractors } = useContractors(property.id);

  const groupedAssets = groupAssetsByCategory(allAssets ?? []);
  const categoryOrder = ['heating', 'security', 'appliance', 'electrical', 'plumbing', 'structural', 'furniture', 'garden', 'other'];

  const daysUntil = (dateStr: string | null) => {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xxl, gap: theme.spacing.lg }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.accent} />}>
      {/* Property details */}
      <Card onPress={() => router.push({ pathname: '/property/edit', params: { id: property.id } })}>
        <ListRow
          leading={<Ionicons name="home-outline" size={20} color={theme.colors.textSecondary} />}
          title="Property details"
          subtitle={[property.property_type?.replace(/_/g, ' '), property.bedrooms ? `${property.bedrooms} bed` : null, property.epc_rating ? `EPC ${property.epc_rating}` : null].filter(Boolean).join(' · ') || 'Tap to add details'}
          showChevron
        />
      </Card>

      {/* Insurance & policies */}
      <View style={{ gap: theme.spacing.xs }}>
        <SectionHeader title="Insurance & policies" actionLabel="Add" onAction={() => router.push({ pathname: '/add/insurance', params: { propertyId: property.id } })} />
        {(!insurance || insurance.length === 0) ? (
          <Card onPress={() => router.push({ pathname: '/add/insurance', params: { propertyId: property.id } })}>
            <ListRow leading={<Text style={{ fontSize: 20 }}>🔑</Text>} title="Add your insurance" subtitle="Track renewals and never miss a deadline" showChevron />
          </Card>
        ) : insurance.map((p) => {
          const days = daysUntil(p.renewal_date);
          const urgent = days !== null && days < 30 && days >= 0;
          const expired = days !== null && days < 0;
          return (
            <Card key={p.id}>
              <ListRow
                leading={<Text style={{ fontSize: 18 }}>🔑</Text>}
                title={`${p.policy_type.replace(/_/g, ' ')}${p.provider ? ` — ${p.provider}` : ''}`}
                subtitle={p.renewal_date ? `Renews ${p.renewal_date}` : undefined}
                trailing={expired ? <Badge label="Expired" tone="danger" /> : urgent ? <Badge label={`${days}d`} tone="warning" /> : undefined}
              />
            </Card>
          );
        })}
      </View>

      {/* Vehicles */}
      <View style={{ gap: theme.spacing.xs }}>
        <SectionHeader title="Vehicles" actionLabel="Add" onAction={() => router.push({ pathname: '/add/vehicle', params: { propertyId: property.id } })} />
        {(!vehicles || vehicles.length === 0) ? (
          <Card onPress={() => router.push({ pathname: '/add/vehicle', params: { propertyId: property.id } })}>
            <ListRow leading={<Text style={{ fontSize: 20 }}>🚗</Text>} title="Add your vehicle" subtitle="Track MOT, tax, insurance, and service dates" showChevron />
          </Card>
        ) : vehicles.map((v) => {
          const motDays = daysUntil(v.mot_expiry);
          const taxDays = daysUntil(v.tax_expiry);
          const urgentMot = motDays !== null && motDays < 30;
          const urgentTax = taxDays !== null && taxDays < 30;
          return (
            <Card key={v.id}>
              <ListRow
                leading={<Text style={{ fontSize: 18 }}>🚗</Text>}
                title={[v.make, v.model].filter(Boolean).join(' ') || v.registration || 'Vehicle'}
                subtitle={v.registration ?? undefined}
                trailing={urgentMot ? <Badge label={`MOT ${motDays}d`} tone={motDays! < 0 ? 'danger' : 'warning'} /> : urgentTax ? <Badge label={`Tax ${taxDays}d`} tone={taxDays! < 0 ? 'danger' : 'warning'} /> : undefined}
              />
            </Card>
          );
        })}
      </View>

      {/* Assets by category */}
      {categoryOrder.map((cat) => {
        const items = groupedAssets[cat];
        if (!items || items.length === 0) return null;
        return (
          <View key={cat} style={{ gap: theme.spacing.xs }}>
            <SectionHeader title={categoryLabel(cat)} />
            {items.slice(0, 5).map((a) => (
              <Card key={a.id}>
                <ListRow
                  leading={a.primary_photo_path ? <Thumbnail bucket="documents" path={a.primary_photo_path} size={36} /> : <Text style={{ fontSize: 18 }}>{categoryIcon(cat)}</Text>}
                  title={a.name}
                  subtitle={[a.brand, a.model].filter(Boolean).join(' · ') || undefined}
                  showChevron
                  onPress={() => router.push(`/asset/${a.id}`)}
                />
              </Card>
            ))}
            {items.length > 5 ? <Text variant="footnote" color="textSecondary">+{items.length - 5} more</Text> : null}
          </View>
        );
      })}

      {/* Property documents */}
      {propertyDocs && propertyDocs.length > 0 ? (
        <View style={{ gap: theme.spacing.xs }}>
          <SectionHeader title="Property documents" />
          {propertyDocs.slice(0, 3).map((doc) => (
            <Card key={doc.id}>
              <ListRow title={doc.product_description || doc.document_type.replace(/_/g, ' ')} subtitle={doc.supplier ?? doc.document_date ?? undefined} showChevron onPress={() => router.push(`/document/${doc.id}`)} />
            </Card>
          ))}
        </View>
      ) : null}

      {/* Contractors */}
      {contractors && contractors.length > 0 ? (
        <View style={{ gap: theme.spacing.xs }}>
          <SectionHeader title="Contractors" actionLabel="Manage" onAction={() => router.push({ pathname: '/contractor', params: { propertyId: property.id } })} />
          {contractors.slice(0, 3).map((c) => (
            <Card key={c.id}><ListRow title={c.name} subtitle={c.trade ?? undefined} showChevron onPress={() => router.push(`/contractor/${c.id}`)} /></Card>
          ))}
        </View>
      ) : null}

      {/* Passport */}
      <Card onPress={() => router.push(`/passport/${property.id}`)}>
        <ListRow leading={<Ionicons name="ribbon-outline" size={20} color={theme.colors.accent} />} title="Home Passport" subtitle="Generate a shareable property record" showChevron />
      </Card>
    </ScrollView>
  );
}

/* ── Rooms view ───────────────────────────────────────────────────── */

function RoomsView({ property, refetch, isRefetching }: { property: PropertyRow; refetch: () => void; isRefetching: boolean }) {
  const theme = useTheme();
  const { data: rooms, isLoading } = useRooms(property.id);

  if (isLoading) return <SkeletonList count={3} />;

  return (
    <FlatList
      data={rooms ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.accent} />}
      ListHeaderComponent={
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="headline">{(rooms?.length ?? 0)} room{(rooms?.length ?? 0) === 1 ? '' : 's'}</Text>
          <Button label="Add room" variant="ghost" fullWidth={false} onPress={() => router.push({ pathname: '/room/new', params: { propertyId: property.id } })} />
        </View>
      }
      ListEmptyComponent={<EmptyState icon="🚪" title="No rooms yet" description="Rooms are optional — you can also browse everything by category in the Overview tab." actionLabel="Add a room" onAction={() => router.push({ pathname: '/room/new', params: { propertyId: property.id } })} />}
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
    />
  );
}

/* ── Documents view ───────────────────────────────────────────────── */

function DocumentsView() {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const { data: documents, isLoading, refetch, isRefetching } = useAllDocuments(search);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingBottom: theme.spacing.sm }}><TextField placeholder="Search documents…" value={search} onChangeText={setSearch} autoCapitalize="none" /></View>
      {isLoading ? <ActivityIndicator /> : (
        <FlatList
          data={documents ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={theme.colors.accent} />}
          ListEmptyComponent={<EmptyState icon="📄" title={search ? 'No matches' : 'No documents yet'} description={search ? 'Try a different search.' : 'Tap + to scan or upload a document.'} />}
          renderItem={({ item }: { item: DocumentRow }) => (
            <Card>
              <ListRow title={item.product_description || item.document_type.replace(/_/g, ' ')} subtitle={item.supplier ?? item.document_date ?? undefined} showChevron onPress={() => router.push(`/document/${item.id}`)} />
            </Card>
          )}
        />
      )}
    </View>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────── */

function groupAssetsByCategory(assets: AssetRow[]): Record<string, AssetRow[]> {
  const groups: Record<string, AssetRow[]> = {};
  for (const a of assets) {
    if (a.status !== 'active') continue;
    if (!groups[a.category]) groups[a.category] = [];
    groups[a.category].push(a);
  }
  return groups;
}

function categoryLabel(cat: string): string {
  const labels: Record<string, string> = { heating: 'Heating & hot water', security: 'Safety & security', appliance: 'Appliances', electrical: 'Electrics & technology', plumbing: 'Plumbing', structural: 'Structure & exterior', furniture: 'Furniture', garden: 'Garden & outdoor', other: 'Other items' };
  return labels[cat] ?? cat;
}

function categoryIcon(cat: string): string {
  const icons: Record<string, string> = { heating: '🔥', security: '🛡️', appliance: '📦', electrical: '⚡', plumbing: '🚿', structural: '🏗️', furniture: '🛋️', garden: '🌳', other: '📦' };
  return icons[cat] ?? '📦';
}

function roomIcon(roomType: string | null): keyof typeof Ionicons.glyphMap {
  switch (roomType?.toLowerCase()) {
    case 'kitchen': return 'restaurant-outline'; case 'bathroom': return 'water-outline'; case 'bedroom': return 'bed-outline';
    case 'living room': return 'tv-outline'; case 'garden': return 'leaf-outline'; case 'garage': return 'car-outline';
    case 'hallway': return 'enter-outline'; case 'loft': return 'arrow-up-outline'; case 'exterior': return 'sunny-outline';
    default: return 'cube-outline';
  }
}
