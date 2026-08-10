import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Badge, Button, Card, ListRow, Screen, SectionHeader, Text, useTheme } from '@/src/design-system';
import { useAsset, useDeleteAsset, useUpdateAsset } from '@/src/hooks/useAssets';
import { useContractorsByTrade } from '@/src/hooks/useContractors';
import { useDocumentsByAsset } from '@/src/hooks/useDocumentLinks';
import { useRooms } from '@/src/hooks/useRooms';
import { useSignedUrl } from '@/src/hooks/useSignedUrl';
import { ASSET_CATEGORIES } from '@/src/lib/asset-categories';
import type { DocumentRow, DocumentType } from '@/src/types/database';

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
  const map: Record<string, string> = { appliance: 'appliance repair', heating: 'heating engineer', plumbing: 'plumber', electrical: 'electrician', structural: 'builder', fixture: 'handyman', garden: 'gardener', security: 'security' };
  return map[category] ?? 'tradesman';
}

function docIcon(type: DocumentType): keyof typeof Ionicons.glyphMap {
  const map: Partial<Record<DocumentType, keyof typeof Ionicons.glyphMap>> = { receipt: 'receipt-outline', manual: 'book-outline', warranty: 'shield-checkmark-outline', certificate: 'ribbon-outline', invoice: 'document-text-outline' };
  return map[type] ?? 'document-outline';
}

export default function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data: asset } = useAsset(id);
  const deleteAsset = useDeleteAsset();
  const updateAsset = useUpdateAsset();
  const { data: imageUrl } = useSignedUrl('documents', asset?.primary_photo_path);
  const trade = asset ? tradeForCategory(asset.category) : undefined;
  const { data: savedContractors } = useContractorsByTrade(asset?.property_id, trade);
  const { data: linkedDocs } = useDocumentsByAsset(id);
  const [showQR, setShowQR] = useState(false);
  const { data: rooms } = useRooms(asset?.property_id);

  if (!asset) return null;

  const warrantyActive = asset.warranty_expiry && new Date(asset.warranty_expiry) > new Date();
  const categoryLabel = ASSET_CATEGORIES.find((c) => c.value === asset.category)?.label ?? asset.category;
  const isStructural = ['structural', 'heating', 'plumbing', 'electrical'].includes(asset.category);

  function handleDelete() {
    Alert.alert(`Delete "${asset!.name}"?`, 'This removes the item and any maintenance reminders for it.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteAsset.mutate({ id: asset!.id, room_id: asset!.room_id }, { onSuccess: () => router.back(), onError: (err) => Alert.alert('Error', err instanceof Error ? err.message : 'Please try again.') }); } },
    ]);
  }

  function handleMoveRoom(newRoomId: string | null) {
    updateAsset.mutate({ id, update: { room_id: newRoomId } }, { onError: (err) => Alert.alert('Error', err instanceof Error ? err.message : 'Please try again.') });
  }

  function handleShare() {
    const lines = [asset!.name, asset!.brand ? `Brand: ${asset!.brand}` : null, asset!.model ? `Model: ${asset!.model}` : null, asset!.serial_number ? `Serial: ${asset!.serial_number}` : null, asset!.warranty_expiry ? `Warranty: ${warrantyActive ? 'Active' : 'Expired'} (${asset!.warranty_expiry})` : null, asset!.purchase_date ? `Purchased: ${asset!.purchase_date}` : null, asset!.purchase_price ? `Price: £${asset!.purchase_price}` : null].filter(Boolean).join('\n');
    Sharing.shareAsync('data:text/plain,' + encodeURIComponent(lines), { mimeType: 'text/plain', dialogTitle: 'Share item details' }).catch(() => {});
  }

  function handleFindManual() {
    const query = [asset!.brand, asset!.model, 'user manual PDF'].filter(Boolean).join(' ');
    Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
  }

  function handleFixIt() {
    Linking.openURL(`https://www.google.com/maps/search/${encodeURIComponent([trade, 'near me'].filter(Boolean).join(' '))}`);
  }

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingVertical: theme.spacing.lg, gap: theme.spacing.lg }}>
        {imageUrl ? <Image source={{ uri: imageUrl }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: theme.radius.lg }} contentFit="cover" /> : null}

        <View style={{ gap: theme.spacing.xxs }}>
          <Text variant="title1">{asset.name}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            <Badge label={categoryLabel} tone="neutral" />
            {asset.status !== 'active' ? <Badge label={asset.status} tone="warning" /> : null}
            {asset.warranty_expiry ? <Badge label={warrantyActive ? 'Under warranty' : 'Warranty expired'} tone={warrantyActive ? 'accent' : 'danger'} /> : null}
          </View>
        </View>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
          <View style={{ flex: 1 }}><Button label="Edit" variant="secondary" onPress={() => router.push({ pathname: '/asset/edit', params: { id } })} /></View>
          <View style={{ flex: 1 }}><Button label="Share" variant="secondary" onPress={handleShare} /></View>
        </View>

        {/* Details */}
        <Card>
          <View style={{ gap: theme.spacing.sm }}>
            {isStructural ? (
              <>
                <Field label="Description" value={asset.notes} />
                <Field label="Contractor" value={asset.retailer} />
                <Field label="Cost" value={asset.purchase_price ? `£${asset.purchase_price}` : null} />
                <Field label="Date" value={asset.purchase_date} />
                <Field label="Guarantee expiry" value={asset.warranty_expiry} />
                <Field label="Guarantee provider" value={asset.warranty_provider} />
              </>
            ) : (
              <>
                <Field label="Brand" value={asset.brand} />
                <Field label="Model" value={asset.model} />
                <Field label="Serial number" value={asset.serial_number} />
                <Field label="Retailer" value={asset.retailer} />
                <Field label="Purchase date" value={asset.purchase_date} />
                <Field label="Purchase price" value={asset.purchase_price ? `£${asset.purchase_price}` : null} />
                <Field label="Warranty provider" value={asset.warranty_provider} />
                <Field label="Warranty expiry" value={asset.warranty_expiry} />
                {linkedDocs && linkedDocs.filter((d) => d.document_type === 'warranty').length > 1 ? (
                  <Text variant="caption" color="accent">Multiple warranty documents linked — check documents section below for extended warranties.</Text>
                ) : null}
                <Field label="Notes" value={asset.notes} />
              </>
            )}
          </View>
        </Card>

        {/* Linked documents */}
        {linkedDocs && linkedDocs.length > 0 ? (
          <View style={{ gap: theme.spacing.xs }}>
            <SectionHeader title={`Documents (${linkedDocs.length})`} />
            {linkedDocs.map((doc) => (
              <Card key={doc.id}>
                <ListRow
                  leading={<View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={docIcon(doc.document_type)} size={16} color={theme.colors.textSecondary} /></View>}
                  title={doc.product_description || doc.original_filename || doc.document_type.replace(/_/g, ' ')}
                  subtitle={[doc.supplier, doc.document_date].filter(Boolean).join(' · ') || undefined}
                  showChevron
                  onPress={() => router.push(`/document/${doc.id}`)}
                />
              </Card>
            ))}
          </View>
        ) : null}

        {/* Quick actions */}
        <View style={{ gap: theme.spacing.xs }}>
          <SectionHeader title="Actions" />
          <Card onPress={() => setShowQR(!showQR)}>
            <ListRow leading={<Ionicons name="qr-code-outline" size={20} color={theme.colors.accent} />} title={showQR ? "Hide QR code" : "Generate QR sticker"} subtitle="Stick on the appliance for quick access" showChevron />
          </Card>
          {showQR ? (
            <View style={{ alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.md, backgroundColor: '#FFFFFF', borderRadius: theme.radius.lg }}>
              <QRCode value={`homeai://asset/${id}`} size={180} />
              <Text variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>Print this and stick it on the appliance.{"\n"}Scan with your phone camera to open this item.</Text>
            </View>
          ) : null}
          {asset.brand || asset.model ? (
            <Card onPress={handleFindManual}>
              <ListRow leading={<Ionicons name="book-outline" size={20} color={theme.colors.accent} />} title="Find manual online" subtitle={`Search for ${[asset.brand, asset.model].filter(Boolean).join(' ')} manual`} showChevron />
            </Card>
          ) : null}
          <Card onPress={handleFixIt}>
            <ListRow leading={<Ionicons name="construct-outline" size={20} color={theme.colors.accent} />} title={`Find a ${trade}`} subtitle="Search for local tradespeople" showChevron />
          </Card>
          <Card onPress={() => router.push({ pathname: '/maintenance/new', params: { propertyId: asset.property_id, assetId: asset.id } })}>
            <ListRow leading={<Ionicons name="alarm-outline" size={20} color={theme.colors.accent} />} title="Set a reminder" subtitle="Schedule maintenance for this item" showChevron />
          </Card>
          {/* Move to another room */}
          {rooms && rooms.length > 1 ? (
            <Card onPress={() => {
              const options = [
                { text: 'Property level (no room)', onPress: () => handleMoveRoom(null) },
                ...(rooms ?? []).filter((r) => r.id !== asset.room_id).map((r) => ({ text: r.name, onPress: () => handleMoveRoom(r.id) })),
                { text: 'Cancel', style: 'cancel' as const },
              ];
              Alert.alert('Move to which room?', undefined, options);
            }}>
              <ListRow leading={<Ionicons name="swap-horizontal-outline" size={20} color={theme.colors.accent} />} title="Move to another room" showChevron />
            </Card>
          ) : null}
        </View>

        {/* Saved contractors */}
        {savedContractors && savedContractors.length > 0 ? (
          <View style={{ gap: theme.spacing.xs }}>
            <SectionHeader title="Your tradespeople" />
            {savedContractors.map((c) => (
              <Card key={c.id}><ListRow title={c.name} subtitle={[c.trade, c.phone].filter(Boolean).join(' · ') || undefined} showChevron onPress={() => router.push(`/contractor/${c.id}`)} /></Card>
            ))}
          </View>
        ) : null}

        {/* Delete */}
        {true ? (
          <Button label="Delete item" variant="danger" onPress={handleDelete} loading={deleteAsset.isPending} />
        ) : (
          <Text variant="footnote" color="textTertiary" style={{ textAlign: 'center' }}></Text>
        )}
      </ScrollView>
    </Screen>
  );
}
