import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, RefreshControl, SectionList, View } from 'react-native';

import { Badge, Button, Card, ChipSelect, EmptyState, ListRow, Screen, Text, useTheme } from '@/src/design-system';
import { useProperties } from '@/src/hooks/useProperties';
import { useTimeline } from '@/src/hooks/useTimeline';
import { TIMELINE_EVENT_ICON } from '@/src/lib/timeline-icons';
import type { TimelineEventRow, TimelineEventType } from '@/src/types/database';

const EVENT_FILTERS: { value: TimelineEventType; label: string }[] = [
  { value: 'renovation', label: 'Renovation' },
  { value: 'repair', label: 'Repair' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'maintenance_completed', label: 'Maintenance' },
  { value: 'document_added', label: 'Document' },
  { value: 'asset_added', label: 'Item added' },
  { value: 'insurance_renewed', label: 'Insurance' },
];

function yearOf(dateStr: string) {
  return dateStr.slice(0, 4);
}

export default function TimelineScreen() {
  const theme = useTheme();
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const property = properties?.[0];
  const { data: events, isLoading: eventsLoading, refetch, isRefetching } = useTimeline(property?.id);
  const [filter, setFilter] = useState<TimelineEventType | undefined>();

  if (propertiesLoading || (property && eventsLoading)) {
    return (
      <Screen edges={['top']} style={{ justifyContent: 'center' }}>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (!property) {
    return (
      <Screen edges={['top']} style={{ justifyContent: 'center' }}>
        <EmptyState icon="🕓" title="Timeline" description="Add your property to start building its history." />
      </Screen>
    );
  }

  const filteredEvents = filter ? (events ?? []).filter((e) => e.event_type === filter) : (events ?? []);
  const sections = groupByYear(filteredEvents);
  const totalCost = filteredEvents.reduce((sum, e) => sum + (e.cost ?? 0), 0);

  return (
    <Screen edges={['top']}>
      <View style={{ paddingVertical: theme.spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text variant="largeTitle">Timeline</Text>
          {events && events.length > 0 ? (
            <Text variant="footnote" color="textSecondary" style={{ marginTop: 2 }}>
              {filteredEvents.length} event{filteredEvents.length === 1 ? '' : 's'}
              {totalCost > 0 ? ` · £${Math.round(totalCost).toLocaleString()}` : ''}
            </Text>
          ) : null}
        </View>
        {events && events.length > 0 ? (
          <Button label="Add" variant="ghost" fullWidth={false} onPress={() => router.push({ pathname: '/timeline/new', params: { propertyId: property.id } })} />
        ) : null}
      </View>

      {/* Filters */}
      {events && events.length > 0 ? (
        <View style={{ paddingBottom: theme.spacing.sm }}>
          <ChipSelect options={EVENT_FILTERS} value={filter} onChange={setFilter} />
        </View>
      ) : null}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={theme.colors.accent} />}
        ListEmptyComponent={
          <EmptyState
            icon="🕓"
            title={filter ? 'No matching events' : 'Nothing recorded yet'}
            description={filter ? 'Try a different filter.' : "Your property's history builds itself as you add rooms, items and documents."}
            actionLabel={!filter ? 'Add a past event' : undefined}
            onAction={!filter ? () => router.push({ pathname: '/timeline/new', params: { propertyId: property.id } }) : undefined}
          />
        }
        renderSectionHeader={({ section }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.sm }}>
            <Text variant="headline" color="textSecondary">{section.title}</Text>
            <Badge label={`${section.data.length}`} tone="neutral" />
          </View>
        )}
        renderItem={({ item }) => {
          const hasCost = item.cost != null && item.cost > 0;
          return (
            <Card style={{ marginBottom: theme.spacing.sm }}>
              <ListRow
                leading={
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 18, lineHeight: 22 }}>{TIMELINE_EVENT_ICON[item.event_type]}</Text>
                  </View>
                }
                title={item.title}
                subtitle={[item.event_date, hasCost ? `£${item.cost}` : null].filter(Boolean).join(' · ') || undefined}
                onPress={() => router.push(`/timeline/${item.id}`)}
                showChevron
              />
            </Card>
          );
        }}
      />
    </Screen>
  );
}

function groupByYear(events: TimelineEventRow[]) {
  const byYear = new Map<string, TimelineEventRow[]>();
  for (const event of events) {
    const year = yearOf(event.event_date);
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(event);
  }
  return Array.from(byYear.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([year, data]) => ({ title: year, data }));
}
