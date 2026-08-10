import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';

import { Button, Card, DateInput, ListRow, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useDeleteTimelineEvent, useTimelineEvent, useUpdateTimelineEvent } from '@/src/hooks/useTimeline';
import { TIMELINE_EVENT_ICON } from '@/src/lib/timeline-icons';

export default function TimelineEventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data: event, isLoading } = useTimelineEvent(id);
  const deleteEvent = useDeleteTimelineEvent();
  const updateEvent = useUpdateTimelineEvent();
  const [editing, setEditing] = useState(false);

  // Edit form state
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (event && !loaded) {
      setTitle(event.title);
      setEventDate(event.event_date);
      setCost(event.cost ? String(event.cost) : '');
      setDescription(event.description ?? '');
      setLoaded(true);
    }
  }, [event, loaded]);

  if (isLoading || !event) {
    return (<Screen style={{ justifyContent: 'center' }}><ActivityIndicator /></Screen>);
  }

  function handleDelete() {
    Alert.alert(`Delete "${event!.title}"?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        deleteEvent.mutate({ id: event!.id, property_id: event!.property_id }, {
          onSuccess: () => router.back(),
          onError: (err) => Alert.alert('Error', err instanceof Error ? err.message : 'Try again.'),
        });
      }},
    ]);
  }

  async function handleSave() {
    setError(null);
    try {
      await updateEvent.mutateAsync({
        id, update: {
          title: title.trim(),
          event_date: eventDate.trim(),
          cost: cost.trim() ? Number(cost) : null,
          description: description.trim() || null,
        },
      });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    }
  }

  if (editing) {
    return (
      <Screen edges={['bottom']}>
        <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <Pressable accessibilityRole="button" onPress={() => setEditing(false)} hitSlop={12}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
            </Pressable>
            <Text variant="title1">Edit event</Text>
          </View>
          <View style={{ gap: theme.spacing.sm }}>
            <TextField label="Title" value={title} onChangeText={setTitle} />
            <DateInput label="Date" value={eventDate} onChange={setEventDate} />
            <TextField label="Cost (£)" value={cost} onChangeText={setCost} keyboardType="decimal-pad" />
            <TextField label="Notes" value={description} onChangeText={setDescription} multiline />
          </View>
          {error ? <Text variant="footnote" color="danger">{error}</Text> : null}
          <Button label="Save changes" onPress={handleSave} loading={updateEvent.isPending} />
        </ScrollView>
      </Screen>
    );
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

        {event.description ? (<Card><Text variant="body">{event.description}</Text></Card>) : null}

        {event.related_asset_id || event.related_document_id || event.contractor ? (
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="footnote" color="textSecondary">Linked to</Text>
            {event.related_asset_id ? (<Card><ListRow title="View item" showChevron onPress={() => router.push(`/asset/${event.related_asset_id}`)} /></Card>) : null}
            {event.related_document_id ? (<Card><ListRow title="View document" showChevron onPress={() => router.push(`/document/${event.related_document_id}`)} /></Card>) : null}
            {event.contractor ? (<Card><ListRow title={event.contractor.name} subtitle={event.contractor.trade ?? undefined} /></Card>) : null}
          </View>
        ) : null}

        <Button label="Edit" variant="secondary" onPress={() => setEditing(true)} />
        <Button label="Delete event" variant="danger" onPress={handleDelete} loading={deleteEvent.isPending} />
      </ScrollView>
    </Screen>
  );
}
