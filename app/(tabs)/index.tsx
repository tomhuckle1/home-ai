import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ListRow,
  ProgressRing,
  QuickAction,
  Screen,
  SectionHeader,
  SkeletonList,
  StatCard,
  Text,
  Thumbnail,
  useTheme,
} from '@/src/design-system';
import { useHomeHealthScore } from '@/src/hooks/useHealthScore';
import { useCompleteMaintenanceTask, useUpcomingMaintenance } from '@/src/hooks/useMaintenance';
import { useProfile } from '@/src/hooks/useProfile';
import { useProperties } from '@/src/hooks/useProperties';
import { useSpendingSummary } from '@/src/hooks/useSpending';
import { useWarrantyAlerts } from '@/src/hooks/useWarrantyAlerts';
import { registerForPushNotificationsIfNeeded } from '@/src/lib/pushNotifications';
import type { PropertyRow } from '@/src/types/database';

export default function HomeScreen() {
  const theme = useTheme();
  const { data: profile } = useProfile();
  const { data: properties, isLoading, refetch, isRefetching } = useProperties();
  const firstProperty = properties?.[0];

  const firstName = profile?.full_name?.split(' ')[0];

  useEffect(() => {
    if (profile && !profile.onboarded_at && properties && properties.length === 0) {
      router.replace('/onboarding');
    }
  }, [profile, properties]);

  const handleRefresh = useCallback(() => { refetch(); }, [refetch]);

  return (
    <Screen edges={['top']}>
      {/* Header */}
      <View style={{ paddingTop: theme.spacing.md, paddingBottom: theme.spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text variant="largeTitle">{firstName ? `Hi ${firstName}` : 'Home'}</Text>
          {firstProperty ? (
            <Text variant="footnote" color="textSecondary" style={{ marginTop: 2 }}>
              {[firstProperty.address_line1, firstProperty.city].filter(Boolean).join(', ')}
            </Text>
          ) : null}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Search" onPress={() => router.push('/search')}>
          <Ionicons name="search" size={22} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : (
        <FlatList
          data={properties ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={theme.colors.accent} />}
          ListHeaderComponent={firstProperty ? <HomeHeader property={firstProperty} properties={properties!} /> : null}
          ListEmptyComponent={
            <EmptyState
              icon="🏠"
              title="No properties yet"
              description="Add your property to start building its record — rooms, appliances, receipts and warranties, all in one place."
              actionLabel="Add your property"
              onAction={() => router.push('/property/new')}
            />
          }
          renderItem={({ item }: { item: PropertyRow }) => <PropertyCard property={item} />}
        />
      )}
    </Screen>
  );
}

function HomeHeader({ property, properties }: { property: PropertyRow; properties: PropertyRow[] }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.md, marginBottom: theme.spacing.sm }}>
      {/* Quick actions */}
      <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
        <QuickAction icon="scan" label="Scan" onPress={() => router.push({ pathname: '/capture/scan', params: { propertyId: property.id, mode: 'document' } })} />
        <QuickAction icon="add-circle-outline" label="Add room" onPress={() => router.push({ pathname: '/room/new', params: { propertyId: property.id } })} />
        <QuickAction icon="chatbubble-outline" label="Ask AI" onPress={() => router.push('/(tabs)/ask-ai')} />
        <QuickAction icon="search-outline" label="Search" onPress={() => router.push('/search')} />
      </View>

      <HealthScoreCard propertyId={property.id} />
      <WarrantyAlertsCard propertyId={property.id} />
      <SpendingSummaryCard propertyId={property.id} />
      <UpcomingMaintenance propertyId={property.id} />

      {properties.length > 1 ? (
        <SectionHeader title="Properties" actionLabel="Add" onAction={() => router.push('/property/new')} />
      ) : null}
    </View>
  );
}

/* ── Property card ────────────────────────────────────────────────── */

function PropertyCard({ property }: { property: PropertyRow }) {
  const theme = useTheme();
  return (
    <Card onPress={() => router.push(`/property/${property.id}`)}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        {property.cover_photo_path ? (
          <Thumbnail bucket="property-photos" path={property.cover_photo_path} size={52} />
        ) : (
          <View style={{ width: 52, height: 52, borderRadius: theme.radius.md, backgroundColor: theme.colors.accentMuted, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 24, lineHeight: 28 }}>🏠</Text>
          </View>
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="headline" numberOfLines={1}>{property.address_line1}</Text>
          {property.city || property.postcode ? (
            <Text variant="footnote" color="textSecondary" numberOfLines={1}>{[property.city, property.postcode].filter(Boolean).join(', ')}</Text>
          ) : null}
        </View>
        <Text variant="body" color="textTertiary">›</Text>
      </View>
    </Card>
  );
}

/* ── Health score ─────────────────────────────────────────────────── */

type ScoreTone = 'accent' | 'warning' | 'danger';

function scoreTone(score: number): ScoreTone {
  if (score >= 80) return 'accent';
  if (score >= 50) return 'warning';
  return 'danger';
}

function HealthScoreCard({ propertyId }: { propertyId: string }) {
  const theme = useTheme();
  const { data, isLoading, error } = useHomeHealthScore(propertyId);

  if (error) {
    return (
      <Card onPress={() => router.push('/subscription/paywall')}>
        <ListRow leading={<Text style={{ fontSize: 20 }}>🩺</Text>} title="Home Health Score" subtitle="Upgrade to Premium" trailing={<Badge label="Premium" tone="accent" />} showChevron />
      </Card>
    );
  }
  if (isLoading || !data) return null;

  const tone = scoreTone(data.score);
  const breakdown = data.breakdown as Record<string, number>;

  return (
    <Card onPress={() => router.push(`/property/${propertyId}`)}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <ProgressRing value={data.score} tone={tone} size={64} label={String(data.score)} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="headline">Home Health</Text>
          <Text variant="footnote" color="textSecondary">
            {breakdown.overdue_maintenance > 0
              ? `${breakdown.overdue_maintenance} overdue item${breakdown.overdue_maintenance === 1 ? '' : 's'}`
              : 'Everything looks up to date'}
          </Text>
        </View>
      </View>
    </Card>
  );
}

/* ── Warranty alerts ──────────────────────────────────────────────── */

function WarrantyAlertsCard({ propertyId }: { propertyId: string }) {
  const theme = useTheme();
  const { data: alerts } = useWarrantyAlerts(propertyId);

  if (!alerts || alerts.length === 0) return null;

  const expired = alerts.filter((a) => a.status === 'expired').length;
  const expiringSoon = alerts.filter((a) => a.status === 'expiring_soon').length;

  return (
    <Card>
      <SectionHeader title="Warranty alerts" />
      {alerts.slice(0, 3).map((alert) => (
        <ListRow
          key={alert.asset.id}
          leading={<Text style={{ fontSize: 18 }}>🛡️</Text>}
          title={alert.asset.name}
          subtitle={
            alert.daysUntilExpiry < 0
              ? `Expired ${Math.abs(alert.daysUntilExpiry)} days ago`
              : `Expires in ${alert.daysUntilExpiry} days`
          }
          trailing={<Badge label={alert.status === 'expired' ? 'Expired' : 'Soon'} tone={alert.status === 'expired' ? 'danger' : 'warning'} />}
          onPress={() => router.push(`/asset/${alert.asset.id}`)}
          showChevron
        />
      ))}
      {alerts.length > 3 ? (
        <Text variant="footnote" color="textSecondary" style={{ marginTop: theme.spacing.xxs }}>
          +{alerts.length - 3} more
        </Text>
      ) : null}
    </Card>
  );
}

/* ── Spending summary ─────────────────────────────────────────────── */

function SpendingSummaryCard({ propertyId }: { propertyId: string }) {
  const theme = useTheme();
  const { data } = useSpendingSummary(propertyId);

  if (!data || data.totalSpent === 0) return null;

  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
      <StatCard icon="💷" label="Total spent" value={`£${Math.round(data.totalSpent).toLocaleString()}`} />
      <StatCard icon="📅" label="This year" value={`£${Math.round(data.thisYear).toLocaleString()}`} />
    </View>
  );
}

/* ── Upcoming maintenance ─────────────────────────────────────────── */

function UpcomingMaintenance({ propertyId }: { propertyId: string }) {
  const theme = useTheme();
  const { data: tasks, isLoading } = useUpcomingMaintenance(propertyId);
  const completeTask = useCompleteMaintenanceTask();

  const dueSoon = (tasks ?? []).filter((t) => {
    const daysUntilDue = (new Date(t.next_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilDue < 30;
  });
  const hasDueSoon = dueSoon.length > 0;

  useEffect(() => {
    if (hasDueSoon) registerForPushNotificationsIfNeeded();
  }, [hasDueSoon]);

  if (isLoading || dueSoon.length === 0) return null;

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <SectionHeader
        title="Maintenance"
        actionLabel="Add"
        onAction={() => router.push({ pathname: '/maintenance/new', params: { propertyId } })}
      />
      {dueSoon.map((task) => {
        const overdue = new Date(task.next_due_date) < new Date();
        return (
          <Card key={task.id}>
            <ListRow title={task.title} subtitle={`Due ${task.next_due_date}`} trailing={overdue ? <Badge label="Overdue" tone="danger" /> : undefined} />
            <Button
              label="Mark done"
              variant="secondary"
              onPress={() => completeTask.mutate({ taskId: task.id, propertyId }, { onError: (err) => Alert.alert('Error', err instanceof Error ? err.message : 'Please try again.') })}
              loading={completeTask.isPending}
            />
          </Card>
        );
      })}
    </View>
  );
}
