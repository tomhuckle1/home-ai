import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button, ChipSelect, DateInput, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useCreateMaintenanceTask } from '@/src/hooks/useMaintenance';
import type { MaintenanceFrequency } from '@/src/types/database';

const FREQUENCIES: { value: MaintenanceFrequency; label: string }[] = [
  { value: 'once', label: 'One-off' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'biannual', label: 'Every 6 months' },
  { value: 'annual', label: 'Yearly' },
];

export default function NewMaintenanceScreen() {
  const { propertyId, assetId } = useLocalSearchParams<{ propertyId: string; assetId?: string }>();
  const theme = useTheme();
  const createTask = useCreateMaintenanceTask();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<MaintenanceFrequency>('annual');
  const [nextDueDate, setNextDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    try {
      await createTask.mutateAsync({
        property_id: propertyId,
        asset_id: assetId ?? null,
        title: title.trim(),
        description: description.trim() || null,
        frequency_type: frequency,
        next_due_date: nextDueDate.trim(),
        source: 'user',
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create this reminder.');
    }
  }

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.xxs }}>
          <Text variant="title1">Add reminder</Text>
          <Text variant="body" color="textSecondary">
            Set a maintenance reminder — you&apos;ll be notified when it&apos;s due.
          </Text>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <TextField
            label="What needs doing?"
            value={title}
            onChangeText={setTitle}
            autoFocus
            placeholder="e.g. Service the boiler"
          />
          <TextField
            label="Notes (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="footnote" color="textSecondary">How often?</Text>
          <ChipSelect
            options={FREQUENCIES}
            value={frequency}
            onChange={(v) => setFrequency(v ?? 'annual')}
            allowDeselect={false}
          />
        </View>

        <DateInput label="Next due date" value={nextDueDate} onChange={setNextDueDate} />

        {error ? <Text variant="footnote" color="danger">{error}</Text> : null}

        <Button
          label="Create reminder"
          onPress={handleSave}
          loading={createTask.isPending}
          disabled={!title.trim() || !nextDueDate.trim()}
        />
      </ScrollView>
    </Screen>
  );
}
