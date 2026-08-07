import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, View } from 'react-native';

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
  Text,
  Thumbnail,
  useTheme,
  type ThemeColors,
} from '@/src/design-system';
import { useHomeHealthScore } from '@/src/hooks/useHealthScore';
import { useCompleteMaintenanceTask, useUpcomingMaintenance } from '@/src/hooks/useMaintenance';
import { useProfile } from '@/src/hooks/useProfile';
import { useProperties } from '@/src/hooks/useProperties';
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

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <Screen edges={['top']}>
      <View
        style={{
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.sm,
        }}
      >
        <Text variant="largeTitle">{firstName ? `Hi ${firstName}` : 'Home'}</Text>
        {firstProperty ? (
          <Text variant="body" color="textSecondary" style={{ marginTop: 2 }}>
            {[firstProperty.address_line1, firstProperty.city].filter(Boolean).join(', ')}
          </Text>
        ) : null}
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={properties ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor={theme.colors.accent}
            />
          }
          ListHeaderComponent={
            firstProperty ? (
              <View style={{ gap: theme.spacing.md, marginBottom: theme.spacing.sm }}>
                {/* Quick actions */}
                <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
                  <QuickAction
                    icon="scan"
                    label="Scan"
                    onPress={() =>
                      router.push({
                        pathname: '/capture/scan',
                        params: { propertyId: firstProperty.id, mode: 'document' },
                      })
                    }
                  />
                  <QuickAction
                    icon="add-circle-outline"
                    label="Add room"
                    onPress={() =>
                      router.push({ pathname: '/room/new', params: { propertyId: firstProperty.id } })
                    }
                  />
                  <QuickAction
                    icon="chatbubble-outline"
                    label="Ask AI"
                    onPress={() => router.push('/(tabs)/ask-ai')}
                  />
                  <QuickAction
                    icon="document-text-outline"
                    label="Passport"
                    onPress={() => router.push(`/passport/${firstProperty.id}`)}
                  />
                </View>

                <HealthScoreCard propertyId={firstProperty.id} />
                <UpcomingMaintenance propertyId={firstProperty.id} />

                {properties && properties.length > 1 ? (
                  <SectionHeader
                    title="Properties"
                    actionLabel="Add"
                    onAction={() => router.push('/property/new')}
                  />
                ) : null}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="🏠"
              title="No properties yet"
              description="Add your property to start building its record — rooms, appliances, receipts and warranties, all in one place."
              actionLabel="Add your property"
              onAction={() => router.push('/property/new')}
            />
          }
          renderItem={({ item }: { item: PropertyRow }) => (
            <PropertyCard property={item} />
          )}
        />
      )}
    </Screen>
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
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.accentMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 24, lineHeight: 28 }}>🏠</Text>
          </View>
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="headline" numberOfLines={1}>
            {property.address_line1}
          </Text>
          {property.city || property.postcode ? (
            <Text variant="footnote" color="textSecondary" numberOfLines={1}>
              {[property.city, property.postcode].filter(Boolean).join(', ')}
            </Text>
          ) : null}
        </View>
        <Text variant="body" color="textTertiary" style={{ marginLeft: theme.spacing.xs }}>
          ›
        </Text>
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
        <ListRow
          leading={<Text style={{ fontSize: 20 }}>🩺</Text>}
          title="Home Health Score"
          subtitle="See how well-documented and up to date your home is"
          trailing={<Badge label="Premium" tone="accent" />}
          showChevron
        />
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card>
        <View style={{ paddingVertical: theme.spacing.sm, alignItems: 'center' }}>
          <ActivityIndicator />
        </View>
      </Card>
    );
  }

  const tone = scoreTone(data.score);
  const breakdown = data.breakdown as Record<string, number>;
  const tip = healthScoreTip(breakdown);

  return (
    <Card onPress={() => router.push(`/property/${propertyId}`)}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <ProgressRing value={data.score} tone={tone} size={64} label={String(data.score)} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="headline">Home Health</Text>
          <Text variant="footnote" color="textSecondary">
            {breakdown.overdue_maintenance > 0
              ? `${breakdown.overdue_maintenance} overdue maintenance item${breakdown.overdue_maintenance === 1 ? '' : 's'}`
              : breakdown.expired_warranties > 0
                ? `${breakdown.expired_warranties} expired warrant${breakdown.expired_warranties === 1 ? 'y' : 'ies'}`
                : 'Everything looks up to date'}
          </Text>
          {tip ? (
            <Text variant="caption" color="accent" style={{ marginTop: 2 }}>
              {tip}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

function healthScoreTip(breakdown: Record<string, number>): string | null {
  if (breakdown.overdue_maintenance > 0) {
    return 'Mark overdue items done to bring your score up';
  }
  if (breakdown.expired_warranties > 0) {
    return 'Check those expired warranties';
  }
  if (breakdown.documents_recorded < 5) {
    return 'Scan a few more documents to boost your score';
  }
  if (breakdown.assets_recorded < 3) {
    return 'Add more items to your rooms';
  }
  return null;
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
    if (hasDueSoon) {
      registerForPushNotificationsIfNeeded();
    }
  }, [hasDueSoon]);

  if (isLoading) return null;
  if (dueSoon.length === 0) return null;

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <SectionHeader title="Maintenance" />
      {dueSoon.map((task) => {
        const overdue = new Date(task.next_due_date) < new Date();
        return (
          <Card key={task.id}>
            <ListRow
              title={task.title}
              subtitle={`Due ${task.next_due_date}`}
              trailing={overdue ? <Badge label="Overdue" tone="danger" /> : undefined}
            />
            <Button
              label="Mark done"
              variant="secondary"
              onPress={() =>
                completeTask.mutate(
                  { taskId: task.id, propertyId },
                  {
                    onError: (err) =>
                      Alert.alert('Could not mark this done', err instanceof Error ? err.message : 'Please try again.'),
                  },
                )
              }
              loading={completeTask.isPending}
            />
          </Card>
        );
      })}
    </View>
  );
}
