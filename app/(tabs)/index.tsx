import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { Badge, Button, Card, ListRow, ProgressRing, Screen, SectionHeader, SkeletonList, StatCard, Text, useTheme } from '@/src/design-system';
import { useAssetsByProperty } from '@/src/hooks/useAssets';
import { useHomeHealthScore } from '@/src/hooks/useHealthScore';
import { useCompleteMaintenanceTask, useUpcomingMaintenance } from '@/src/hooks/useMaintenance';
import { useProfile } from '@/src/hooks/useProfile';
import { useProperties } from '@/src/hooks/useProperties';
import { useRooms } from '@/src/hooks/useRooms';
import { useSpendingSummary } from '@/src/hooks/useSpending';
import { useInsurancePolicies, useVehicles } from '@/src/hooks/useVehiclesAndInsurance';
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

  if (isLoading) return (<Screen edges={['top']}><View style={{ paddingVertical: theme.spacing.md }}><Text variant="largeTitle">Home</Text></View><SkeletonList count={3} /></Screen>);

  if (!firstProperty) {
    return (
      <Screen edges={['top']} style={{ justifyContent: 'center', gap: theme.spacing.lg, paddingHorizontal: theme.spacing.lg }}>
        <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.accentMuted, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 40, lineHeight: 48 }}>🏠</Text>
          </View>
          <Text variant="title1" style={{ textAlign: 'center' }}>Welcome to Home Memory</Text>
          <Text variant="body" color="textSecondary" style={{ textAlign: 'center', lineHeight: 22, maxWidth: 300 }}>
            Start by adding your property, then build up its record — rooms, appliances, insurance, and more.
          </Text>
        </View>
        <Button label="Add your property" size="lg" onPress={() => router.push('/property/new')} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xxl, gap: theme.spacing.md }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={theme.colors.accent} />}>
        <View style={{ paddingTop: theme.spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text variant="largeTitle">{firstName ? `Hi ${firstName}` : 'Home'}</Text>
            <Text variant="footnote" color="textSecondary" style={{ marginTop: 2 }}>{[firstProperty.address_line1, firstProperty.city].filter(Boolean).join(', ')}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Search" onPress={() => router.push('/search')}>
            <Ionicons name="search" size={22} color={theme.colors.textSecondary} />
          </Pressable>
        </View>

        {/* Getting started checklist */}
        <GettingStarted propertyId={firstProperty.id} />

        {/* Health score */}
        <HealthScoreCard propertyId={firstProperty.id} />

        {/* Spending */}
        <SpendingSummary propertyId={firstProperty.id} />

        {/* Warranty alerts */}
        <WarrantyAlerts propertyId={firstProperty.id} />

        {/* Maintenance */}
        <MaintenanceDue propertyId={firstProperty.id} />
      </ScrollView>
    </Screen>
  );
}

/* ── Getting started checklist ─────────────────────────────────────── */

function GettingStarted({ propertyId }: { propertyId: string }) {
  const theme = useTheme();
  const { data: rooms } = useRooms(propertyId);
  const { data: assets } = useAssetsByProperty(propertyId);
  const { data: insurance } = useInsurancePolicies(propertyId);
  const { data: vehicles } = useVehicles(propertyId);

  const hasRooms = (rooms?.length ?? 0) > 0;
  const hasItems = (assets?.length ?? 0) > 0;
  const hasInsurance = (insurance?.length ?? 0) > 0;
  const hasVehicles = (vehicles?.length ?? 0) > 0;
  const completedCount = [hasRooms, hasItems, hasInsurance].filter(Boolean).length;
  const allDone = completedCount >= 3;

  if (allDone) return null;

  const steps = [
    { done: hasRooms, icon: '🚪', title: 'Add your first room', subtitle: 'Kitchen, bathroom, bedroom', action: () => router.push({ pathname: '/room/new', params: { propertyId } }) },
    { done: hasItems, icon: '📦', title: 'Record something', subtitle: 'Boiler, fire alarm, or an appliance', action: () => router.push('/add') },
    { done: hasInsurance, icon: '🔑', title: 'Add your insurance', subtitle: 'Never miss a renewal', action: () => router.push({ pathname: '/add/insurance', params: { propertyId } }) },
    { done: hasVehicles, icon: '🚗', title: 'Add your vehicle', subtitle: 'Track MOT, tax, and service', action: () => router.push({ pathname: '/add/vehicle', params: { propertyId } }) },
  ];

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="headline">Getting started</Text>
        <Text variant="caption" color="textSecondary">{completedCount}/3 done</Text>
      </View>
      {steps.filter((s) => !s.done).slice(0, 3).map((step) => (
        <Card key={step.title} onPress={step.action}>
          <ListRow
            leading={<Text style={{ fontSize: 22, lineHeight: 26 }}>{step.icon}</Text>}
            title={step.title}
            subtitle={step.subtitle}
            showChevron
          />
        </Card>
      ))}
    </View>
  );
}

/* ── Health score ─────────────────────────────────────────────────── */

function HealthScoreCard({ propertyId }: { propertyId: string }) {
  const theme = useTheme();
  const { data, isLoading, error } = useHomeHealthScore(propertyId);

  if (error) return (
    <Card onPress={() => router.push('/subscription/paywall')}>
      <ListRow leading={<Text style={{ fontSize: 20 }}>🩺</Text>} title="Home Health Score" subtitle="Upgrade to Premium" trailing={<Badge label="Premium" tone="accent" />} showChevron />
    </Card>
  );
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
            {breakdown.overdue_maintenance > 0 ? `${breakdown.overdue_maintenance} overdue item${breakdown.overdue_maintenance === 1 ? '' : 's'}` : 'Everything looks up to date'}
          </Text>
        </View>
      </View>
    </Card>
  );
}

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

function WarrantyAlerts({ propertyId }: { propertyId: string }) {
  const theme = useTheme();
  const { data: alerts } = useWarrantyAlerts(propertyId);
  if (!alerts || alerts.length === 0) return null;
  return (
    <View style={{ gap: theme.spacing.xs }}>
      <SectionHeader title="Warranty alerts" />
      {alerts.slice(0, 4).map((alert) => (
        <Card key={alert.asset.id}>
          <ListRow leading={<Text style={{ fontSize: 18 }}>🛡️</Text>} title={alert.asset.name}
            subtitle={alert.daysUntilExpiry < 0 ? `Expired ${Math.abs(alert.daysUntilExpiry)} days ago` : `Expires in ${alert.daysUntilExpiry} days`}
            trailing={<Badge label={alert.status === 'expired' ? 'Expired' : 'Soon'} tone={alert.status === 'expired' ? 'danger' : 'warning'} />}
            onPress={() => router.push(`/asset/${alert.asset.id}`)} showChevron />
        </Card>
      ))}
    </View>
  );
}

function MaintenanceDue({ propertyId }: { propertyId: string }) {
  const theme = useTheme();
  const { data: tasks } = useUpcomingMaintenance(propertyId);
  const completeTask = useCompleteMaintenanceTask();
  const dueSoon = (tasks ?? []).filter((t) => (new Date(t.next_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24) < 30);

  useEffect(() => { if (dueSoon.length > 0) registerForPushNotificationsIfNeeded(); }, [dueSoon.length]);
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
