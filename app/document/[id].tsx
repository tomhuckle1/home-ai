import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';

import { Badge, Button, Card, ChipSelect, DateInput, ListRow, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useCreateAsset } from '@/src/hooks/useAssets';
import { useDeleteDocument, useDocument, useRequestExtraction, useUpdateDocument } from '@/src/hooks/useDocuments';
import { useAutoMatchAssets, useLinkDocumentPrimary, usePreviousDocument } from '@/src/hooks/useDocumentLinks';
import { useContractors } from '@/src/hooks/useContractors';
import { useAssetsByProperty } from '@/src/hooks/useAssets';
import { useSignedUrl } from '@/src/hooks/useSignedUrl';
import { DOCUMENT_TYPES } from '@/src/lib/asset-categories';
import type { DocumentRow, DocumentType } from '@/src/types/database';

const STUCK_AFTER_MS = 20000;

export default function DocumentReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data: doc } = useDocument(id);
  const { data: imageUrl } = useSignedUrl('documents', doc?.file_path);
  const requestExtraction = useRequestExtraction();
  const [stuck, setStuck] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);

  const isProcessing = doc?.extraction_status === 'pending' || doc?.extraction_status === 'processing';

  useEffect(() => {
    if (!isProcessing) {
      setStuck(false);
      return;
    }
    const timer = setTimeout(() => setStuck(true), STUCK_AFTER_MS);
    return () => clearTimeout(timer);
    // Restart the timer each time processing (re)starts, e.g. after "Try again".
  }, [isProcessing, doc?.updated_at]);

  if (!doc) {
    return (
      <Screen style={{ justifyContent: 'center' }}>
        <ActivityIndicator />
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ gap: theme.spacing.lg, paddingVertical: theme.spacing.lg }}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: theme.radius.lg }}
            contentFit="cover"
          />
        ) : null}

        {isProcessing && !manualOverride ? (
          <View style={{ gap: theme.spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
              <ActivityIndicator />
              <Text variant="body" color="textSecondary">
                Reading this photo…
              </Text>
            </View>
            {stuck ? (
              <View style={{ gap: theme.spacing.xs }}>
                <Text variant="footnote" color="textSecondary">
                  This is taking longer than usual.
                </Text>
                <Button
                  label="Try again"
                  variant="secondary"
                  onPress={() => {
                    setStuck(false);
                    requestExtraction.mutate(id);
                  }}
                  loading={requestExtraction.isPending}
                />
                <Button label="Enter details manually instead" variant="ghost" onPress={() => setManualOverride(true)} />
              </View>
            ) : null}
          </View>
        ) : (
          // Only mounts once extraction has finished (or the user opts out
          // of waiting), so its form state initializes from `doc` exactly
          // once with no effect needed.
          <DocumentReviewForm id={id} doc={doc} />
        )}
      </ScrollView>
    </Screen>
  );
}

function DocumentReviewForm({ id, doc }: { id: string; doc: DocumentRow }) {
  const theme = useTheme();
  const updateDocument = useUpdateDocument();
  const createAsset = useCreateAsset();
  const deleteDocument = useDeleteDocument();
  const linkDoc = useLinkDocumentPrimary();
  const { data: matchedAssets } = useAutoMatchAssets(doc.property_id, doc.brand, doc.model);
  const { data: allAssets } = useAssetsByProperty(doc.property_id);
  const { data: contractors } = useContractors(doc.property_id);
  const { data: previousDoc } = usePreviousDocument(doc.property_id, doc.document_type, id);
  const isRenewable = ['gas_safety_record', 'epc', 'insurance_policy', 'certificate'].includes(doc.document_type);

  const [documentType, setDocumentType] = useState<DocumentType>(doc.document_type);
  const [supplier, setSupplier] = useState(doc.supplier ?? '');
  const [productDescription, setProductDescription] = useState(doc.product_description ?? '');
  const [brand, setBrand] = useState(doc.brand ?? '');
  const [model, setModel] = useState(doc.model ?? '');
  const [amount, setAmount] = useState(doc.amount != null ? String(doc.amount) : '');
  const [documentDate, setDocumentDate] = useState(doc.document_date ?? '');
  const [expiryDate, setExpiryDate] = useState(doc.expiry_date ?? '');
  const [savedAsItem, setSavedAsItem] = useState(false);

  const canOfferAsAsset = !!doc.room_id && !doc.asset_id;

  async function handleConfirm() {
    const parsedAmount = amount.trim() ? Number(amount) : null;
    await updateDocument.mutateAsync({
      id,
      update: {
        document_type: documentType,
        supplier: supplier.trim() || null,
        product_description: productDescription.trim() || null,
        brand: brand.trim() || null,
        model: model.trim() || null,
        amount: parsedAmount != null && !Number.isNaN(parsedAmount) ? parsedAmount : null,
        document_date: documentDate.trim() || null,
        expiry_date: expiryDate.trim() || null,
        extraction_status: 'completed',
      },
    });
  }

  function handleDelete() {
    Alert.alert('Delete this document?', 'This removes it and its photo permanently. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteDocument.mutate(
            { id: doc.id, property_id: doc.property_id, file_path: doc.file_path },
            {
              onSuccess: () => router.back(),
              onError: (err) =>
                Alert.alert('Could not delete this document', err instanceof Error ? err.message : 'Please try again.'),
            },
          );
        },
      },
    ]);
  }

  async function handleSaveAsItem() {
    if (!doc.room_id) return;
    const asset = await createAsset.mutateAsync({
      property_id: doc.property_id,
      room_id: doc.room_id,
      name: productDescription.trim() || [brand, model].filter(Boolean).join(' ') || 'Untitled item',
      category: 'appliance',
      brand: brand.trim() || null,
      model: model.trim() || null,
      primary_photo_path: doc.file_path,
    });
    await updateDocument.mutateAsync({ id, update: { asset_id: asset.id } });
    setSavedAsItem(true);
  }

  return (
    <View style={{ gap: theme.spacing.lg }}>
      {doc.extraction_status === 'failed' ? (
        <View style={{ gap: theme.spacing.xxs }}>
          <Badge label="Automatic reading failed — fill in what you can" tone="warning" />
          {doc.extraction_error ? (
            <Text variant="footnote" color="textSecondary">
              {doc.extraction_error}
            </Text>
          ) : null}
        </View>
      ) : (
        <Badge label="Check these details before saving" tone="accent" />
      )}

      <View style={{ gap: theme.spacing.xs }}>
        <Text variant="footnote" color="textSecondary">
          Document type
        </Text>
        <ChipSelect
          options={DOCUMENT_TYPES}
          value={documentType}
          onChange={(value) => setDocumentType(value ?? 'other')}
          allowDeselect={false}
        />
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <TextField label="What is it" value={productDescription} onChangeText={setProductDescription} />
        <TextField label="Brand" value={brand} onChangeText={setBrand} />
        <TextField label="Model" value={model} onChangeText={setModel} />
        <TextField label="Supplier / retailer" value={supplier} onChangeText={setSupplier} />
        <TextField label="Amount (£)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
        <DateInput label="Document date" value={documentDate} onChange={setDocumentDate} />
        <DateInput label="Expiry / warranty date" value={expiryDate} onChange={setExpiryDate} />
      </View>

      <Button
        label={doc.extraction_status === 'completed' ? 'Save changes' : 'Confirm and save'}
        onPress={handleConfirm}
        loading={updateDocument.isPending}
      />

      {canOfferAsAsset && !savedAsItem ? (
        <Button
          label="Also save as an item in this room"
          variant="secondary"
          onPress={handleSaveAsItem}
          loading={createAsset.isPending}
        />
      ) : null}
      {savedAsItem ? (
        <Text variant="footnote" color="textSecondary">
          Saved as an item in this room.
        </Text>
      ) : null}

      {/* Auto-match: suggest linking to an existing item */}
      {!doc.asset_id && matchedAssets && matchedAssets.length > 0 ? (
        <Card>
          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="headline">Link to an existing item?</Text>
            <Text variant="footnote" color="textSecondary">
              We found items that might match this document.
            </Text>
            {matchedAssets.slice(0, 3).map((asset) => (
              <ListRow
                key={asset.id}
                title={asset.name}
                subtitle={[asset.brand, asset.model].filter(Boolean).join(' · ') || asset.category}
                showChevron
                onPress={() => linkDoc.mutate({ documentId: id, assetId: asset.id })}
              />
            ))}
          </View>
        </Card>
      ) : null}

      {/* Manual asset linking if no auto-match */}
      {!doc.asset_id && (!matchedAssets || matchedAssets.length === 0) && allAssets && allAssets.length > 0 ? (
        <Card>
          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="headline">Which item is this for?</Text>
            <Text variant="footnote" color="textSecondary">Link this document to an item, or leave it as a property document.</Text>
            {allAssets.slice(0, 8).map((asset) => (
              <ListRow
                key={asset.id}
                title={asset.name}
                subtitle={[asset.brand, asset.model].filter(Boolean).join(' · ') || asset.category}
                showChevron
                onPress={() => linkDoc.mutate({ documentId: id, assetId: asset.id })}
              />
            ))}
          </View>
        </Card>
      ) : null}

      {/* Contractor linking for invoices/receipts */}
      {!doc.contractor_id && contractors && contractors.length > 0 && ['invoice', 'receipt', 'certificate'].includes(doc.document_type) ? (
        <Card>
          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="headline">Who did this work?</Text>
            {contractors.slice(0, 8).map((contractor) => (
              <ListRow
                key={contractor.id}
                title={contractor.name}
                subtitle={contractor.trade ?? undefined}
                showChevron
                onPress={() => linkDoc.mutate({ documentId: id, contractorId: contractor.id })}
              />
            ))}
          </View>
        </Card>
      ) : null}

      {/* Renewable document: supersedes previous version */}
      {isRenewable && previousDoc && !doc.supersedes_id ? (
        <Card>
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="footnote" color="textSecondary">
              This appears to replace your previous {doc.document_type.replace(/_/g, ' ')} from {previousDoc.document_date || previousDoc.created_at.slice(0, 10)}.
            </Text>
            <Button
              label="Mark as replacement"
              variant="secondary"
              onPress={() => updateDocument.mutate({ id, update: { supersedes_id: previousDoc.id } })}
            />
          </View>
        </Card>
      ) : null}

      {true ? (
        <Button label="Delete document" variant="danger" onPress={handleDelete} loading={deleteDocument.isPending} />
      ) : (
        <Text variant="footnote" color="textTertiary" style={{ textAlign: 'center' }}>
          This can no longer be deleted — it&apos;s past the 30-minute window for undoing a mistake.
        </Text>
      )}
    </View>
  );
}
