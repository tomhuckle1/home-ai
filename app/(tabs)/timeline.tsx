import { router } from 'expo-router';
import { ActivityIndicator, SectionList, View } from 'react-native';

import { Button, Card, EmptyState, ListRow, Screen, Text, useTheme } from '@/src/design-system';
import { useProperties } from '@/src/hooks/useProperties';
import { useTimeline } from '@/src/hooks/useTimeline';
import { TIMELINE_EVENT_ICON } from '@/src/lib/timeline-icons';
import type { TimelineEventRow } from '@/src/types/database';

function yearOf(dateStr: string) {
  return dateStr.slice(0, 4);
}

export default function TimelineScreen() {
  const theme = useTheme();
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const property = properties?.[0];
  const { data: events, isLoading: eventsLoading } = useTimeline(property?.id);

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
        <EmptyState
          icon="🕓"
          title="Timeline"
          description="Add your property to start building its history — every item and document you record shows up here automatically."
        />
      </Screen>
    );
  }

  const sections = groupByYear(events ?? []);

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
        <Text variant="largeTitle">Timeline</Text>
        {events && events.length > 0 ? (
          <Button
            label="Add"
            variant="ghost"
            fullWidth={false}
            onPress={() => router.push({ pathname: '/timeline/new', params: { propertyId: property.id } })}
          />
        ) : null}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <EmptyState
            icon="🕓"
            title="Nothing recorded yet"
            description="Your property's history builds itself as you add rooms, items and documents."
            actionLabel="Add a past event"
            onAction={() => router.push({ pathname: '/timeline/new', params: { propertyId: property.id } })}
          />
        }
        renderSectionHeader={({ section }) => (
          <Text
            variant="headline"
            color="textSecondary"
            style={{ paddingVertical: theme.spacing.xs }}
          >
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: theme.spacing.sm }}>
            <ListRow
              leading={<Text style={{ fontSize: 20 }}>{TIMELINE_EVENT_ICON[item.event_type]}</Text>}
              title={item.title}
              subtitle={
                [item.event_date, item.cost ? `£${item.cost}` : null].filter(Boolean).join(' · ') || undefined
              }
              onPress={() => router.push(`/timeline/${item.id}`)}
              showChevron
            />
          </Card>
        )}
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
