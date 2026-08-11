import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, View } from 'react-native';

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

type PostcodeSuggestion = { postcode: string };

export default function NewPropertyScreen() {
  const theme = useTheme();
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const { data: household } = useHousehold();
  const createProperty = useCreateProperty();

  const [postcode, setPostcode] = useState('');
  const [suggestions, setSuggestions] = useState<PostcodeSuggestion[]>([]);
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [finalPostcode, setFinalPostcode] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Autocomplete postcodes as user types
  const handlePostcodeChange = useCallback(async (text: string) => {
    setPostcode(text);
    if (text.trim().length < 2) { setSuggestions([]); return; }

    try {
      const resp = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(text.trim())}/autocomplete`);
      const data = await resp.json();
      if (data.status === 200 && data.result) {
        setSuggestions(data.result.map((pc: string) => ({ postcode: pc })));
      } else {
        setSuggestions([]);
      }
    } catch {
      setSuggestions([]);
    }
  }, []);

  async function handleSelectPostcode(pc: string) {
    setSearching(true);
    setSuggestions([]);
    setPostcode(pc);
    setFinalPostcode(pc);

    try {
      const resp = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`);
      const data = await resp.json();
      if (data.status === 200 && data.result) {
        setCity(data.result.admin_district || data.result.admin_ward || '');
      }
    } catch {}

    setShowForm(true);
    setSearching(false);
  }

  async function handleSave() {
    if (!household) return;
    setError(null);
    try {
      const property = await createProperty.mutateAsync({
        household_id: household.id,
        address_line1: addressLine1.trim(),
        city: city.trim() || null,
        postcode: finalPostcode.trim() || postcode.trim() || null,
        property_type: propertyType ?? null,
      });
      if (onboarding === '1') {
        router.replace({ pathname: '/onboarding-scan', params: { propertyId: property.id } });
      } else {
        router.replace('/(tabs)');
      }
    } catch (err) {
      setError(friendlyMessage(err, 'Could not save this property.'));
    }
  }

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
          <Image source={require('@/assets/images/logo.png')} style={{ width: 64, height: 64 }} resizeMode="contain" />
          <Text variant="title1" style={{ textAlign: 'center' }}>Where&apos;s home?</Text>
          <Text variant="body" color="textSecondary" style={{ textAlign: 'center' }}>Enter your postcode and we&apos;ll find your address.</Text>
        </View>

        {/* Postcode with autocomplete */}
        <View style={{ gap: theme.spacing.xs }}>
          <TextField label="Postcode" value={postcode} onChangeText={handlePostcodeChange} autoFocus autoCapitalize="characters" placeholder="Start typing your postcode…" returnKeyType="search" onSubmitEditing={() => { if (postcode.trim().length >= 5) handleSelectPostcode(postcode.trim().toUpperCase()); }} />

          {/* Autocomplete suggestions */}
          {suggestions.length > 0 ? (
            <View style={{ backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' }}>
              {suggestions.slice(0, 6).map((s) => (
                <Pressable key={s.postcode} accessibilityRole="button" onPress={() => handleSelectPostcode(s.postcode)}
                  style={({ pressed }) => ({ padding: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border, opacity: pressed ? 0.7 : 1 })}>
                  <Text variant="body">{s.postcode}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {!showForm ? (
            <Pressable accessibilityRole="button" onPress={() => setShowForm(true)}>
              <Text variant="footnote" color="accent">Enter address manually instead</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Address form */}
        {showForm ? (
          <>
            <View style={{ gap: theme.spacing.sm }}>
              <TextField label="Address" value={addressLine1} onChangeText={setAddressLine1} placeholder="e.g. 12 Elm Street" autoFocus={!addressLine1} />
              <TextField label="City / town" value={city} onChangeText={setCity} />
              {!finalPostcode ? <TextField label="Postcode" value={postcode} onChangeText={setPostcode} autoCapitalize="characters" /> : null}
            </View>

            <View style={{ gap: theme.spacing.xs }}>
              <Text variant="footnote" color="textSecondary">Property type (optional)</Text>
              <ChipSelect options={PROPERTY_TYPES} value={propertyType} onChange={setPropertyType} />
            </View>

            {error ? <Text variant="footnote" color="danger">{error}</Text> : null}

            <Button label="Create my home" size="lg" onPress={handleSave} loading={createProperty.isPending} disabled={!addressLine1.trim() || !household} />
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
