import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button, ChipSelect, Screen, Text, DateInput, TextField, useTheme } from '@/src/design-system';
import { useCreateAsset } from '@/src/hooks/useAssets';
import { ASSET_CATEGORIES } from '@/src/lib/asset-categories';
import type { AssetCategory } from '@/src/types/database';

const STRUCTURAL_CATEGORIES: AssetCategory[] = ['structural', 'heating', 'plumbing', 'electrical'];

export default function NewAssetScreen() {
  const { propertyId, roomId } = useLocalSearchParams<{ propertyId: string; roomId?: string }>();
  const theme = useTheme();
  const createAsset = useCreateAsset();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('appliance');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  // Structural fields
  const [description, setDescription] = useState('');
  const [contractor, setContractor] = useState('');
  const [cost, setCost] = useState('');
  const [guaranteeExpiry, setGuaranteeExpiry] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isStructural = STRUCTURAL_CATEGORIES.includes(category);

  async function handleSave() {
    setError(null);
    try {
      const parsedCost = cost.trim() ? Number(cost) : null;
      const asset = await createAsset.mutateAsync({
        property_id: propertyId,
        room_id: roomId ?? null,
        name: name.trim(),
        category,
        brand: isStructural ? null : (brand.trim() || null),
        model: isStructural ? null : (model.trim() || null),
        serial_number: isStructural ? null : (serialNumber.trim() || null),
        notes: isStructural ? (description.trim() || null) : null,
        retailer: isStructural ? (contractor.trim() || null) : null,
        purchase_price: parsedCost && !Number.isNaN(parsedCost) ? parsedCost : null,
        warranty_expiry: isStructural ? (guaranteeExpiry.trim() || null) : null,
      });
      router.replace(`/asset/${asset.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    }
  }

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.xxs }}>
          <Text variant="title1">{isStructural ? 'Record work or structure' : 'Add an item'}</Text>
          <Text variant="body" color="textSecondary">
            {isStructural
              ? 'Record structural work, installations, or property-wide systems.'
              : 'Add an appliance, fixture, or piece of furniture.'}
          </Text>
        </View>

        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="footnote" color="textSecondary">Category</Text>
          <ChipSelect options={ASSET_CATEGORIES} value={category} onChange={(value) => setCategory(value ?? 'other')} allowDeselect={false} />
        </View>

        {isStructural ? (
          <View style={{ gap: theme.spacing.sm }}>
            <TextField label="What was done?" value={name} onChangeText={setName} autoFocus placeholder="e.g. Roof repair, Rewiring, Loft conversion" />
            <TextField label="Description (optional)" value={description} onChangeText={setDescription} multiline numberOfLines={2} placeholder="e.g. Full rewire of ground and first floor" />
            <TextField label="Contractor (optional)" value={contractor} onChangeText={setContractor} placeholder="e.g. Smith Roofing Ltd" />
            <TextField label="Cost (£, optional)" value={cost} onChangeText={setCost} keyboardType="decimal-pad" />
            <DateInput label="Guarantee expiry" value={guaranteeExpiry} onChange={setGuaranteeExpiry} />
          </View>
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            <TextField label="Name" value={name} onChangeText={setName} autoFocus placeholder="e.g. Dishwasher" />
            <TextField label="Brand" value={brand} onChangeText={setBrand} />
            <TextField label="Model" value={model} onChangeText={setModel} />
            <TextField label="Serial number" value={serialNumber} onChangeText={setSerialNumber} />
          </View>
        )}

        {error ? <Text variant="footnote" color="danger">{error}</Text> : null}

        <Button label={isStructural ? 'Save' : 'Save item'} onPress={handleSave} loading={createAsset.isPending} disabled={!name.trim()} />
      </ScrollView>
    </Screen>
  );
}
