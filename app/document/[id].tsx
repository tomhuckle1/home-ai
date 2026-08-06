import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';

import { Badge, Button, ChipSelect, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useCreateAsset } from '@/src/hooks/useAssets';
import { useDeleteDocument, useDocument, useRequestExtraction, useUpdateDocument } from '@/src/hooks/useDocuments';
import { useSignedUrl } from '@/src/hooks/useSignedUrl';
import { DOCUMENT_TYPES } from '@/src/lib/asset-categories';
import { isWithinDeleteWindow } from '@/src/lib/deleteWindow';
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
        <TextField label="Document date (YYYY-MM-DD)" value={documentDate} onChangeText={setDocumentDate} />
        <TextField label="Expiry / warranty date (YYYY-MM-DD)" value={expiryDate} onChangeText={setExpiryDate} />
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

      {isWithinDeleteWindow(doc.created_at) ? (
        <Button label="Delete document" variant="danger" onPress={handleDelete} loading={deleteDocument.isPending} />
      ) : (
        <Text variant="footnote" color="textTertiary" style={{ textAlign: 'center' }}>
          This can no longer be deleted — it&apos;s past the 30-minute window for undoing a mistake.
        </Text>
      )}
    </View>
  );
}
