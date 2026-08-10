import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Badge, Button, Card, ListRow, ProgressRing, Screen, SectionHeader, SkeletonList, StatCard, Text, useTheme } from '@/src/design-system';
import { useAssetsByProperty } from '@/src/hooks/useAssets';
import { useHomeHealthScore } from '@/src/hooks/useHealthScore';
import { useCompleteMaintenanceTask, useUpcomingMaintenance } from '@/src/hooks/useMaintenance';
import { useProfile, useHousehold } from '@/src/hooks/useProfile';
import { useProperties } from '@/src/hooks/useProperties';
import { useRooms } from '@/src/hooks/useRooms';
import { useSpendingSummary } from '@/src/hooks/useSpending';
import { useInsurancePolicies } from '@/src/hooks/useVehiclesAndInsurance';
import { useWarrantyAlerts } from '@/src/hooks/useWarrantyAlerts';
import { useSmartNudges } from '@/src/hooks/useSmartNudges';
import { registerForPushNotificationsIfNeeded } from '@/src/lib/pushNotifications';
import { useDocumentsByProperty } from '@/src/hooks/useDocuments';

export default function HomeScreen() {
  const theme = useTheme();
  const { data: profile } = useProfile();
  const { data: household } = useHousehold();
  const { data: properties, isLoading, refetch, isRefetching } = useProperties();
  const firstProperty = properties?.[0];
  const firstName = profile?.full_name?.split(' ')[0];
  const isPremium = (household?.subscription?.entitlement ?? 'free') !== 'free';
  const scrollRef = useRef<ScrollView>(null);
  const maintenanceY = useRef(0);

  useEffect(() => {
    if (profile && !profile.onboarded_at && properties && properties.length === 0) router.replace('/onboarding');
  }, [profile, properties]);

  const handleRefresh = useCallback(() => { refetch(); }, [refetch]);

  if (isLoading) return (<Screen edges={['top']}><View style={{ paddingVertical: theme.spacing.md }}><Text variant="largeTitle">Home</Text></View><SkeletonList count={3} /></Screen>);

  if (!firstProperty) {
    return (
      <Screen edges={['top']} style={{ justifyContent: 'center', gap: theme.spacing.lg, paddingHorizontal: theme.spacing.lg }}>
        <View style={{ alignItems: 'center', gap: theme.spacing.md }}>
          <Image source={require('@/assets/images/logo.png')} style={{ width: 100, height: 100 }} resizeMode="contain" />
          <Text variant="title1" style={{ textAlign: 'center' }}>Welcome to HomeAI</Text>
          <Text variant="body" color="textSecondary" style={{ textAlign: 'center', lineHeight: 22, maxWidth: 300 }}>Manage. Protect. Remind.{'\n'}Start by adding your property.</Text>
        </View>
        <Button label="Add your property" size="lg" onPress={() => router.push('/property/new')} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: theme.spacing.xxl, gap: theme.spacing.md }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={theme.colors.accent} />}>
        {/* Header */}
        <View style={{ paddingTop: theme.spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <Image source={require('@/assets/images/logo.png')} style={{ width: 44, height: 44, borderRadius: 10 }} resizeMode="contain" />
            <View>
              <Text variant="largeTitle">{firstName ? `Hi ${firstName}` : 'Home'}</Text>
              <Text variant="footnote" color="textSecondary" style={{ marginTop: 1 }}>{firstProperty.address_line1}</Text>
            </View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Search" onPress={() => router.push('/search')}>
            <Ionicons name="search" size={22} color={theme.colors.textSecondary} />
          </Pressable>
        </View>

        {/* Quick stats */}
        <QuickStats propertyId={firstProperty.id} onRemindersPress={() => scrollRef.current?.scrollTo({ y: maintenanceY.current, animated: true })} />

        <GettingStarted propertyId={firstProperty.id} />
        <SmartNudges propertyId={firstProperty.id} isPremium={isPremium} />
        <HealthScoreCard propertyId={firstProperty.id} />
        <SpendingSummary propertyId={firstProperty.id} />
        <WarrantyAlerts propertyId={firstProperty.id} />

        {/* Maintenance — measure position for scroll-to */}
        <View onLayout={(e) => { maintenanceY.current = e.nativeEvent.layout.y; }}>
          <MaintenanceDue propertyId={firstProperty.id} />
        </View>

        {!isPremium ? <PremiumPrompt /> : null}
      </ScrollView>
    </Screen>
  );
}

/* ── Quick stats ──────────────────────────────────────────────────── */

function QuickStats({ propertyId, onRemindersPress }: { propertyId: string; onRemindersPress: () => void }) {
  const theme = useTheme();
  const { data: assets } = useAssetsByProperty(propertyId);
  const { data: docs } = useDocumentsByProperty(propertyId);
  const { data: tasks } = useUpcomingMaintenance(propertyId);
  const itemCount = assets?.length ?? 0;
  const docCount = docs?.length ?? 0;
  const reminderCount = (tasks ?? []).filter((t) => t.is_active).length;

  if (itemCount === 0 && docCount === 0) return null;

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
      <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/my-home')} style={({ pressed }) => ({ flex: 1, backgroundColor: theme.colors.accentMuted, borderRadius: theme.radius.md, padding: theme.spacing.sm, alignItems: 'center', opacity: pressed ? 0.7 : 1 })}>
        <Text variant="title2">{itemCount}</Text>
        <Text variant="caption" color="textSecondary">items</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/my-home')} style={({ pressed }) => ({ flex: 1, backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, padding: theme.spacing.sm, alignItems: 'center', opacity: pressed ? 0.7 : 1 })}>
        <Text variant="title2">{docCount}</Text>
        <Text variant="caption" color="textSecondary">docs</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onRemindersPress} style={({ pressed }) => ({ flex: 1, backgroundColor: reminderCount > 0 ? theme.colors.warningMuted : theme.colors.surfaceAlt, borderRadius: theme.radius.md, padding: theme.spacing.sm, alignItems: 'center', opacity: pressed ? 0.7 : 1 })}>
        <Text variant="title2">{reminderCount}</Text>
        <Text variant="caption" color="textSecondary">reminders</Text>
      </Pressable>
    </Animated.View>
  );
}

/* ── Getting started ──────────────────────────────────────────────── */

function GettingStarted({ propertyId }: { propertyId: string }) {
  const theme = useTheme();
  const { data: rooms } = useRooms(propertyId);
  const { data: assets } = useAssetsByProperty(propertyId);
  const { data: insurance } = useInsurancePolicies(propertyId);
  const [dismissed, setDismissed] = useState(false);
  const hasRooms = (rooms?.length ?? 0) > 0;
  const hasItems = (assets?.length ?? 0) > 0;
  const hasInsurance = (insurance?.length ?? 0) > 0;
  const completedCount = [hasRooms, hasItems, hasInsurance].filter(Boolean).length;

  useEffect(() => {
    AsyncStorage.getItem('getting-started-dismissed').then((v) => { if (v === 'true') setDismissed(true); });
  }, []);

  if (completedCount >= 3 || dismissed) return null;

  const steps = [
    { done: hasItems, icon: '📦', title: 'Record your first item', subtitle: 'Boiler, fire alarm, or appliance', action: () => router.push('/add') },
    { done: hasRooms, icon: '🚪', title: 'Name your rooms', subtitle: 'Kitchen, bathroom, bedroom', action: () => router.push({ pathname: '/room/new', params: { propertyId } }) },
    { done: hasInsurance, icon: '🔑', title: 'Add your insurance', subtitle: 'Never miss a renewal', action: () => router.push({ pathname: '/add/insurance', params: { propertyId } }) },
  ];

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(400)}>
      <Card>
        <View style={{ gap: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="headline" style={{ flex: 1 }}>Getting started</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={() => { setDismissed(true); AsyncStorage.setItem('getting-started-dismissed', 'true'); }} hitSlop={12}>
              <Ionicons name="close" size={18} color={theme.colors.textTertiary} />
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {[0, 1, 2].map((i) => <View key={i} style={{ width: i < completedCount ? 24 : 8, height: 6, borderRadius: 3, backgroundColor: i < completedCount ? theme.colors.accent : theme.colors.border }} />)}
            </View>
          </View>
          {steps.filter((s) => !s.done).slice(0, 2).map((step) => (
            <Pressable key={step.title} accessibilityRole="button" onPress={step.action} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, opacity: pressed ? 0.7 : 1 })}>
              <Text style={{ fontSize: 22 }}>{step.icon}</Text>
              <View style={{ flex: 1 }}><Text variant="body">{step.title}</Text><Text variant="caption" color="textSecondary">{step.subtitle}</Text></View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
            </Pressable>
          ))}
        </View>
      </Card>
    </Animated.View>
  );
}

/* ── Premium prompt ───────────────────────────────────────────────── */

function PremiumPrompt() {
  const theme = useTheme();
  return (
    <Animated.View entering={FadeInDown.delay(200).duration(400)}>
      <Pressable accessibilityRole="button" onPress={() => router.push('/subscription/paywall')} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
        <View style={{ backgroundColor: theme.colors.accentMuted, borderRadius: theme.radius.lg, padding: theme.spacing.md, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="sparkles" size={22} color={theme.colors.onAccent} />
          </View>
          <View style={{ flex: 1 }}><Text variant="headline">Upgrade to Premium</Text><Text variant="caption" color="textSecondary">Unlimited items, smart alerts, family sharing — from £2.92/mo</Text></View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.accent} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ── Smart nudges ─────────────────────────────────────────────────── */

function SmartNudges({ propertyId, isPremium }: { propertyId: string; isPremium: boolean }) {
  const theme = useTheme();
  const { data: nudges } = useSmartNudges(propertyId);
  if (!nudges || nudges.length === 0) return null;

  const toneColors = { warning: theme.colors.warningMuted, info: theme.colors.accentMuted, tip: theme.colors.surfaceAlt };
  const visibleNudges = isPremium ? nudges.slice(0, 5) : nudges.slice(0, 2);
  const hiddenCount = isPremium ? 0 : Math.max(0, nudges.length - 2);

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <SectionHeader title="For your attention" />
      {visibleNudges.map((nudge, i) => (
        <Animated.View key={nudge.id} entering={FadeInDown.delay(i * 60).duration(300)}>
          <Pressable accessibilityRole="button" onPress={nudge.action ? () => router.push(nudge.action!.route as any) : undefined}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, backgroundColor: toneColors[nudge.tone], borderRadius: theme.radius.lg, padding: theme.spacing.sm, opacity: pressed && nudge.action ? 0.7 : 1 })}>
            <Text style={{ fontSize: 20, lineHeight: 24 }}>{nudge.icon}</Text>
            <View style={{ flex: 1, gap: 1 }}><Text variant="body" numberOfLines={1}>{nudge.title}</Text><Text variant="caption" color="textSecondary" numberOfLines={1}>{nudge.description}</Text></View>
            {nudge.action ? <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} /> : null}
          </Pressable>
        </Animated.View>
      ))}
      {hiddenCount > 0 ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/subscription/paywall')} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, backgroundColor: theme.colors.accentMuted, borderRadius: theme.radius.lg, padding: theme.spacing.sm, opacity: pressed ? 0.7 : 1 })}>
          <Ionicons name="lock-closed" size={18} color={theme.colors.accent} />
          <Text variant="body" color="accent">{hiddenCount} more alert{hiddenCount === 1 ? '' : 's'} — upgrade to see all</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ── Health score ─────────────────────────────────────────────────── */

function HealthScoreCard({ propertyId }: { propertyId: string }) {
  const theme = useTheme();
  const { data, isLoading, error } = useHomeHealthScore(propertyId);
  if (error) return (<Card onPress={() => router.push('/subscription/paywall')}><ListRow leading={<Text style={{ fontSize: 20 }}>🩺</Text>} title="Home Health Score" subtitle="Upgrade to see your score" trailing={<Badge label="Premium" tone="accent" />} showChevron /></Card>);
  if (isLoading || !data) return null;
  const tone = data.score >= 80 ? 'accent' as const : data.score >= 50 ? 'warning' as const : 'danger' as const;
  const breakdown = data.breakdown as Record<string, number>;
  return (
    <Animated.View entering={FadeInDown.delay(150).duration(400)}>
      <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <ProgressRing value={data.score} tone={tone} size={64} label={String(data.score)} />
        <View style={{ flex: 1, gap: 2 }}><Text variant="headline">Home Health</Text><Text variant="footnote" color="textSecondary">{breakdown.overdue_maintenance > 0 ? `${breakdown.overdue_maintenance} overdue item${breakdown.overdue_maintenance === 1 ? '' : 's'}` : 'Everything looks up to date'}</Text></View>
      </View></Card>
    </Animated.View>
  );
}

function SpendingSummary({ propertyId }: { propertyId: string }) {
  const theme = useTheme();
  const { data } = useSpendingSummary(propertyId);
  if (!data || data.totalSpent === 0) return null;
  return (
    <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
      <StatCard icon="💷" label="Total spent" value={`£${Math.round(data.totalSpent).toLocaleString()}`} />
      <StatCard icon="📅" label="This year" value={`£${Math.round(data.thisYear).toLocaleString()}`} />
    </Animated.View>
  );
}

function WarrantyAlerts({ propertyId }: { propertyId: string }) {
  const theme = useTheme();
  const { data: alerts } = useWarrantyAlerts(propertyId);
  if (!alerts || alerts.length === 0) return null;
  return (
    <View style={{ gap: theme.spacing.xs }}>
      <SectionHeader title="Warranty alerts" />
      {alerts.slice(0, 4).map((alert, i) => (
        <Animated.View key={alert.asset.id} entering={FadeInDown.delay(i * 50).duration(300)}>
          <Card onPress={() => router.push(`/asset/${alert.asset.id}`)}>
            <ListRow leading={<Text style={{ fontSize: 18 }}>🛡️</Text>} title={alert.asset.name}
              subtitle={alert.daysUntilExpiry < 0 ? `Expired ${Math.abs(alert.daysUntilExpiry)} days ago` : `Expires in ${alert.daysUntilExpiry} days`}
              trailing={<Badge label={alert.status === 'expired' ? 'Expired' : 'Soon'} tone={alert.status === 'expired' ? 'danger' : 'warning'} />} showChevron />
          </Card>
        </Animated.View>
      ))}
    </View>
  );
}

function MaintenanceDue({ propertyId }: { propertyId: string }) {
  const theme = useTheme();
  const { data: tasks } = useUpcomingMaintenance(propertyId);
  const completeTask = useCompleteMaintenanceTask();
  const dueSoon = (tasks ?? []).filter((t) => (new Date(t.next_due_date).getTime() - Date.now()) / 86400000 < 30);

  useEffect(() => { if (dueSoon.length > 0) registerForPushNotificationsIfNeeded(); }, [dueSoon.length]);
  if (dueSoon.length === 0) return null;

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <SectionHeader title="Maintenance due" actionLabel="Add" onAction={() => router.push({ pathname: '/maintenance/new', params: { propertyId } })} />
      {dueSoon.map((task, i) => {
        const overdue = new Date(task.next_due_date) < new Date();
        return (
          <Animated.View key={task.id} entering={FadeInDown.delay(i * 50).duration(300)}>
            <Card onPress={task.asset_id ? () => router.push(`/asset/${task.asset_id}`) : undefined}>
              <ListRow
                leading={<Ionicons name="alarm-outline" size={20} color={overdue ? theme.colors.danger : theme.colors.textSecondary} />}
                title={task.title}
                subtitle={`Due ${task.next_due_date}`}
                trailing={overdue ? <Badge label="Overdue" tone="danger" /> : undefined}
              />
              <Button label="Mark done" variant="secondary" onPress={() => completeTask.mutate({ taskId: task.id, propertyId }, { onError: (err) => Alert.alert('Error', err instanceof Error ? err.message : 'Try again.') })} loading={completeTask.isPending} />
            </Card>
          </Animated.View>
        );
      })}
    </View>
  );
}
