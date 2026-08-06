import { router } from 'expo-router';
import { ActivityIndicator, FlatList, View } from 'react-native';

import { Badge, Button, Card, EmptyState, ListRow, Screen, Text, useTheme, type ThemeColors } from '@/src/design-system';
import { useHomeHealthScore } from '@/src/hooks/useHealthScore';
import { useCompleteMaintenanceTask, useUpcomingMaintenance } from '@/src/hooks/useMaintenance';
import { useProfile } from '@/src/hooks/useProfile';
import { useProperties } from '@/src/hooks/useProperties';
import type { PropertyRow } from '@/src/types/database';

export default function HomeScreen() {
  const theme = useTheme();
  const { data: profile } = useProfile();
  const { data: properties, isLoading } = useProperties();
  const firstProperty = properties?.[0];

  const firstName = profile?.full_name?.split(' ')[0];

  return (
    <Screen edges={['top']}>
      <View
        style={{
          paddingVertical: theme.spacing.md,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text variant="largeTitle">{firstName ? `Hi ${firstName}` : 'Home'}</Text>
        {properties && properties.length > 0 ? (
          <Button label="Add" variant="ghost" fullWidth={false} onPress={() => router.push('/property/new')} />
        ) : null}
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={properties ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl }}
          ListHeaderComponent={
            firstProperty ? (
              <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
                <HealthScoreCard propertyId={firstProperty.id} />
                <UpcomingMaintenance propertyId={firstProperty.id} />
                <Text variant="headline" style={{ marginTop: theme.spacing.xs }}>
                  Properties
                </Text>
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
            <Card>
              <ListRow
                title={item.address_line1}
                subtitle={[item.city, item.postcode].filter(Boolean).join(', ') || undefined}
                showChevron
                onPress={() => router.push(`/property/${item.id}`)}
              />
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

type ScoreTone = 'accent' | 'warning' | 'danger';

const MUTED_BY_TONE: Record<ScoreTone, keyof ThemeColors> = {
  accent: 'accentMuted',
  warning: 'warningMuted',
  danger: 'dangerMuted',
};

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
        <ActivityIndicator />
      </Card>
    );
  }

  const tone = scoreTone(data.score);
  const breakdown = data.breakdown as Record<string, number>;

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors[MUTED_BY_TONE[tone]],
          }}
        >
          <Text variant="headline" color={tone}>
            {data.score}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="headline">Home Health Score</Text>
          <Text variant="footnote" color="textSecondary">
            {breakdown.overdue_maintenance > 0
              ? `${breakdown.overdue_maintenance} overdue maintenance item${breakdown.overdue_maintenance === 1 ? '' : 's'}`
              : breakdown.expired_warranties > 0
                ? `${breakdown.expired_warranties} expired warrant${breakdown.expired_warranties === 1 ? 'y' : 'ies'}`
                : 'Everything looks up to date'}
          </Text>
        </View>
      </View>
    </Card>
  );
}

function UpcomingMaintenance({ propertyId }: { propertyId: string }) {
  const theme = useTheme();
  const { data: tasks, isLoading } = useUpcomingMaintenance(propertyId);
  const completeTask = useCompleteMaintenanceTask();

  if (isLoading) return null;

  const dueSoon = (tasks ?? []).filter((t) => {
    const daysUntilDue = (new Date(t.next_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilDue < 30;
  });

  if (dueSoon.length === 0) return null;

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Text variant="headline">Maintenance</Text>
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
              onPress={() => completeTask.mutate({ taskId: task.id, propertyId })}
              loading={completeTask.isPending}
            />
          </Card>
        );
      })}
    </View>
  );
}
