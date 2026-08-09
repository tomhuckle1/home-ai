import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';

import { Button, Card, ChipSelect, ListRow, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useHousehold } from '@/src/hooks/useProfile';
import { useCreateProperty } from '@/src/hooks/useProperty';
import { friendlyMessage } from '@/src/lib/postgrestError';
import type { PropertyType } from '@/src/types/database';

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'detached', label: 'Detached' },
  { value: 'semi_detached', label: 'Semi-detached' },
  { value: 'terraced', label: 'Terraced' },
  { value: 'flat', label: 'Flat' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'other', label: 'Other' },
];

type PostcodeResult = { line_1: string; line_2: string; town_or_city: string; postcode: string };

export default function NewPropertyScreen() {
  const theme = useTheme();
  const { data: household } = useHousehold();
  const createProperty = useCreateProperty();

  const [postcode, setPostcode] = useState('');
  const [addressResults, setAddressResults] = useState<PostcodeResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [selectedPostcode, setSelectedPostcode] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType | undefined>();
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePostcodeLookup() {
    if (!postcode.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const resp = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`);
      const data = await resp.json();
      if (data.status === 200 && data.result) {
        const pc = data.result;
        // postcodes.io returns the postcode and area, but not individual addresses
        // Auto-fill what we can and let user type the rest
        setSelectedPostcode(pc.postcode);
        setCity(pc.admin_district || pc.admin_ward || '');
        setShowManual(true);
        setAddressResults(null);
      } else {
        setError('Postcode not found. Try entering your address manually.');
        setShowManual(true);
      }
    } catch {
      setError('Could not look up postcode. Enter your address manually.');
      setShowManual(true);
    } finally {
      setSearching(false);
    }
  }

  async function handleSave() {
    if (!household) return;
    setError(null);
    try {
      await createProperty.mutateAsync({
        household_id: household.id,
        address_line1: addressLine1.trim(),
        city: city.trim() || null,
        postcode: (selectedPostcode || postcode).trim() || null,
        property_type: propertyType ?? null,
      });
      router.replace('/(tabs)');
    } catch (err) {
      setError(friendlyMessage(err, 'Could not save this property.'));
    }
  }

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.xxs }}>
          <Text variant="title1">Let&apos;s create your home&apos;s memory</Text>
          <Text variant="body" color="textSecondary">Enter your postcode to find your address, or type it manually.</Text>
        </View>

        {/* Postcode lookup */}
        <View style={{ gap: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.xs, alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <TextField label="Postcode" value={postcode} onChangeText={(v) => { setPostcode(v); setShowManual(false); }} autoFocus autoCapitalize="characters" placeholder="e.g. NE8 1ZE" onSubmitEditing={handlePostcodeLookup} />
            </View>
            <Button label="Find" variant="secondary" fullWidth={false} onPress={handlePostcodeLookup} loading={searching} disabled={!postcode.trim()} />
          </View>
          <Pressable accessibilityRole="button" onPress={() => setShowManual(true)}>
            <Text variant="footnote" color="accent">Enter address manually</Text>
          </Pressable>
        </View>

        {/* Address form */}
        {showManual ? (
          <View style={{ gap: theme.spacing.sm }}>
            <TextField label="Address" value={addressLine1} onChangeText={setAddressLine1} placeholder="e.g. 12 Elm Street" />
            <TextField label="City / town" value={city} onChangeText={setCity} />
            <TextField label="Postcode" value={selectedPostcode || postcode} onChangeText={setSelectedPostcode} autoCapitalize="characters" />
          </View>
        ) : null}

        {showManual ? (
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="footnote" color="textSecondary">Property type (optional)</Text>
            <ChipSelect options={PROPERTY_TYPES} value={propertyType} onChange={setPropertyType} />
          </View>
        ) : null}

        {error ? <Text variant="footnote" color="danger">{error}</Text> : null}

        {showManual ? (
          <Button label="Create property" size="lg" onPress={handleSave} loading={createProperty.isPending} disabled={!addressLine1.trim() || !household} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
