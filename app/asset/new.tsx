import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button, ChipSelect, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useCreateAsset } from '@/src/hooks/useAssets';
import { ASSET_CATEGORIES } from '@/src/lib/asset-categories';
import type { AssetCategory } from '@/src/types/database';

export default function NewAssetScreen() {
  const { propertyId, roomId } = useLocalSearchParams<{ propertyId: string; roomId?: string }>();
  const theme = useTheme();
  const createAsset = useCreateAsset();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('appliance');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    try {
      const asset = await createAsset.mutateAsync({
        property_id: propertyId,
        room_id: roomId ?? null,
        name: name.trim(),
        category,
        brand: brand.trim() || null,
        model: model.trim() || null,
        serial_number: serialNumber.trim() || null,
      });
      router.replace(`/asset/${asset.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this item.');
    }
  }

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="footnote" color="textSecondary">
            Category
          </Text>
          <ChipSelect
            options={ASSET_CATEGORIES}
            value={category}
            onChange={(value) => setCategory(value ?? 'other')}
            allowDeselect={false}
          />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <TextField label="Name" value={name} onChangeText={setName} autoFocus placeholder="e.g. Dishwasher" />
          <TextField label="Brand" value={brand} onChangeText={setBrand} />
          <TextField label="Model" value={model} onChangeText={setModel} />
          <TextField label="Serial number" value={serialNumber} onChangeText={setSerialNumber} />
        </View>

        {error ? (
          <Text variant="footnote" color="danger">
            {error}
          </Text>
        ) : null}

        <Button label="Save item" onPress={handleSave} loading={createAsset.isPending} disabled={!name.trim()} />
      </ScrollView>
    </Screen>
  );
}
