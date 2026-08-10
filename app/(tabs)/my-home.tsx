import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';

import {
  Badge, Button, Card, ChipSelect, EmptyState, ListRow, Screen,
  SectionHeader, SkeletonList, Text, TextField, Thumbnail, useTheme,
} from '@/src/design-system';
import { useAssetsByProperty } from '@/src/hooks/useAssets';
import { useContractors } from '@/src/hooks/useContractors';
import { usePropertyDocuments } from '@/src/hooks/useDocumentLinks';
import { useAllDocuments } from '@/src/hooks/useDocuments';
import { useProperties } from '@/src/hooks/useProperties';
import { useRooms } from '@/src/hooks/useRooms';
import { useInsurancePolicies, useVehicles } from '@/src/hooks/useVehiclesAndInsurance';
import { policyTypeLabel } from '@/src/lib/display-labels';
import type { AssetRow, DocumentRow, PropertyRow } from '@/src/types/database';

type ViewMode = 'overview' | 'rooms' | 'documents';
const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'overview', label: 'Everything' },
  { value: 'rooms', label: 'By room' },
  { value: 'documents', label: 'Documents' },
];

export default function MyHomeScreen() {
  const theme = useTheme();
  const { data: properties, isLoading, refetch, isRefetching } = useProperties();
  const property = properties?.[0];
  const [view, setView] = useState<ViewMode>('overview');

  if (isLoading) return (
    <Screen edges={['top']}>
      <View style={{ paddingVertical: theme.spacing.md }}><Text variant="largeTitle">My home</Text></View>
      <SkeletonList count={4} />
    </Screen>
  );

  if (!property) {
    return (
      <Screen edges={['top']} style={{ justifyContent: 'center' }}>
        <EmptyState icon="🏠" title="No property yet" description="Add your property to get started." actionLabel="Add property" onAction={() => router.push('/property/new')} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      {/* Header */}
      <View style={{ paddingTop: theme.spacing.md, paddingBottom: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text variant="largeTitle">My home</Text>
            <Text variant="footnote" color="textSecondary" style={{ marginTop: 2 }}>
              {[property.address_line1, property.city].filter(Boolean).join(', ')}
            </Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Search" onPress={() => router.push('/search')}>
            <Ionicons name="search" size={22} color={theme.colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* View switcher */}
      <View style={{ paddingBottom: theme.spacing.sm }}>
        <ChipSelect options={VIEW_OPTIONS} value={view} onChange={(v) => setView(v ?? 'overview')} allowDeselect={false} />
      </View>

      {view === 'overview' ? <OverviewView property={property} refetch={refetch} isRefetching={isRefetching} /> : null}
      {view === 'rooms' ? <RoomsView property={property} refetch={refetch} isRefetching={isRefetching} /> : null}
      {view === 'documents' ? <DocumentsView /> : null}
    </Screen>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   OVERVIEW — the main view, optimised for "what have I recorded?"
   ═══════════════════════════════════════════════════════════════════ */

function OverviewView({ property, refetch, isRefetching }: { property: PropertyRow; refetch: () => void; isRefetching: boolean }) {
  const theme = useTheme();
  const { data: allAssets } = useAssetsByProperty(property.id);
  const { data: insurance } = useInsurancePolicies(property.id);
  const { data: vehicles } = useVehicles(property.id);
  const { data: propertyDocs } = usePropertyDocuments(property.id);
  const { data: contractors } = useContractors(property.id);
  const { data: rooms } = useRooms(property.id);

  const grouped = groupAssetsByCategory(allAssets ?? []);
  const totalItems = (allAssets ?? []).filter((a) => a.status === 'active').length;
  const categoryOrder = ['heating', 'security', 'appliance', 'electrical', 'plumbing', 'structural', 'furniture', 'garden', 'other'];
  const populatedCategories = categoryOrder.filter((c) => (grouped[c]?.length ?? 0) > 0);
  const daysUntil = (d: string | null) => d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null;

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: theme.spacing.xxl, gap: theme.spacing.lg }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.accent} />}
    >
      {/* ── 1. Summary bar ─────────────────────────────────────────── */}
      <Animated.View entering={FadeIn.duration(400)}>
        <View style={[s.summaryBar, { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.lg }]}>
          <SummaryPill icon="📦" value={String(totalItems)} label="items" />
          <View style={[s.divider, { backgroundColor: theme.colors.border }]} />
          <SummaryPill icon="🚪" value={String(rooms?.length ?? 0)} label="rooms" />
          <View style={[s.divider, { backgroundColor: theme.colors.border }]} />
          <SummaryPill icon="📄" value={String(propertyDocs?.length ?? 0)} label="docs" />
          <View style={[s.divider, { backgroundColor: theme.colors.border }]} />
          <SummaryPill icon="🔧" value={String(contractors?.length ?? 0)} label="trades" />
        </View>
      </Animated.View>

      {/* ── 2. Your items — the core content ───────────────────────── */}
      {populatedCategories.length > 0 ? (
        populatedCategories.map((cat, sectionIndex) => {
          const items = grouped[cat]!;
          return (
            <Animated.View key={cat} entering={FadeInDown.delay(sectionIndex * 80).duration(350)}>
              <View style={{ gap: theme.spacing.xs }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                  <View style={[s.categoryBadge, { backgroundColor: theme.colors.surfaceAlt }]}>
                    <Text style={{ fontSize: 16, lineHeight: 20 }}>{categoryIcon(cat)}</Text>
                  </View>
                  <Text variant="headline" style={{ flex: 1 }}>{categoryLabel(cat)}</Text>
                  <Text variant="caption" color="textTertiary">{items.length}</Text>
                </View>
                {items.slice(0, 4).map((a) => (
                  <Card key={a.id} onPress={() => router.push(`/asset/${a.id}`)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                      {a.primary_photo_path ? (
                        <Thumbnail bucket="documents" path={a.primary_photo_path} size={40} />
                      ) : (
                        <View style={[s.itemIcon, { backgroundColor: theme.colors.accentMuted }]}>
                          <Text style={{ fontSize: 18, lineHeight: 22 }}>{categoryIcon(cat)}</Text>
                        </View>
                      )}
                      <View style={{ flex: 1, gap: 1 }}>
                        <Text variant="body" numberOfLines={1}>{a.name}</Text>
                        {a.brand || a.model ? (
                          <Text variant="caption" color="textSecondary" numberOfLines={1}>
                            {[a.brand, a.model].filter(Boolean).join(' · ')}
                          </Text>
                        ) : null}
                      </View>
                      {a.warranty_expiry && new Date(a.warranty_expiry) > new Date() ? (
                        <Badge label="Warranty" tone="accent" />
                      ) : null}
                      <Ionicons name="chevron-forward" size={14} color={theme.colors.textTertiary} />
                    </View>
                  </Card>
                ))}
                {items.length > 4 ? (
                  <Text variant="caption" color="accent" style={{ textAlign: 'center', paddingVertical: theme.spacing.xxs }}>
                    View all {items.length} →
                  </Text>
                ) : null}
              </View>
            </Animated.View>
          );
        })
      ) : (
        /* Empty state — no items yet */
        <Animated.View entering={FadeInDown.duration(400)}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/add')} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <View style={[s.emptyHero, { backgroundColor: theme.colors.accentMuted, borderRadius: theme.radius.xl }]}>
              <Text style={{ fontSize: 40, lineHeight: 48 }}>📦</Text>
              <Text variant="title2" style={{ textAlign: 'center' }}>Start recording your home</Text>
              <Text variant="body" color="textSecondary" style={{ textAlign: 'center', maxWidth: 260 }}>
                Tap here to add your first item — a boiler, fire alarm, appliance, or anything else.
              </Text>
              <View style={[s.addChip, { backgroundColor: theme.colors.accent, borderRadius: theme.radius.pill }]}>
                <Ionicons name="add" size={16} color={theme.colors.onAccent} />
                <Text variant="body" style={{ color: theme.colors.onAccent, fontWeight: '600' }}>Add something</Text>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      )}

      {/* ── 3. Insurance & vehicles (compact) ──────────────────────── */}
      <Animated.View entering={FadeInDown.delay(populatedCategories.length * 80 + 100).duration(350)}>
        <CompactSection
          icon="🔑"
          title="Insurance & policies"
          count={insurance?.length ?? 0}
          emptyText="Add insurance"
          onAdd={() => router.push({ pathname: '/add/insurance', params: { propertyId: property.id } })}
        >
          {(insurance ?? []).map((p) => {
            const days = daysUntil(p.renewal_date);
            return (
              <CompactRow
                key={p.id}
                title={`${policyTypeLabel(p.policy_type)}${p.provider ? ` — ${p.provider}` : ''}`}
                subtitle={p.renewal_date ? `Renews ${p.renewal_date}` : undefined}
                badge={days !== null && days < 0 ? { label: 'Expired', tone: 'danger' as const } : days !== null && days < 30 ? { label: `${days}d`, tone: 'warning' as const } : undefined}
              />
            );
          })}
        </CompactSection>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(populatedCategories.length * 80 + 180).duration(350)}>
        <CompactSection
          icon="🚗"
          title="Vehicles"
          count={vehicles?.length ?? 0}
          emptyText="Add vehicle"
          onAdd={() => router.push({ pathname: '/add/vehicle', params: { propertyId: property.id } })}
        >
          {(vehicles ?? []).map((v) => {
            const motDays = daysUntil(v.mot_expiry);
            return (
              <CompactRow
                key={v.id}
                title={[v.make, v.model].filter(Boolean).join(' ') || v.registration || 'Vehicle'}
                subtitle={v.registration ?? undefined}
                badge={motDays !== null && motDays < 30 ? { label: `MOT ${motDays < 0 ? 'expired' : `${motDays}d`}`, tone: motDays < 0 ? 'danger' as const : 'warning' as const } : undefined}
              />
            );
          })}
        </CompactSection>
      </Animated.View>

      {/* ── 4. Quick links row ─────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(populatedCategories.length * 80 + 260).duration(350)}>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <QuickLink icon="flash-outline" label="Energy" onPress={() => router.push({ pathname: '/energy', params: { propertyId: property.id } })} />
          <QuickLink icon="ribbon-outline" label="Passport" onPress={() => router.push(`/passport/${property.id}`)} />
          <QuickLink icon="construct-outline" label={`Trades${(contractors?.length ?? 0) > 0 ? ` (${contractors!.length})` : ''}`} onPress={() => router.push({ pathname: '/contractor', params: { propertyId: property.id } })} />
        </View>
      </Animated.View>

      {/* ── 5. Property documents ──────────────────────────────────── */}
      {propertyDocs && propertyDocs.length > 0 ? (
        <Animated.View entering={FadeInDown.delay(populatedCategories.length * 80 + 340).duration(350)}>
          <View style={{ gap: theme.spacing.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
              <View style={[s.categoryBadge, { backgroundColor: theme.colors.surfaceAlt }]}>
                <Text style={{ fontSize: 16, lineHeight: 20 }}>📄</Text>
              </View>
              <Text variant="headline" style={{ flex: 1 }}>Property documents</Text>
              <Text variant="caption" color="textTertiary">{propertyDocs.length}</Text>
            </View>
            {propertyDocs.slice(0, 3).map((doc) => (
              <Card key={doc.id} onPress={() => router.push(`/document/${doc.id}`)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                  <View style={[s.itemIcon, { backgroundColor: theme.colors.surfaceAlt }]}>
                    <Ionicons name="document-outline" size={18} color={theme.colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text variant="body" numberOfLines={1}>{doc.product_description || doc.document_type.replace(/_/g, ' ')}</Text>
                    <Text variant="caption" color="textSecondary" numberOfLines={1}>{doc.supplier ?? doc.document_date ?? ''}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={theme.colors.textTertiary} />
                </View>
              </Card>
            ))}
          </View>
        </Animated.View>
      ) : null}

      {/* ── 6. Property details (bottom) ───────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(populatedCategories.length * 80 + 420).duration(350)}>
        <Card onPress={() => router.push({ pathname: '/property/edit', params: { id: property.id } })}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <View style={[s.itemIcon, { backgroundColor: theme.colors.surfaceAlt }]}>
              <Ionicons name="home-outline" size={18} color={theme.colors.textSecondary} />
            </View>
            <View style={{ flex: 1, gap: 1 }}>
              <Text variant="body">Property details</Text>
              <Text variant="caption" color="textSecondary" numberOfLines={1}>
                {[
                  property.property_type?.replace(/_/g, ' '),
                  property.bedrooms ? `${property.bedrooms} bed` : null,
                  property.year_built ? `Built ${property.year_built}` : null,
                  property.epc_rating ? `EPC ${property.epc_rating}` : null,
                ].filter(Boolean).join(' · ') || 'Tap to add details'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={theme.colors.textTertiary} />
          </View>
        </Card>
      </Animated.View>
    </ScrollView>
  );
}

/* ── Compact section (insurance/vehicles) ─────────────────────────── */

function CompactSection({ icon, title, count, emptyText, onAdd, children }: {
  icon: string; title: string; count: number; emptyText: string;
  onAdd: () => void; children: React.ReactNode;
}) {
  const theme = useTheme();

  if (count === 0) {
    return (
      <Pressable accessibilityRole="button" onPress={onAdd} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.xs }}>
          <Text style={{ fontSize: 16, lineHeight: 20 }}>{icon}</Text>
          <Text variant="body" color="textTertiary" style={{ flex: 1 }}>{emptyText}</Text>
          <Ionicons name="add-circle-outline" size={20} color={theme.colors.accent} />
        </View>
      </Pressable>
    );
  }

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
        <View style={[s.categoryBadge, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Text style={{ fontSize: 16, lineHeight: 20 }}>{icon}</Text>
        </View>
        <Text variant="headline" style={{ flex: 1 }}>{title}</Text>
        <Pressable accessibilityRole="button" onPress={onAdd} hitSlop={12}>
          <Ionicons name="add-circle-outline" size={20} color={theme.colors.accent} />
        </Pressable>
      </View>
      {children}
    </View>
  );
}

function CompactRow({ title, subtitle, badge }: { title: string; subtitle?: string; badge?: { label: string; tone: 'accent' | 'warning' | 'danger' } }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.xxs, paddingLeft: theme.spacing.xl }}>
      <View style={{ flex: 1, gap: 1 }}>
        <Text variant="body" numberOfLines={1}>{title}</Text>
        {subtitle ? <Text variant="caption" color="textSecondary" numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {badge ? <Badge label={badge.label} tone={badge.tone} /> : null}
    </View>
  );
}

/* ── Quick link buttons ───────────────────────────────────────────── */

function QuickLink({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({
      flex: 1, alignItems: 'center', gap: theme.spacing.xxs,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      opacity: pressed ? 0.7 : 1,
    })}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.accentMuted, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={18} color={theme.colors.accent} />
      </View>
      <Text variant="caption" color="textSecondary" numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

/* ── Summary pill ─────────────────────────────────────────────────── */

function SummaryPill({ icon, value, label }: { icon: string; value: string; label: string }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: theme.spacing.sm, gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={{ fontSize: 14, lineHeight: 18 }}>{icon}</Text>
        <Text variant="headline">{value}</Text>
      </View>
      <Text variant="caption" color="textTertiary">{label}</Text>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BY ROOM
   ═══════════════════════════════════════════════════════════════════ */

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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs }}>
          <Text variant="headline">{(rooms?.length ?? 0)} room{(rooms?.length ?? 0) === 1 ? '' : 's'}</Text>
          <Button label="Add room" variant="ghost" fullWidth={false} onPress={() => router.push({ pathname: '/room/new', params: { propertyId: property.id } })} />
        </View>
      }
      ListEmptyComponent={
        <EmptyState icon="🚪" title="No rooms yet" description="Rooms are optional — browse everything by category in the 'Everything' tab." actionLabel="Add a room" onAction={() => router.push({ pathname: '/room/new', params: { propertyId: property.id } })} />
      }
      renderItem={({ item, index }) => (
        <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
          <Card onPress={() => router.push(`/room/${item.id}`)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.accentMuted, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={roomIcon(item.room_type)} size={20} color={theme.colors.accent} />
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <Text variant="body">{item.name}</Text>
                {item.room_type || item.floor ? (
                  <Text variant="caption" color="textSecondary">
                    {[item.room_type, item.floor ? `${item.floor} floor` : null].filter(Boolean).join(' · ')}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={14} color={theme.colors.textTertiary} />
            </View>
          </Card>
        </Animated.View>
      )}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DOCUMENTS
   ═══════════════════════════════════════════════════════════════════ */

function DocumentsView() {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const { data: documents, isLoading, refetch, isRefetching } = useAllDocuments(search);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingBottom: theme.spacing.sm }}>
        <TextField placeholder="Search documents…" value={search} onChangeText={setSearch} autoCapitalize="none" />
      </View>
      {isLoading ? <ActivityIndicator /> : (
        <FlatList
          data={documents ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={theme.colors.accent} />}
          ListEmptyComponent={
            <EmptyState icon="📄" title={search ? 'No matches' : 'No documents yet'} description={search ? 'Try a different search.' : 'Tap + to scan or upload a document.'} />
          }
          renderItem={({ item, index }: { item: DocumentRow; index: number }) => (
            <Animated.View entering={FadeInDown.delay(index * 30).duration(250)}>
              <Card onPress={() => router.push(`/document/${item.id}`)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                  <View style={[s.itemIcon, { backgroundColor: theme.colors.surfaceAlt }]}>
                    <Ionicons name={docIcon(item.document_type)} size={16} color={theme.colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text variant="body" numberOfLines={1}>{item.product_description || item.document_type.replace(/_/g, ' ')}</Text>
                    <Text variant="caption" color="textSecondary" numberOfLines={1}>
                      {[item.supplier, item.document_date].filter(Boolean).join(' · ') || ''}
                    </Text>
                  </View>
                  {item.extraction_status === 'failed' ? <Badge label="Needs info" tone="warning" /> : null}
                  {item.extraction_status === 'pending' || item.extraction_status === 'processing' ? <Badge label="Reading…" tone="neutral" /> : null}
                  <Ionicons name="chevron-forward" size={14} color={theme.colors.textTertiary} />
                </View>
              </Card>
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */

function groupAssetsByCategory(assets: AssetRow[]): Record<string, AssetRow[]> {
  const g: Record<string, AssetRow[]> = {};
  for (const a of assets) { if (a.status !== 'active') continue; (g[a.category] ??= []).push(a); }
  return g;
}

function categoryLabel(c: string): string {
  return ({ heating: 'Heating & hot water', security: 'Safety & security', appliance: 'Appliances', electrical: 'Electrics & technology', plumbing: 'Plumbing', structural: 'Structure & exterior', furniture: 'Furniture', garden: 'Garden & outdoor', other: 'Other' } as Record<string, string>)[c] ?? c;
}

function categoryIcon(c: string): string {
  return ({ heating: '🔥', security: '🛡️', appliance: '📦', electrical: '⚡', plumbing: '🚿', structural: '🏗️', furniture: '🛋️', garden: '🌳', other: '📦' } as Record<string, string>)[c] ?? '📦';
}

function roomIcon(t: string | null): keyof typeof Ionicons.glyphMap {
  switch (t?.toLowerCase()) {
    case 'kitchen': return 'restaurant-outline'; case 'bathroom': return 'water-outline';
    case 'bedroom': return 'bed-outline'; case 'living room': return 'tv-outline';
    case 'garden': return 'leaf-outline'; case 'garage': return 'car-outline';
    case 'hallway': return 'enter-outline'; case 'loft': return 'arrow-up-outline';
    case 'exterior': return 'sunny-outline'; case 'office': return 'desktop-outline';
    case 'utility room': return 'water-outline'; case 'dining room': return 'wine-outline';
    default: return 'cube-outline';
  }
}

function docIcon(t: string): keyof typeof Ionicons.glyphMap {
  return ({ receipt: 'receipt-outline', manual: 'book-outline', warranty: 'shield-checkmark-outline', certificate: 'ribbon-outline', invoice: 'document-text-outline', insurance_policy: 'umbrella-outline', epc: 'leaf-outline', gas_safety_record: 'flame-outline', mortgage_document: 'home-outline' } as Record<string, keyof typeof Ionicons.glyphMap>)[t] ?? 'document-outline';
}

const s = StyleSheet.create({
  summaryBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  divider: { width: StyleSheet.hairlineWidth, height: 28 },
  categoryBadge: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  itemIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emptyHero: { alignItems: 'center', gap: 12, paddingVertical: 40, paddingHorizontal: 24 },
  addChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, marginTop: 8 },
});
