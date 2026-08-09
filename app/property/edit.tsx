import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Button, ChipSelect, DateInput, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useProperty, useUpdateProperty } from '@/src/hooks/useProperty';
import { uploadPropertyImage } from '@/src/lib/storage';
import type { PropertyType, TenureType } from '@/src/types/database';

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'detached', label: 'Detached' }, { value: 'semi_detached', label: 'Semi-detached' },
  { value: 'terraced', label: 'Terraced' }, { value: 'flat', label: 'Flat' },
  { value: 'bungalow', label: 'Bungalow' }, { value: 'other', label: 'Other' },
];
const TENURE_TYPES: { value: TenureType; label: string }[] = [
  { value: 'freehold', label: 'Freehold' }, { value: 'leasehold', label: 'Leasehold' },
  { value: 'shared_ownership', label: 'Shared ownership' }, { value: 'unknown', label: 'Unknown' },
];

type PostcodeSuggestion = { postcode: string };

export default function EditPropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data: property } = useProperty(id);
  const updateProperty = useUpdateProperty();

  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType | undefined>();
  const [tenure, setTenure] = useState<TenureType | undefined>();
  const [yearBuilt, setYearBuilt] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [epcRating, setEpcRating] = useState('');
  const [epcExpiry, setEpcExpiry] = useState('');
  const [councilTaxBand, setCouncilTaxBand] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [suggestions, setSuggestions] = useState<PostcodeSuggestion[]>([]);

  // Sync form state when property data loads
  useEffect(() => {
    if (property && !loaded) {
      setAddressLine1(property.address_line1 ?? '');
      setAddressLine2(property.address_line2 ?? '');
      setCity(property.city ?? '');
      setPostcode(property.postcode ?? '');
      setPropertyType(property.property_type ?? undefined);
      setTenure(property.tenure ?? undefined);
      setYearBuilt(property.year_built ? String(property.year_built) : '');
      setBedrooms(property.bedrooms ? String(property.bedrooms) : '');
      setEpcRating(property.epc_rating ?? '');
      setEpcExpiry(property.epc_expiry ?? '');
      setCouncilTaxBand(property.council_tax_band ?? '');
      setPurchaseDate(property.purchase_date ?? '');
      setPurchasePrice(property.purchase_price ? String(property.purchase_price) : '');
      setLoaded(true);
    }
  }, [property, loaded]);

  const handleAddressAutocomplete = useCallback(async (text: string) => {
    setAddressLine1(text);
    // No API for street autocomplete on free tier — postcodes.io only does postcode autocomplete
  }, []);

  const handlePostcodeChange = useCallback(async (text: string) => {
    setPostcode(text);
    if (text.trim().length < 2) { setSuggestions([]); return; }
    try {
      const resp = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(text.trim())}/autocomplete`);
      const data = await resp.json();
      if (data.status === 200 && data.result) {
        setSuggestions(data.result.map((pc: string) => ({ postcode: pc })));
      } else { setSuggestions([]); }
    } catch { setSuggestions([]); }
  }, []);

  async function handleSelectPostcode(pc: string) {
    setSuggestions([]);
    setPostcode(pc);
    try {
      const resp = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`);
      const data = await resp.json();
      if (data.status === 200 && data.result) {
        setCity(data.result.admin_district || data.result.admin_ward || city);
      }
    } catch {}
  }

  async function handleSetCoverPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    setUploadingPhoto(true);
    try {
      const path = await uploadPropertyImage('property-photos', id, result.assets[0].uri);
      await updateProperty.mutateAsync({ id, update: { cover_photo_path: path } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload photo.');
    } finally { setUploadingPhoto(false); }
  }

  async function handleSave() {
    setError(null);
    try {
      await updateProperty.mutateAsync({
        id,
        update: {
          address_line1: addressLine1.trim(),
          address_line2: addressLine2.trim() || null,
          city: city.trim() || null,
          postcode: postcode.trim() || null,
          property_type: propertyType ?? null,
          tenure: tenure ?? null,
          year_built: yearBuilt.trim() ? Number(yearBuilt) : null,
          bedrooms: bedrooms.trim() ? Number(bedrooms) : null,
          epc_rating: epcRating.trim() || null,
          epc_expiry: epcExpiry.trim() || null,
          council_tax_band: councilTaxBand.trim() || null,
          purchase_date: purchaseDate.trim() || null,
          purchase_price: purchasePrice.trim() ? Number(purchasePrice) : null,
        },
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes.');
    }
  }

  if (!property) return null;

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }} keyboardShouldPersistTaps="handled">
        <Text variant="title1">Edit property</Text>

        <Button label={uploadingPhoto ? 'Uploading…' : property.cover_photo_path ? 'Change cover photo' : 'Set cover photo'} variant="secondary" onPress={handleSetCoverPhoto} loading={uploadingPhoto} />

        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="headline">Address</Text>
          <TextField label="Address line 1" value={addressLine1} onChangeText={handleAddressAutocomplete} />
          <TextField label="Address line 2" value={addressLine2} onChangeText={setAddressLine2} />
          <TextField label="City" value={city} onChangeText={setCity} />
          <View style={{ gap: theme.spacing.xs }}>
            <TextField label="Postcode" value={postcode} onChangeText={handlePostcodeChange} autoCapitalize="characters" />
            {suggestions.length > 0 ? (
              <View style={{ backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' }}>
                {suggestions.slice(0, 5).map((s) => (
                  <Pressable key={s.postcode} accessibilityRole="button" onPress={() => handleSelectPostcode(s.postcode)} style={({ pressed }) => ({ padding: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border, opacity: pressed ? 0.7 : 1 })}>
                    <Text variant="body">{s.postcode}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="headline">Property details</Text>
          <Text variant="footnote" color="textSecondary">Type</Text>
          <ChipSelect options={PROPERTY_TYPES} value={propertyType} onChange={setPropertyType} />
          <Text variant="footnote" color="textSecondary" style={{ marginTop: theme.spacing.xs }}>Tenure</Text>
          <ChipSelect options={TENURE_TYPES} value={tenure} onChange={setTenure} />
          <TextField label="Year built" value={yearBuilt} onChangeText={setYearBuilt} keyboardType="number-pad" />
          <TextField label="Bedrooms" value={bedrooms} onChangeText={setBedrooms} keyboardType="number-pad" />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="headline">Energy &amp; council tax</Text>
          <TextField label="EPC rating" value={epcRating} onChangeText={setEpcRating} placeholder="e.g. C" />
          <DateInput label="EPC expiry" value={epcExpiry} onChange={setEpcExpiry} />
          <TextField label="Council tax band" value={councilTaxBand} onChangeText={setCouncilTaxBand} placeholder="e.g. D" />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="headline">Purchase info</Text>
          <DateInput label="Purchase date" value={purchaseDate} onChange={setPurchaseDate} />
          <TextField label="Purchase price (£)" value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="decimal-pad" />
        </View>

        {error ? <Text variant="footnote" color="danger">{error}</Text> : null}
        <Button label="Save changes" onPress={handleSave} loading={updateProperty.isPending} disabled={!addressLine1.trim()} />
      </ScrollView>
    </Screen>
  );
}
