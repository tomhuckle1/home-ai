import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Button, ChipSelect, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useAsset, useUpdateAsset } from '@/src/hooks/useAssets';
import { ASSET_CATEGORIES } from '@/src/lib/asset-categories';
import type { AssetCategory, AssetStatus } from '@/src/types/database';

const STATUS_OPTIONS: { value: AssetStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'replaced', label: 'Replaced' },
  { value: 'removed', label: 'Removed' },
];

export default function EditAssetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data: asset } = useAsset(id);
  const updateAsset = useUpdateAsset();

  const [name, setName] = useState(asset?.name ?? '');
  const [category, setCategory] = useState<AssetCategory>(asset?.category ?? 'appliance');
  const [brand, setBrand] = useState(asset?.brand ?? '');
  const [model, setModel] = useState(asset?.model ?? '');
  const [serialNumber, setSerialNumber] = useState(asset?.serial_number ?? '');
  const [retailer, setRetailer] = useState(asset?.retailer ?? '');
  const [purchaseDate, setPurchaseDate] = useState(asset?.purchase_date ?? '');
  const [purchasePrice, setPurchasePrice] = useState(asset?.purchase_price ? String(asset.purchase_price) : '');
  const [warrantyExpiry, setWarrantyExpiry] = useState(asset?.warranty_expiry ?? '');
  const [warrantyProvider, setWarrantyProvider] = useState(asset?.warranty_provider ?? '');
  const [notes, setNotes] = useState(asset?.notes ?? '');
  const [status, setStatus] = useState<AssetStatus>(asset?.status ?? 'active');
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    try {
      const parsedPrice = purchasePrice.trim() ? Number(purchasePrice) : null;
      await updateAsset.mutateAsync({
        id,
        update: {
          name: name.trim(),
          category,
          brand: brand.trim() || null,
          model: model.trim() || null,
          serial_number: serialNumber.trim() || null,
          retailer: retailer.trim() || null,
          purchase_date: purchaseDate.trim() || null,
          purchase_price: parsedPrice != null && !Number.isNaN(parsedPrice) ? parsedPrice : null,
          warranty_expiry: warrantyExpiry.trim() || null,
          warranty_provider: warrantyProvider.trim() || null,
          notes: notes.trim() || null,
          status,
        },
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes.');
    }
  }

  if (!asset) return null;

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        <Text variant="title1">Edit item</Text>

        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="footnote" color="textSecondary">Category</Text>
          <ChipSelect
            options={ASSET_CATEGORIES}
            value={category}
            onChange={(v) => setCategory(v ?? 'other')}
            allowDeselect={false}
          />
        </View>

        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="footnote" color="textSecondary">Status</Text>
          <ChipSelect
            options={STATUS_OPTIONS}
            value={status}
            onChange={(v) => setStatus(v ?? 'active')}
            allowDeselect={false}
          />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <TextField label="Name" value={name} onChangeText={setName} />
          <TextField label="Brand" value={brand} onChangeText={setBrand} />
          <TextField label="Model" value={model} onChangeText={setModel} />
          <TextField label="Serial number" value={serialNumber} onChangeText={setSerialNumber} />
          <TextField label="Retailer" value={retailer} onChangeText={setRetailer} />
          <DateInput label="Purchase date" value={purchaseDate} onChange={setPurchaseDate} />
          <TextField label="Purchase price (£)" value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="decimal-pad" />
          <DateInput label="Warranty expiry" value={warrantyExpiry} onChange={setWarrantyExpiry} />
          <TextField label="Warranty provider" value={warrantyProvider} onChangeText={setWarrantyProvider} />
          <TextField label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
        </View>

        {error ? <Text variant="footnote" color="danger">{error}</Text> : null}

        <Button label="Save changes" onPress={handleSave} loading={updateAsset.isPending} disabled={!name.trim()} />
      </ScrollView>
    </Screen>
  );
}
