import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { Card, ListRow, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useProperties } from '@/src/hooks/useProperties';
import { useGlobalSearch, type SearchResult } from '@/src/hooks/useSearch';

function navigateToResult(result: SearchResult) {
  switch (result.type) {
    case 'asset':
      return router.push(`/asset/${result.id}`);
    case 'document':
      return router.push(`/document/${result.id}`);
    case 'room':
      return router.push(`/room/${result.id}`);
    case 'timeline':
      return router.push(`/timeline/${result.id}`);
    case 'contractor':
      return router.push(`/contractor/${result.id}`);
    default:
      return;
  }
}

const TYPE_LABELS: Record<string, string> = {
  asset: 'Item',
  document: 'Document',
  room: 'Room',
  timeline: 'Event',
  contractor: 'Contractor',
};

export default function SearchScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const { data: properties } = useProperties();
  const propertyIds = (properties ?? []).map((p) => p.id);
  const { data: results, isLoading } = useGlobalSearch(query, propertyIds);

  return (
    <Screen edges={['top']}>
      <View style={{ paddingVertical: theme.spacing.md, gap: theme.spacing.sm }}>
        <Text variant="largeTitle">Search</Text>
        <TextField
          placeholder="Search items, documents, rooms, contractors…"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoFocus
        />
      </View>

      {query.trim().length < 2 ? (
        <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xxl }}>
          <Ionicons name="search" size={40} color={theme.colors.border} />
          <Text variant="body" color="textTertiary" style={{ marginTop: theme.spacing.sm }}>
            Type at least 2 characters to search
          </Text>
        </View>
      ) : (
        <FlatList
          data={results ?? []}
          keyExtractor={(item, i) => `${item.type}-${item.id}-${i}`}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl }}
          ListEmptyComponent={
            !isLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xxl }}>
                <Text variant="body" color="textSecondary">
                  No results for &ldquo;{query}&rdquo;
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Card>
              <ListRow
                leading={<Text style={{ fontSize: 20, lineHeight: 24 }}>{item.icon}</Text>}
                title={item.title}
                subtitle={[TYPE_LABELS[item.type], item.subtitle].filter(Boolean).join(' · ')}
                showChevron
                onPress={() => navigateToResult(item)}
              />
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
