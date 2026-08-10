import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';

import { Button, ChipSelect, DateInput, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useCreateMaintenanceTask } from '@/src/hooks/useMaintenance';
import { useCreateInsurancePolicy } from '@/src/hooks/useVehiclesAndInsurance';
import type { InsurancePolicyType } from '@/src/types/database';

const POLICY_TYPES: { value: InsurancePolicyType; label: string }[] = [
  { value: 'home_buildings', label: 'Home buildings' },
  { value: 'home_contents', label: 'Home contents' },
  { value: 'car', label: 'Car' },
  { value: 'life', label: 'Life' },
  { value: 'pet', label: 'Pet' },
  { value: 'boiler_cover', label: 'Boiler cover' },
  { value: 'gadget', label: 'Gadget' },
  { value: 'travel', label: 'Travel' },
  { value: 'other', label: 'Other' },
];

export default function AddInsuranceScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const theme = useTheme();
  const createPolicy = useCreateInsurancePolicy();
  const createReminder = useCreateMaintenanceTask();

  const [policyType, setPolicyType] = useState<InsurancePolicyType | undefined>();
  const [provider, setProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [premium, setPremium] = useState('');
  const [excess, setExcess] = useState('');
  const [startDate, setStartDate] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [setReminder, setSetReminder] = useState(true);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const typeLabel = POLICY_TYPES.find((t) => t.value === policyType)?.label ?? policyType;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const parsedPremium = premium.trim() ? Number(premium) : null;
      const parsedExcess = excess.trim() ? Number(excess) : null;

      await createPolicy.mutateAsync({
        property_id: propertyId,
        policy_type: policyType,
        provider: provider.trim() || null,
        policy_number: policyNumber.trim() || null,
        annual_premium: parsedPremium && !Number.isNaN(parsedPremium) ? parsedPremium : null,
        excess: parsedExcess && !Number.isNaN(parsedExcess) ? parsedExcess : null,
        start_date: startDate.trim() || null,
        renewal_date: renewalDate.trim() || null,
        notes: notes.trim() || null,
      });

      // Set renewal reminder
      if (setReminder && renewalDate.trim()) {
        const reminderDate = new Date(renewalDate.trim());
        reminderDate.setDate(reminderDate.getDate() - 30);
        await createReminder.mutateAsync({
          property_id: propertyId,
          title: `${typeLabel} insurance renewal`,
          description: `Your ${typeLabel.toLowerCase()} insurance with ${provider.trim() || 'your provider'} renews on ${renewalDate.trim()}.`,
          frequency_type: 'annual',
          next_due_date: reminderDate.toISOString().slice(0, 10),
          source: 'user',
        }).catch(() => {});
      }

      router.back();
      router.back(); // Close the add picker too
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
      setSaving(false);
    }
  }

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text variant="title1">Add insurance</Text>
            <Text variant="footnote" color="textSecondary">Never miss a renewal again</Text>
          </View>
          <Text style={{ fontSize: 32 }}>🔑</Text>
        </View>

        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="footnote" color="textSecondary">What type?</Text>
          <ChipSelect options={POLICY_TYPES} value={policyType} onChange={(v) => setPolicyType(v ?? 'other')} allowDeselect={false} />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <TextField label="Provider" value={provider} onChangeText={setProvider} placeholder="e.g. Aviva, Direct Line" />
          <TextField label="Policy number (optional)" value={policyNumber} onChangeText={setPolicyNumber} />
          <TextField label="Annual premium (£)" value={premium} onChangeText={setPremium} keyboardType="decimal-pad" />
          <TextField label="Excess (£, optional)" value={excess} onChangeText={setExcess} keyboardType="decimal-pad" />
          <DateInput label="Start date" value={startDate} onChange={setStartDate} />
          <DateInput label="Renewal date" value={renewalDate} onChange={setRenewalDate} />
          <TextField label="Notes (optional)" value={notes} onChangeText={setNotes} multiline />
        </View>

        {renewalDate.trim() ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.sm }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="body">Renewal reminder</Text>
              <Text variant="caption" color="textSecondary">Remind me 30 days before renewal</Text>
            </View>
            <Switch value={setReminder} onValueChange={setSetReminder} trackColor={{ true: theme.colors.accent, false: theme.colors.surfaceAlt }} />
          </View>
        ) : null}

        {error ? <Text variant="footnote" color="danger">{error}</Text> : null}

        <Button label="Save policy" onPress={handleSave} loading={saving} disabled={!policyType} size="lg" />
      </ScrollView>
    </Screen>
  );
}
