import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button, ChipSelect, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useCreateTimelineEvent } from '@/src/hooks/useTimeline';
import type { TimelineEventType } from '@/src/types/database';

const EVENT_TYPES: { value: TimelineEventType; label: string }[] = [
  { value: 'purchase', label: 'Bought property' },
  { value: 'sale', label: 'Sold property' },
  { value: 'renovation', label: 'Renovation' },
  { value: 'repair', label: 'Repair' },
  { value: 'insurance_renewed', label: 'Insurance renewed' },
  { value: 'other', label: 'Other' },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewTimelineEventScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const theme = useTheme();
  const createEvent = useCreateTimelineEvent();

  const [eventType, setEventType] = useState<TimelineEventType>('other');
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState(today());
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    try {
      await createEvent.mutateAsync({
        property_id: propertyId,
        event_type: eventType,
        title: title.trim(),
        event_date: eventDate.trim(),
        cost: cost.trim() ? Number(cost) : null,
        description: description.trim() || null,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this event.');
    }
  }

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="footnote" color="textSecondary">
            Event type
          </Text>
          <ChipSelect options={EVENT_TYPES} value={eventType} onChange={(v) => setEventType(v ?? 'other')} allowDeselect={false} />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <TextField label="Title" value={title} onChangeText={setTitle} autoFocus placeholder="e.g. New boiler installed" />
          <TextField label="Date (YYYY-MM-DD)" value={eventDate} onChangeText={setEventDate} />
          <TextField label="Cost (£, optional)" value={cost} onChangeText={setCost} keyboardType="decimal-pad" />
          <TextField label="Notes (optional)" value={description} onChangeText={setDescription} multiline />
        </View>

        {error ? (
          <Text variant="footnote" color="danger">
            {error}
          </Text>
        ) : null}

        <Button label="Add to timeline" onPress={handleSave} loading={createEvent.isPending} disabled={!title.trim() || !eventDate.trim()} />
      </ScrollView>
    </Screen>
  );
}
