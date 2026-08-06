import { router, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, View } from 'react-native';

import { Badge, Button, Card, Screen, Text, useTheme } from '@/src/design-system';
import { useAsset, useDeleteAsset } from '@/src/hooks/useAssets';

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={{ gap: 2 }}>
      <Text variant="caption" color="textTertiary">
        {label.toUpperCase()}
      </Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}

export default function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data: asset } = useAsset(id);
  const deleteAsset = useDeleteAsset();

  if (!asset) return null;

  const warrantyActive = asset.warranty_expiry && new Date(asset.warranty_expiry) > new Date();

  function handleDelete() {
    if (!asset) return;
    Alert.alert(
      `Delete "${asset.name}"?`,
      'This removes the item and any maintenance reminders for it. Documents you scanned for it are kept. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteAsset.mutate(
              { id: asset.id, room_id: asset.room_id },
              {
                onSuccess: () => router.back(),
                onError: (err) =>
                  Alert.alert('Could not delete this item', err instanceof Error ? err.message : 'Please try again.'),
              },
            );
          },
        },
      ],
    );
  }

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.xxs }}>
          <Text variant="title1">{asset.name}</Text>
          {asset.warranty_expiry ? (
            <Badge
              label={warrantyActive ? `Under warranty until ${asset.warranty_expiry}` : 'Warranty expired'}
              tone={warrantyActive ? 'accent' : 'danger'}
            />
          ) : null}
        </View>

        <Card>
          <View style={{ gap: theme.spacing.sm }}>
            <Field label="Brand" value={asset.brand} />
            <Field label="Model" value={asset.model} />
            <Field label="Serial number" value={asset.serial_number} />
            <Field label="Retailer" value={asset.retailer} />
            <Field label="Purchase date" value={asset.purchase_date} />
            <Field label="Purchase price" value={asset.purchase_price ? `£${asset.purchase_price}` : null} />
            <Field label="Warranty provider" value={asset.warranty_provider} />
            <Field label="Notes" value={asset.notes} />
          </View>
        </Card>

        <Button label="Delete item" variant="danger" onPress={handleDelete} loading={deleteAsset.isPending} />
      </ScrollView>
    </Screen>
  );
}
