import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { Badge, Button, Card, ChipSelect, DateInput, ListRow, Screen, SectionHeader, StatCard, Text, TextField, useTheme } from '@/src/design-system';
import { useCreateMeterReading, useDeleteMeterReading, useEnergyUsage, useMeterReadings } from '@/src/hooks/useEnergy';
import type { MeterType } from '@/src/types/database';

const METER_TYPES: { value: MeterType; label: string; icon: string; unit: string }[] = [
  { value: 'electricity', label: 'Electricity', icon: '⚡', unit: 'kWh' },
  { value: 'gas', label: 'Gas', icon: '🔥', unit: 'm³' },
  { value: 'water', label: 'Water', icon: '💧', unit: 'm³' },
  { value: 'solar_generation', label: 'Solar generated', icon: '☀️', unit: 'kWh' },
  { value: 'solar_export', label: 'Solar exported', icon: '📤', unit: 'kWh' },
];

const METER_OPTIONS = METER_TYPES.map((m) => ({ value: m.value, label: m.label }));

export default function EnergyScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const theme = useTheme();
  const [selectedType, setSelectedType] = useState<MeterType>('electricity');
  const [showAddForm, setShowAddForm] = useState(false);
  const { data: readings } = useMeterReadings(propertyId, selectedType);
  const { data: usage } = useEnergyUsage(propertyId);
  const deleteReading = useDeleteMeterReading();

  const typeInfo = METER_TYPES.find((m) => m.value === selectedType)!;
  const currentUsage = usage?.[selectedType];

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </Pressable>
          <Text variant="title1">Energy & meters</Text>
        </View>

        {/* Meter type selector */}
        <ChipSelect options={METER_OPTIONS} value={selectedType} onChange={(v) => setSelectedType(v ?? 'electricity')} allowDeselect={false} />

        {/* Usage summary */}
        {currentUsage ? (
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <StatCard icon={typeInfo.icon} label={`Latest (${currentUsage.unit})`} value={String(currentUsage.latest)} />
            <StatCard icon="📊" label={`Used (${currentUsage.period})`} value={`${currentUsage.diff > 0 ? '+' : ''}${currentUsage.diff.toFixed(1)}`} tone={currentUsage.diff > 0 ? 'neutral' : 'accent'} />
          </View>
        ) : null}

        {/* Add reading */}
        {showAddForm ? (
          <AddReadingForm propertyId={propertyId} meterType={selectedType} unit={typeInfo.unit} onDone={() => setShowAddForm(false)} />
        ) : (
          <Button label={`Submit ${typeInfo.label.toLowerCase()} reading`} onPress={() => setShowAddForm(true)} />
        )}

        {/* History */}
        {readings && readings.length > 0 ? (
          <View style={{ gap: theme.spacing.xs }}>
            <SectionHeader title="Reading history" />
            {readings.map((r) => (
              <Card key={r.id}>
                <ListRow
                  leading={<Text style={{ fontSize: 18 }}>{typeInfo.icon}</Text>}
                  title={`${r.reading} ${r.unit}`}
                  subtitle={r.reading_date}
                  trailing={
                    <Pressable accessibilityRole="button" accessibilityLabel="Delete" onPress={() => {
                      Alert.alert('Delete this reading?', undefined, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteReading.mutate({ id: r.id, property_id: r.property_id }) },
                      ]);
                    }}>
                      <Ionicons name="trash-outline" size={18} color={theme.colors.textTertiary} />
                    </Pressable>
                  }
                />
              </Card>
            ))}
          </View>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: theme.spacing.lg }}>
            <Text style={{ fontSize: 40 }}>{typeInfo.icon}</Text>
            <Text variant="body" color="textSecondary" style={{ marginTop: theme.spacing.sm, textAlign: 'center' }}>
              No {typeInfo.label.toLowerCase()} readings yet.{'\n'}Submit your first to start tracking usage.
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function AddReadingForm({ propertyId, meterType, unit, onDone }: { propertyId: string; meterType: MeterType; unit: string; onDone: () => void }) {
  const theme = useTheme();
  const createReading = useCreateMeterReading();
  const [reading, setReading] = useState('');
  const [readingDate, setReadingDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const num = Number(reading);
    if (!reading.trim() || isNaN(num)) { setError('Enter a valid reading.'); return; }
    setError(null);
    try {
      await createReading.mutateAsync({ property_id: propertyId, meter_type: meterType, reading: num, reading_date: readingDate, unit });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    }
  }

  return (
    <Card>
      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="headline">New reading</Text>
        <TextField label={`Reading (${unit})`} value={reading} onChangeText={setReading} keyboardType="decimal-pad" autoFocus placeholder="e.g. 12345.6" />
        <DateInput label="Date" value={readingDate} onChange={setReadingDate} />
        {error ? <Text variant="footnote" color="danger">{error}</Text> : null}
        <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
          <View style={{ flex: 1 }}><Button label="Submit" onPress={handleSubmit} loading={createReading.isPending} /></View>
          <View style={{ flex: 1 }}><Button label="Cancel" variant="ghost" onPress={onDone} /></View>
        </View>
      </View>
    </Card>
  );
}
ENDOFFILE