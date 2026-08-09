import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button, ChipSelect, DateInput, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useProperty, useUpdateProperty } from '@/src/hooks/useProperty';
import { uploadPropertyImage } from '@/src/lib/storage';
import type { PropertyType, TenureType } from '@/src/types/database';

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'detached', label: 'Detached' },
  { value: 'semi_detached', label: 'Semi-detached' },
  { value: 'terraced', label: 'Terraced' },
  { value: 'flat', label: 'Flat' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'other', label: 'Other' },
];

const TENURE_TYPES: { value: TenureType; label: string }[] = [
  { value: 'freehold', label: 'Freehold' },
  { value: 'leasehold', label: 'Leasehold' },
  { value: 'shared_ownership', label: 'Shared ownership' },
  { value: 'unknown', label: 'Unknown' },
];

export default function EditPropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data: property } = useProperty(id);
  const updateProperty = useUpdateProperty();

  const [addressLine1, setAddressLine1] = useState(property?.address_line1 ?? '');
  const [addressLine2, setAddressLine2] = useState(property?.address_line2 ?? '');
  const [city, setCity] = useState(property?.city ?? '');
  const [postcode, setPostcode] = useState(property?.postcode ?? '');
  const [propertyType, setPropertyType] = useState<PropertyType | undefined>(property?.property_type ?? undefined);
  const [tenure, setTenure] = useState<TenureType | undefined>(property?.tenure ?? undefined);
  const [yearBuilt, setYearBuilt] = useState(property?.year_built ? String(property.year_built) : '');
  const [bedrooms, setBedrooms] = useState(property?.bedrooms ? String(property.bedrooms) : '');
  const [epcRating, setEpcRating] = useState(property?.epc_rating ?? '');
  const [epcExpiry, setEpcExpiry] = useState(property?.epc_expiry ?? '');
  const [councilTaxBand, setCouncilTaxBand] = useState(property?.council_tax_band ?? '');
  const [purchaseDate, setPurchaseDate] = useState(property?.purchase_date ?? '');
  const [purchasePrice, setPurchasePrice] = useState(property?.purchase_price ? String(property.purchase_price) : '');
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  async function handleSetCoverPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    setUploadingPhoto(true);
    try {
      const path = await uploadPropertyImage('property-photos', id, result.assets[0].uri);
      await updateProperty.mutateAsync({ id, update: { cover_photo_path: path } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave() {
    setError(null);
    try {
      const parsedYear = yearBuilt.trim() ? Number(yearBuilt) : null;
      const parsedBedrooms = bedrooms.trim() ? Number(bedrooms) : null;
      const parsedPrice = purchasePrice.trim() ? Number(purchasePrice) : null;

      await updateProperty.mutateAsync({
        id,
        update: {
          address_line1: addressLine1.trim(),
          address_line2: addressLine2.trim() || null,
          city: city.trim() || null,
          postcode: postcode.trim() || null,
          property_type: propertyType ?? null,
          tenure: tenure ?? null,
          year_built: parsedYear && !Number.isNaN(parsedYear) ? parsedYear : null,
          bedrooms: parsedBedrooms && !Number.isNaN(parsedBedrooms) ? parsedBedrooms : null,
          epc_rating: epcRating.trim() || null,
          epc_expiry: epcExpiry.trim() || null,
          council_tax_band: councilTaxBand.trim() || null,
          purchase_date: purchaseDate.trim() || null,
          purchase_price: parsedPrice && !Number.isNaN(parsedPrice) ? parsedPrice : null,
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
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        <Text variant="title1">Edit property</Text>

        <Button
          label={uploadingPhoto ? 'Uploading…' : property.cover_photo_path ? 'Change cover photo' : 'Set cover photo'}
          variant="secondary"
          onPress={handleSetCoverPhoto}
          loading={uploadingPhoto}
        />

        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="headline">Address</Text>
          <TextField label="Address line 1" value={addressLine1} onChangeText={setAddressLine1} />
          <TextField label="Address line 2" value={addressLine2} onChangeText={setAddressLine2} />
          <TextField label="City" value={city} onChangeText={setCity} />
          <TextField label="Postcode" value={postcode} onChangeText={setPostcode} autoCapitalize="characters" />
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
