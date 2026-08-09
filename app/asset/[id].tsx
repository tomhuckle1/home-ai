import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, View } from 'react-native';

import { Badge, Button, Card, ListRow, Screen, SectionHeader, Text, useTheme } from '@/src/design-system';
import { useAsset, useDeleteAsset } from '@/src/hooks/useAssets';
import { useContractorsByTrade } from '@/src/hooks/useContractors';
import { useSignedUrl } from '@/src/hooks/useSignedUrl';
import { isWithinDeleteWindow } from '@/src/lib/deleteWindow';
import { ASSET_CATEGORIES } from '@/src/lib/asset-categories';

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={{ gap: 2 }}>
      <Text variant="caption" color="textTertiary">{label.toUpperCase()}</Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}

function tradeForCategory(category: string): string {
  const map: Record<string, string> = {
    appliance: 'appliance repair',
    heating: 'heating engineer',
    plumbing: 'plumber',
    electrical: 'electrician',
    structural: 'builder',
    fixture: 'handyman',
    garden: 'gardener',
    security: 'security',
  };
  return map[category] ?? 'tradesman';
}

export default function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data: asset } = useAsset(id);
  const deleteAsset = useDeleteAsset();
  const { data: imageUrl } = useSignedUrl('documents', asset?.primary_photo_path);
  const trade = asset ? tradeForCategory(asset.category) : undefined;
  const { data: savedContractors } = useContractorsByTrade(asset?.property_id, trade);

  if (!asset) return null;

  const warrantyActive = asset.warranty_expiry && new Date(asset.warranty_expiry) > new Date();
  const categoryLabel = ASSET_CATEGORIES.find((c) => c.value === asset.category)?.label ?? asset.category;

  function handleDelete() {
    Alert.alert(`Delete "${asset!.name}"?`, 'This removes the item and any maintenance reminders for it. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteAsset.mutate({ id: asset!.id, room_id: asset!.room_id }, {
            onSuccess: () => router.back(),
            onError: (err) => Alert.alert('Error', err instanceof Error ? err.message : 'Please try again.'),
          });
        },
      },
    ]);
  }

  function handleShare() {
    const lines = [
      asset!.name,
      asset!.brand ? `Brand: ${asset!.brand}` : null,
      asset!.model ? `Model: ${asset!.model}` : null,
      asset!.serial_number ? `Serial: ${asset!.serial_number}` : null,
      asset!.warranty_expiry ? `Warranty: ${warrantyActive ? 'Active' : 'Expired'} (${asset!.warranty_expiry})` : null,
      asset!.purchase_date ? `Purchased: ${asset!.purchase_date}` : null,
      asset!.purchase_price ? `Price: £${asset!.purchase_price}` : null,
    ].filter(Boolean).join('\n');
    Sharing.shareAsync('data:text/plain,' + encodeURIComponent(lines), { mimeType: 'text/plain', dialogTitle: 'Share item details' }).catch(() => {});
  }

  function handleFindManual() {
    const query = [asset!.brand, asset!.model, 'user manual PDF'].filter(Boolean).join(' ');
    Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
  }

  function handleFixIt() {
    const query = [trade, 'near me'].filter(Boolean).join(' ');
    Linking.openURL(`https://www.google.com/maps/search/${encodeURIComponent(query)}`);
  }

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: theme.radius.lg }} contentFit="cover" />
        ) : null}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: theme.spacing.xxs }}>
            <Text variant="title1">{asset.name}</Text>
            <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
              <Badge label={categoryLabel} tone="neutral" />
              {asset.status !== 'active' ? <Badge label={asset.status} tone="warning" /> : null}
              {asset.warranty_expiry ? (
                <Badge label={warrantyActive ? 'Under warranty' : 'Warranty expired'} tone={warrantyActive ? 'accent' : 'danger'} />
              ) : null}
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
          <View style={{ flex: 1 }}>
            <Button label="Edit" variant="secondary" onPress={() => router.push({ pathname: '/asset/edit', params: { id } })} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Share" variant="secondary" onPress={handleShare} />
          </View>
        </View>

        {/* Details */}
        <Card>
          <View style={{ gap: theme.spacing.sm }}>
            <Field label="Brand" value={asset.brand} />
            <Field label="Model" value={asset.model} />
            <Field label="Serial number" value={asset.serial_number} />
            <Field label="Retailer" value={asset.retailer} />
            <Field label="Purchase date" value={asset.purchase_date} />
            <Field label="Purchase price" value={asset.purchase_price ? `£${asset.purchase_price}` : null} />
            <Field label="Warranty provider" value={asset.warranty_provider} />
            <Field label="Warranty expiry" value={asset.warranty_expiry} />
            <Field label="Notes" value={asset.notes} />
          </View>
        </Card>

        {/* AI actions */}
        <View style={{ gap: theme.spacing.xs }}>
          <SectionHeader title="Actions" />
          {asset.brand || asset.model ? (
            <Card onPress={handleFindManual}>
              <ListRow
                leading={<Ionicons name="book-outline" size={20} color={theme.colors.accent} />}
                title="Find manual online"
                subtitle={`Search for ${[asset.brand, asset.model].filter(Boolean).join(' ')} manual`}
                showChevron
              />
            </Card>
          ) : null}
          <Card onPress={handleFixIt}>
            <ListRow
              leading={<Ionicons name="construct-outline" size={20} color={theme.colors.accent} />}
              title={`Find a ${trade}`}
              subtitle="Search for local tradespeople"
              showChevron
            />
          </Card>
          <Card onPress={() => router.push({ pathname: '/maintenance/new', params: { propertyId: asset.property_id, assetId: asset.id } })}>
            <ListRow
              leading={<Ionicons name="alarm-outline" size={20} color={theme.colors.accent} />}
              title="Set a reminder"
              subtitle="Schedule maintenance for this item"
              showChevron
            />
          </Card>
        </View>

        {/* Saved contractors for this trade */}
        {savedContractors && savedContractors.length > 0 ? (
          <View style={{ gap: theme.spacing.xs }}>
            <SectionHeader title="Your tradespeople" />
            {savedContractors.map((c) => (
              <Card key={c.id}>
                <ListRow title={c.name} subtitle={[c.trade, c.phone].filter(Boolean).join(' · ') || undefined} showChevron onPress={() => router.push(`/contractor/${c.id}`)} />
              </Card>
            ))}
          </View>
        ) : null}

        {/* Delete */}
        {isWithinDeleteWindow(asset.created_at) ? (
          <Button label="Delete item" variant="danger" onPress={handleDelete} loading={deleteAsset.isPending} />
        ) : (
          <Text variant="footnote" color="textTertiary" style={{ textAlign: 'center' }}>
            This can no longer be deleted — it&apos;s past the 30-minute window.
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}
