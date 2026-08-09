import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  ListRow,
  ProgressRing,
  Screen,
  SectionHeader,
  SkeletonList,
  StatCard,
  Text,
  useTheme,
} from '@/src/design-system';
import { useHomeHealthScore } from '@/src/hooks/useHealthScore';
import { useCompleteMaintenanceTask, useUpcomingMaintenance } from '@/src/hooks/useMaintenance';
import { useProfile } from '@/src/hooks/useProfile';
import { useProperties } from '@/src/hooks/useProperties';
import { useSpendingSummary } from '@/src/hooks/useSpending';
import { useWarrantyAlerts } from '@/src/hooks/useWarrantyAlerts';
import { registerForPushNotificationsIfNeeded } from '@/src/lib/pushNotifications';

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

  if (isLoading) {
    return (<Screen edges={['top']}><View style={{ paddingVertical: theme.spacing.md }}><Text variant="largeTitle">Home</Text></View><SkeletonList count={3} /></Screen>);
  }

  if (!firstProperty) {
    return (
      <Screen edges={['top']} style={{ justifyContent: 'center', gap: theme.spacing.lg, paddingHorizontal: theme.spacing.lg }}>
        <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
          <Text style={{ fontSize: 48 }}>🏠</Text>
          <Text variant="title1" style={{ textAlign: 'center' }}>Welcome to Home Memory</Text>
          <Text variant="body" color="textSecondary" style={{ textAlign: 'center', lineHeight: 22 }}>
            Add your property to start building its record — rooms, appliances, receipts and warranties, all in one place.
          </Text>
        </View>
        <Button label="Add your property" onPress={() => router.push('/property/new')} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: theme.spacing.xxl, gap: theme.spacing.md }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={theme.colors.accent} />}
      >
        {/* Header */}
        <View style={{ paddingTop: theme.spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text variant="largeTitle">{firstName ? `Hi ${firstName}` : 'Home'}</Text>
            <Text variant="footnote" color="textSecondary" style={{ marginTop: 2 }}>
              {[firstProperty.address_line1, firstProperty.city].filter(Boolean).join(', ')}
            </Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Search" onPress={() => router.push('/search')}>
            <Ionicons name="search" size={22} color={theme.colors.textSecondary} />
          </Pressable>
        </View>

        {/* Health score */}
        <HealthScoreCard propertyId={firstProperty.id} />

        {/* Spending summary */}
        <SpendingSummary propertyId={firstProperty.id} />

        {/* Warranty alerts */}
        <WarrantyAlerts propertyId={firstProperty.id} />

        {/* Maintenance due */}
        <MaintenanceDue propertyId={firstProperty.id} />
      </ScrollView>
    </Screen>
  );
}

/* ── Health score ─────────────────────────────────────────────────── */

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

  const tone = data.score >= 80 ? 'accent' as const : data.score >= 50 ? 'warning' as const : 'danger' as const;
  const breakdown = data.breakdown as Record<string, number>;

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <ProgressRing value={data.score} tone={tone} size={64} label={String(data.score)} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="headline">Home Health</Text>
          <Text variant="footnote" color="textSecondary">
            {breakdown.overdue_maintenance > 0
              ? `${breakdown.overdue_maintenance} overdue item${breakdown.overdue_maintenance === 1 ? '' : 's'}`
              : breakdown.expired_warranties > 0
                ? `${breakdown.expired_warranties} expired warrant${breakdown.expired_warranties === 1 ? 'y' : 'ies'}`
                : 'Everything looks up to date'}
          </Text>
        </View>
      </View>
    </Card>
  );
}

/* ── Spending ─────────────────────────────────────────────────────── */

function SpendingSummary({ propertyId }: { propertyId: string }) {
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

/* ── Warranty alerts ──────────────────────────────────────────────── */

function WarrantyAlerts({ propertyId }: { propertyId: string }) {
  const theme = useTheme();
  const { data: alerts } = useWarrantyAlerts(propertyId);
  if (!alerts || alerts.length === 0) return null;

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <SectionHeader title="Warranty alerts" />
      {alerts.slice(0, 4).map((alert) => (
        <Card key={alert.asset.id}>
          <ListRow
            leading={<Text style={{ fontSize: 18 }}>🛡️</Text>}
            title={alert.asset.name}
            subtitle={alert.daysUntilExpiry < 0 ? `Expired ${Math.abs(alert.daysUntilExpiry)} days ago` : `Expires in ${alert.daysUntilExpiry} days`}
            trailing={<Badge label={alert.status === 'expired' ? 'Expired' : 'Soon'} tone={alert.status === 'expired' ? 'danger' : 'warning'} />}
            onPress={() => router.push(`/asset/${alert.asset.id}`)}
            showChevron
          />
        </Card>
      ))}
    </View>
  );
}

/* ── Maintenance ──────────────────────────────────────────────────── */

function MaintenanceDue({ propertyId }: { propertyId: string }) {
  const theme = useTheme();
  const { data: tasks } = useUpcomingMaintenance(propertyId);
  const completeTask = useCompleteMaintenanceTask();

  const dueSoon = (tasks ?? []).filter((t) => {
    const daysUntilDue = (new Date(t.next_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilDue < 30;
  });

  useEffect(() => {
    if (dueSoon.length > 0) registerForPushNotificationsIfNeeded();
  }, [dueSoon.length]);

  if (dueSoon.length === 0) return null;

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <SectionHeader title="Maintenance due" actionLabel="Add" onAction={() => router.push({ pathname: '/maintenance/new', params: { propertyId } })} />
      {dueSoon.map((task) => {
        const overdue = new Date(task.next_due_date) < new Date();
        return (
          <Card key={task.id}>
            <ListRow title={task.title} subtitle={`Due ${task.next_due_date}`} trailing={overdue ? <Badge label="Overdue" tone="danger" /> : undefined} />
            <Button label="Mark done" variant="secondary" onPress={() => completeTask.mutate({ taskId: task.id, propertyId }, { onError: (err) => Alert.alert('Error', err instanceof Error ? err.message : 'Please try again.') })} loading={completeTask.isPending} />
          </Card>
        );
      })}
    </View>
  );
}
