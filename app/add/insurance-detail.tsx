import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { Badge, Button, Card, ChipSelect, DateInput, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useDeleteInsurancePolicy, useInsurancePolicies, useUpdateInsurancePolicy } from '@/src/hooks/useVehiclesAndInsurance';
import { policyTypeLabel } from '@/src/lib/display-labels';
import type { InsurancePolicyRow, InsurancePolicyType } from '@/src/types/database';

const POLICY_TYPES: { value: InsurancePolicyType; label: string }[] = [
  { value: 'home_buildings', label: 'Buildings' },
  { value: 'home_contents', label: 'Home Contents' },
  { value: 'car', label: 'Car' },
  { value: 'life', label: 'Life' },
  { value: 'pet', label: 'Pet' },
  { value: 'boiler_cover', label: 'Boiler Cover' },
  { value: 'gadget', label: 'Gadget' },
  { value: 'travel', label: 'Travel' },
  { value: 'other', label: 'Other' },
];

export default function InsuranceDetailScreen() {
  const { id, propertyId } = useLocalSearchParams<{ id: string; propertyId: string }>();
  const theme = useTheme();
  const { data: policies } = useInsurancePolicies(propertyId);
  const policy = policies?.find((p) => p.id === id);
  const updatePolicy = useUpdateInsurancePolicy();
  const deletePolicy = useDeleteInsurancePolicy();

  const [editing, setEditing] = useState(false);
  const [policyType, setPolicyType] = useState<InsurancePolicyType>('home_buildings');
  const [provider, setProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [premium, setPremium] = useState('');
  const [excess, setExcess] = useState('');
  const [startDate, setStartDate] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (policy && !loaded) {
      setPolicyType(policy.policy_type);
      setProvider(policy.provider ?? '');
      setPolicyNumber(policy.policy_number ?? '');
      setPremium(policy.annual_premium ? String(policy.annual_premium) : '');
      setExcess(policy.excess ? String(policy.excess) : '');
      setStartDate(policy.start_date ?? '');
      setRenewalDate(policy.renewal_date ?? '');
      setNotes(policy.notes ?? '');
      setLoaded(true);
    }
  }, [policy, loaded]);

  if (!policy) return null;

  const daysUntil = policy.renewal_date
    ? Math.ceil((new Date(policy.renewal_date).getTime() - Date.now()) / 86400000)
    : null;

  function handleDelete() {
    Alert.alert('Delete this policy?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        deletePolicy.mutate({ id: policy!.id, property_id: policy!.property_id }, {
          onSuccess: () => router.back(),
          onError: (err) => Alert.alert('Error', err instanceof Error ? err.message : 'Try again.'),
        });
      }},
    ]);
  }

  async function handleSave() {
    setError(null);
    try {
      await updatePolicy.mutateAsync({
        id, update: {
          policy_type: policyType, provider: provider.trim() || null,
          policy_number: policyNumber.trim() || null,
          annual_premium: premium.trim() ? Number(premium) : null,
          excess: excess.trim() ? Number(excess) : null,
          start_date: startDate.trim() || null,
          renewal_date: renewalDate.trim() || null,
          notes: notes.trim() || null,
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
            <Text variant="title1">Edit policy</Text>
          </View>
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="footnote" color="textSecondary">Type</Text>
            <ChipSelect options={POLICY_TYPES} value={policyType} onChange={(v) => setPolicyType(v ?? 'other')} allowDeselect={false} />
          </View>
          <View style={{ gap: theme.spacing.sm }}>
            <TextField label="Provider" value={provider} onChangeText={setProvider} />
            <TextField label="Policy number" value={policyNumber} onChangeText={setPolicyNumber} />
            <TextField label="Annual premium (£)" value={premium} onChangeText={setPremium} keyboardType="decimal-pad" />
            <TextField label="Excess (£)" value={excess} onChangeText={setExcess} keyboardType="decimal-pad" />
            <DateInput label="Start date" value={startDate} onChange={setStartDate} />
            <DateInput label="Renewal date" value={renewalDate} onChange={setRenewalDate} />
            <TextField label="Notes" value={notes} onChangeText={setNotes} multiline />
          </View>
          {error ? <Text variant="footnote" color="danger">{error}</Text> : null}
          <Button label="Save changes" onPress={handleSave} loading={updatePolicy.isPending} />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.xxs }}>
          <Text variant="title1">{policyTypeLabel(policy.policy_type)}</Text>
          {policy.provider ? <Text variant="body" color="textSecondary">{policy.provider}</Text> : null}
          {daysUntil !== null ? (
            <Badge label={daysUntil < 0 ? 'Expired' : `Renews in ${daysUntil} days`} tone={daysUntil < 0 ? 'danger' : daysUntil < 30 ? 'warning' : 'accent'} />
          ) : null}
        </View>

        <Card>
          <View style={{ gap: theme.spacing.sm }}>
            {policy.policy_number ? <Field label="Policy number" value={policy.policy_number} /> : null}
            {policy.annual_premium ? <Field label="Annual premium" value={`£${policy.annual_premium}`} /> : null}
            {policy.excess ? <Field label="Excess" value={`£${policy.excess}`} /> : null}
            {policy.start_date ? <Field label="Start date" value={policy.start_date} /> : null}
            {policy.renewal_date ? <Field label="Renewal date" value={policy.renewal_date} /> : null}
            {policy.notes ? <Field label="Notes" value={policy.notes} /> : null}
          </View>
        </Card>

        <Button label="Edit" variant="secondary" onPress={() => setEditing(true)} />
        <Button label="Delete policy" variant="danger" onPress={handleDelete} loading={deletePolicy.isPending} />
      </ScrollView>
    </Screen>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text variant="caption" color="textTertiary">{label.toUpperCase()}</Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}
