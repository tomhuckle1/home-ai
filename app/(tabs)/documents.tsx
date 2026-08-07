import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, View } from 'react-native';

import { Badge, Button, Card, EmptyState, ListRow, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useAllDocuments } from '@/src/hooks/useDocuments';
import { useProperties } from '@/src/hooks/useProperties';
import type { DocumentRow, DocumentType, ExtractionStatus, PropertyRow } from '@/src/types/database';

function statusBadge(status: ExtractionStatus) {
  switch (status) {
    case 'completed':
      return null;
    case 'failed':
      return <Badge label="Needs info" tone="warning" />;
    default:
      return <Badge label="Reading…" tone="neutral" />;
  }
}

function docIcon(type: DocumentType): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'receipt':
      return 'receipt-outline';
    case 'manual':
      return 'book-outline';
    case 'warranty':
      return 'shield-checkmark-outline';
    case 'certificate':
      return 'ribbon-outline';
    case 'invoice':
      return 'document-text-outline';
    case 'insurance_policy':
      return 'umbrella-outline';
    case 'epc':
      return 'leaf-outline';
    case 'gas_safety_record':
      return 'flame-outline';
    case 'mortgage_document':
      return 'home-outline';
    default:
      return 'document-outline';
  }
}

function startScan(properties: PropertyRow[]) {
  if (properties.length === 1) {
    router.push({ pathname: '/capture/scan', params: { propertyId: properties[0].id, mode: 'document' } });
    return;
  }
  Alert.alert('Scan for which property?', undefined, [
    ...properties.map((property) => ({
      text: property.address_line1,
      onPress: () => router.push({ pathname: '/capture/scan', params: { propertyId: property.id, mode: 'document' } }),
    })),
    { text: 'Cancel', style: 'cancel' as const },
  ]);
}

export default function DocumentsScreen() {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const { data: properties } = useProperties();
  const { data: documents, isLoading, refetch, isRefetching } = useAllDocuments(search);

  if (properties && properties.length === 0) {
    return (
      <Screen edges={['top']} style={{ justifyContent: 'center' }}>
        <EmptyState
          icon="📄"
          title="Documents"
          description="Add a property first, then scan receipts, manuals, warranties and certificates from its page."
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <View
        style={{
          paddingVertical: theme.spacing.md,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text variant="largeTitle">Documents</Text>
        {properties && properties.length > 0 ? (
          <Button label="Scan" variant="ghost" fullWidth={false} onPress={() => startScan(properties)} />
        ) : null}
      </View>
      <View style={{ paddingBottom: theme.spacing.sm }}>
        <TextField
          placeholder="Search by supplier, brand, product…"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={documents ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={theme.colors.accent}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="📄"
              title={search ? 'No matches' : 'No documents yet'}
              description={
                search ? 'Try a different search term.' : 'Scan a receipt, manual, warranty or certificate to get started.'
              }
              actionLabel={!search && properties && properties.length > 0 ? 'Scan a document' : undefined}
              onAction={!search && properties && properties.length > 0 ? () => startScan(properties) : undefined}
            />
          }
          renderItem={({ item }: { item: DocumentRow }) => (
            <Card>
              <ListRow
                leading={
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: theme.colors.surfaceAlt,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={docIcon(item.document_type)} size={18} color={theme.colors.textSecondary} />
                  </View>
                }
                title={item.product_description || item.original_filename || documentTypeLabel(item)}
                subtitle={item.supplier ?? documentTypeLabel(item)}
                trailing={statusBadge(item.extraction_status)}
                showChevron
                onPress={() => router.push(`/document/${item.id}`)}
              />
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

function documentTypeLabel(document: DocumentRow) {
  return document.document_type.replace(/_/g, ' ');
}
