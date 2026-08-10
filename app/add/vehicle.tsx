import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';

import { Button, DateInput, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useCreateMaintenanceTask } from '@/src/hooks/useMaintenance';
import { useCreateVehicle } from '@/src/hooks/useVehiclesAndInsurance';

export default function AddVehicleScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const theme = useTheme();
  const createVehicle = useCreateVehicle();
  const createReminder = useCreateMaintenanceTask();

  const [registration, setRegistration] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [colour, setColour] = useState('');
  const [year, setYear] = useState('');
  const [motExpiry, setMotExpiry] = useState('');
  const [taxExpiry, setTaxExpiry] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insuranceRenewal, setInsuranceRenewal] = useState('');
  const [serviceDueDate, setServiceDueDate] = useState('');
  const [setReminders, setSetReminders] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await createVehicle.mutateAsync({
        property_id: propertyId,
        registration: registration.trim().toUpperCase() || null,
        make: make.trim() || null,
        model: model.trim() || null,
        colour: colour.trim() || null,
        year: year.trim() ? Number(year) : null,
        mot_expiry: motExpiry.trim() || null,
        tax_expiry: taxExpiry.trim() || null,
        insurance_provider: insuranceProvider.trim() || null,
        insurance_renewal: insuranceRenewal.trim() || null,
        service_due_date: serviceDueDate.trim() || null,
      });

      const vehicleName = [make.trim(), model.trim()].filter(Boolean).join(' ') || registration.trim() || 'Vehicle';

      if (setReminders) {
        const reminderPromises = [];

        if (motExpiry.trim()) {
          const d = new Date(motExpiry.trim()); d.setDate(d.getDate() - 30);
          reminderPromises.push(createReminder.mutateAsync({
            property_id: propertyId, title: `${vehicleName} — MOT due`,
            description: `Your MOT expires on ${motExpiry.trim()}.`,
            frequency_type: 'annual', next_due_date: d.toISOString().slice(0, 10), source: 'user',
          }));
        }
        if (taxExpiry.trim()) {
          const d = new Date(taxExpiry.trim()); d.setDate(d.getDate() - 30);
          reminderPromises.push(createReminder.mutateAsync({
            property_id: propertyId, title: `${vehicleName} — Tax renewal`,
            description: `Your vehicle tax expires on ${taxExpiry.trim()}.`,
            frequency_type: 'annual', next_due_date: d.toISOString().slice(0, 10), source: 'user',
          }));
        }
        if (insuranceRenewal.trim()) {
          const d = new Date(insuranceRenewal.trim()); d.setDate(d.getDate() - 30);
          reminderPromises.push(createReminder.mutateAsync({
            property_id: propertyId, title: `${vehicleName} — Insurance renewal`,
            description: `Your car insurance with ${insuranceProvider.trim() || 'your provider'} renews on ${insuranceRenewal.trim()}.`,
            frequency_type: 'annual', next_due_date: d.toISOString().slice(0, 10), source: 'user',
          }));
        }
        if (serviceDueDate.trim()) {
          reminderPromises.push(createReminder.mutateAsync({
            property_id: propertyId, title: `${vehicleName} — Service due`,
            description: `Your next vehicle service is due.`,
            frequency_type: 'annual', next_due_date: serviceDueDate.trim(), source: 'user',
          }));
        }

        await Promise.allSettled(reminderPromises);
      }

      router.back();
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
      setSaving(false);
    }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text variant="title1">Add vehicle</Text>
            <Text variant="footnote" color="textSecondary">Track MOT, tax, insurance, and service</Text>
          </View>
          <Text style={{ fontSize: 32 }}>🚗</Text>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <TextField label="Registration" value={registration} onChangeText={setRegistration} autoCapitalize="characters" placeholder="e.g. AB12 CDE" />
          <TextField label="Make" value={make} onChangeText={setMake} placeholder="e.g. Ford" />
          <TextField label="Model" value={model} onChangeText={setModel} placeholder="e.g. Focus" />
          <TextField label="Colour (optional)" value={colour} onChangeText={setColour} />
          <TextField label="Year (optional)" value={year} onChangeText={setYear} keyboardType="number-pad" />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="headline">Key dates</Text>
          <DateInput label="MOT expiry" value={motExpiry} onChange={setMotExpiry} />
          <DateInput label="Tax expiry" value={taxExpiry} onChange={setTaxExpiry} />
          <DateInput label="Next service due" value={serviceDueDate} onChange={setServiceDueDate} />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="headline">Insurance</Text>
          <TextField label="Insurance provider" value={insuranceProvider} onChangeText={setInsuranceProvider} />
          <DateInput label="Insurance renewal" value={insuranceRenewal} onChange={setInsuranceRenewal} />
        </View>

        {/* Reminders toggle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.sm }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="body">Set reminders</Text>
            <Text variant="caption" color="textSecondary">30 days before MOT, tax, insurance, and service</Text>
          </View>
          <Switch value={setReminders} onValueChange={setSetReminders} trackColor={{ true: theme.colors.accent, false: theme.colors.surfaceAlt }} />
        </View>

        {error ? <Text variant="footnote" color="danger">{error}</Text> : null}

        <Button label="Save vehicle" onPress={handleSave} loading={saving} disabled={!registration.trim() && !make.trim()} size="lg" />
      </ScrollView>
    </Screen>
  );
}
