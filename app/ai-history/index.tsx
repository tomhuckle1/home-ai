import { router, useLocalSearchParams } from 'expo-router';
import { FlatList, View } from 'react-native';

import { Card, EmptyState, ListRow, Screen, Text, useTheme } from '@/src/design-system';
import { useAiConversations } from '@/src/hooks/useAiHistory';
import { useProperties } from '@/src/hooks/useProperties';

export default function AiHistoryScreen() {
  const theme = useTheme();
  const { data: properties } = useProperties();
  const property = properties?.[0];
  const { data: conversations, isLoading } = useAiConversations(property?.id);

  return (
    <Screen edges={['bottom']}>
      <View style={{ paddingVertical: theme.spacing.md }}>
        <Text variant="title1">Past conversations</Text>
      </View>

      <FlatList
        data={conversations ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl }}
        ListEmptyComponent={
          <EmptyState
            icon="💬"
            title="No conversations yet"
            description="Your AI conversations will appear here so you can pick up where you left off."
          />
        }
        renderItem={({ item }) => (
          <Card>
            <ListRow
              title={item.title || 'Untitled conversation'}
              subtitle={new Date(item.updated_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              showChevron
              onPress={() => router.push(`/ai-history/${item.id}`)}
            />
          </Card>
        )}
      />
    </Screen>
  );
}
