import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';

import { Button, Card, ListRow, Screen, Text, useTheme } from '@/src/design-system';
import { useDeleteTimelineEvent, useTimelineEvent } from '@/src/hooks/useTimeline';
import { isWithinDeleteWindow } from '@/src/lib/deleteWindow';
import { TIMELINE_EVENT_ICON } from '@/src/lib/timeline-icons';

export default function TimelineEventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data: event, isLoading } = useTimelineEvent(id);
  const deleteEvent = useDeleteTimelineEvent();

  if (isLoading || !event) {
    return (
      <Screen style={{ justifyContent: 'center' }}>
        <ActivityIndicator />
      </Screen>
    );
  }

  function handleDelete() {
    if (!event) return;
    Alert.alert(`Delete "${event.title}"?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteEvent.mutate(
            { id: event.id, property_id: event.property_id },
            {
              onSuccess: () => router.back(),
              onError: (err) =>
                Alert.alert('Could not delete this event', err instanceof Error ? err.message : 'Please try again.'),
            },
          );
        },
      },
    ]);
  }

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.xxs }}>
          <Text style={{ fontSize: 40, lineHeight: 48 }}>{TIMELINE_EVENT_ICON[event.event_type]}</Text>
          <Text variant="title1">{event.title}</Text>
          <Text variant="body" color="textSecondary">
            {[event.event_date, event.cost ? `£${event.cost}` : null].filter(Boolean).join(' · ')}
          </Text>
        </View>

        {event.description ? (
          <Card>
            <Text variant="body">{event.description}</Text>
          </Card>
        ) : null}

        {event.related_asset_id || event.related_document_id || event.contractor ? (
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="footnote" color="textSecondary">
              Linked to
            </Text>
            {event.related_asset_id ? (
              <Card>
                <ListRow title="View item" showChevron onPress={() => router.push(`/asset/${event.related_asset_id}`)} />
              </Card>
            ) : null}
            {event.related_document_id ? (
              <Card>
                <ListRow
                  title="View document"
                  showChevron
                  onPress={() => router.push(`/document/${event.related_document_id}`)}
                />
              </Card>
            ) : null}
            {event.contractor ? (
              <Card>
                <ListRow title={event.contractor.name} subtitle={event.contractor.trade ?? undefined} />
              </Card>
            ) : null}
          </View>
        ) : null}

        {isWithinDeleteWindow(event.created_at) ? (
          <Button label="Delete event" variant="danger" onPress={handleDelete} loading={deleteEvent.isPending} />
        ) : (
          <Text variant="footnote" color="textTertiary" style={{ textAlign: 'center' }}>
            This can no longer be deleted — it&apos;s past the 30-minute window for undoing a mistake.
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}
