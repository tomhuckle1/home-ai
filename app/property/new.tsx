import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button, ChipSelect, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useHousehold } from '@/src/hooks/useProfile';
import { useCreateProperty } from '@/src/hooks/useProperty';
import type { PropertyType } from '@/src/types/database';

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'detached', label: 'Detached' },
  { value: 'semi_detached', label: 'Semi-detached' },
  { value: 'terraced', label: 'Terraced' },
  { value: 'flat', label: 'Flat' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'other', label: 'Other' },
];

export default function NewPropertyScreen() {
  const theme = useTheme();
  const { data: household } = useHousehold();
  const createProperty = useCreateProperty();

  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType | undefined>();
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!household) return;
    setError(null);
    try {
      const property = await createProperty.mutateAsync({
        household_id: household.id,
        address_line1: addressLine1.trim(),
        city: city.trim() || null,
        postcode: postcode.trim() || null,
        property_type: propertyType ?? null,
      });
      router.replace(`/property/${property.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this property.');
    }
  }

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.xxs }}>
          <Text variant="title1">Let&apos;s create your home&apos;s memory</Text>
          <Text variant="body" color="textSecondary">
            Just the address to start — you can add everything else as you go.
          </Text>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <TextField label="Address" value={addressLine1} onChangeText={setAddressLine1} autoFocus />
          <TextField label="City" value={city} onChangeText={setCity} />
          <TextField
            label="Postcode"
            value={postcode}
            onChangeText={setPostcode}
            autoCapitalize="characters"
          />
        </View>

        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="footnote" color="textSecondary">
            Property type (optional)
          </Text>
          <ChipSelect options={PROPERTY_TYPES} value={propertyType} onChange={setPropertyType} />
        </View>

        {error ? (
          <Text variant="footnote" color="danger">
            {error}
          </Text>
        ) : null}

        <Button
          label="Create property"
          onPress={handleSave}
          loading={createProperty.isPending}
          disabled={!addressLine1.trim() || !household}
        />
      </ScrollView>
    </Screen>
  );
}
