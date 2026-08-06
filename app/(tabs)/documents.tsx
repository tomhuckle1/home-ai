import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';

import { Badge, Card, EmptyState, ListRow, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useAllDocuments } from '@/src/hooks/useDocuments';
import { useProperties } from '@/src/hooks/useProperties';
import type { DocumentRow, ExtractionStatus } from '@/src/types/database';

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

export default function DocumentsScreen() {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const { data: properties } = useProperties();
  const { data: documents, isLoading } = useAllDocuments(search);

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
      <View style={{ paddingVertical: theme.spacing.md, gap: theme.spacing.sm }}>
        <Text variant="largeTitle">Documents</Text>
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
          ListEmptyComponent={
            <EmptyState
              icon="📄"
              title={search ? 'No matches' : 'No documents yet'}
              description={
                search
                  ? 'Try a different search term.'
                  : 'Scan a receipt, manual, warranty or certificate from a property page to get started.'
              }
            />
          }
          renderItem={({ item }: { item: DocumentRow }) => (
            <Card>
              <ListRow
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
