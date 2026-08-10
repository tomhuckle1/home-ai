import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { Badge, Button, Card, DateInput, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useDeleteVehicle, useUpdateVehicle, useVehicles } from '@/src/hooks/useVehiclesAndInsurance';

export default function VehicleDetailScreen() {
  const { id, propertyId } = useLocalSearchParams<{ id: string; propertyId: string }>();
  const theme = useTheme();
  const { data: vehicles } = useVehicles(propertyId);
  const vehicle = vehicles?.find((v) => v.id === id);
  const updateVehicle = useUpdateVehicle();
  const deleteVehicle = useDeleteVehicle();

  const [editing, setEditing] = useState(false);
  const [reg, setReg] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [motExpiry, setMotExpiry] = useState('');
  const [taxExpiry, setTaxExpiry] = useState('');
  const [insProvider, setInsProvider] = useState('');
  const [insRenewal, setInsRenewal] = useState('');
  const [serviceDue, setServiceDue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (vehicle && !loaded) {
      setReg(vehicle.registration ?? '');
      setMake(vehicle.make ?? '');
      setModel(vehicle.model ?? '');
      setMotExpiry(vehicle.mot_expiry ?? '');
      setTaxExpiry(vehicle.tax_expiry ?? '');
      setInsProvider(vehicle.insurance_provider ?? '');
      setInsRenewal(vehicle.insurance_renewal ?? '');
      setServiceDue(vehicle.service_due_date ?? '');
      setLoaded(true);
    }
  }, [vehicle, loaded]);

  if (!vehicle) return null;

  const daysUntil = (d: string | null) => d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null;
  const motDays = daysUntil(vehicle.mot_expiry);
  const taxDays = daysUntil(vehicle.tax_expiry);
  const vehicleName = [vehicle.make, vehicle.model].filter(Boolean).join(' ') || vehicle.registration || 'Vehicle';

  function handleDelete() {
    Alert.alert(`Delete ${vehicleName}?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        deleteVehicle.mutate({ id: vehicle!.id, property_id: vehicle!.property_id }, {
          onSuccess: () => router.back(),
          onError: (err) => Alert.alert('Error', err instanceof Error ? err.message : 'Try again.'),
        });
      }},
    ]);
  }

  async function handleSave() {
    setError(null);
    try {
      await updateVehicle.mutateAsync({
        id, update: {
          registration: reg.trim().toUpperCase() || null, make: make.trim() || null, model: model.trim() || null,
          mot_expiry: motExpiry.trim() || null, tax_expiry: taxExpiry.trim() || null,
          insurance_provider: insProvider.trim() || null, insurance_renewal: insRenewal.trim() || null,
          service_due_date: serviceDue.trim() || null,
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
            <Text variant="title1">Edit vehicle</Text>
          </View>
          <View style={{ gap: theme.spacing.sm }}>
            <TextField label="Registration" value={reg} onChangeText={setReg} autoCapitalize="characters" />
            <TextField label="Make" value={make} onChangeText={setMake} />
            <TextField label="Model" value={model} onChangeText={setModel} />
            <DateInput label="MOT expiry" value={motExpiry} onChange={setMotExpiry} />
            <DateInput label="Tax expiry" value={taxExpiry} onChange={setTaxExpiry} />
            <TextField label="Insurance provider" value={insProvider} onChangeText={setInsProvider} />
            <DateInput label="Insurance renewal" value={insRenewal} onChange={setInsRenewal} />
            <DateInput label="Next service due" value={serviceDue} onChange={setServiceDue} />
          </View>
          {error ? <Text variant="footnote" color="danger">{error}</Text> : null}
          <Button label="Save changes" onPress={handleSave} loading={updateVehicle.isPending} />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.xxs }}>
          <Text variant="title1">{vehicleName}</Text>
          {vehicle.registration ? <Text variant="body" color="textSecondary">{vehicle.registration}</Text> : null}
          <View style={{ flexDirection: 'row', gap: theme.spacing.xs, flexWrap: 'wrap' }}>
            {motDays !== null ? <Badge label={motDays < 0 ? 'MOT expired' : `MOT: ${motDays}d`} tone={motDays < 0 ? 'danger' : motDays < 30 ? 'warning' : 'accent'} /> : null}
            {taxDays !== null ? <Badge label={taxDays < 0 ? 'Tax expired' : `Tax: ${taxDays}d`} tone={taxDays < 0 ? 'danger' : taxDays < 30 ? 'warning' : 'accent'} /> : null}
          </View>
        </View>

        <Card>
          <View style={{ gap: theme.spacing.sm }}>
            {vehicle.mot_expiry ? <Field label="MOT expiry" value={vehicle.mot_expiry} /> : null}
            {vehicle.tax_expiry ? <Field label="Tax expiry" value={vehicle.tax_expiry} /> : null}
            {vehicle.insurance_provider ? <Field label="Insurance" value={vehicle.insurance_provider} /> : null}
            {vehicle.insurance_renewal ? <Field label="Insurance renewal" value={vehicle.insurance_renewal} /> : null}
            {vehicle.service_due_date ? <Field label="Next service" value={vehicle.service_due_date} /> : null}
          </View>
        </Card>

        <Button label="Edit" variant="secondary" onPress={() => setEditing(true)} />
        <Button label="Delete vehicle" variant="danger" onPress={handleDelete} loading={deleteVehicle.isPending} />
      </ScrollView>
    </Screen>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (<View style={{ gap: 2 }}><Text variant="caption" color="textTertiary">{label.toUpperCase()}</Text><Text variant="body">{value}</Text></View>);
}
