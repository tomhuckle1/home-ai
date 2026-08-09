import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, View } from 'react-native';

import { Badge, Screen, Text, useTheme } from '@/src/design-system';
import { useAiMessages } from '@/src/hooks/useAiHistory';
import type { AiMessageRow } from '@/src/types/database';

export default function AiConversationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data: messages, isLoading } = useAiMessages(id);

  if (isLoading) {
    return (
      <Screen style={{ justifyContent: 'center' }}>
        <ActivityIndicator />
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <FlatList
        data={messages ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          gap: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.lg,
        }}
        renderItem={({ item }: { item: AiMessageRow }) => {
          const isUser = item.role === 'user';
          return (
            <View style={{ alignItems: isUser ? 'flex-end' : 'flex-start', gap: theme.spacing.xxs }}>
              <View
                style={{
                  maxWidth: '85%',
                  backgroundColor: isUser ? theme.colors.accent : theme.colors.surfaceAlt,
                  borderRadius: theme.radius.lg,
                  borderBottomRightRadius: isUser ? theme.radius.sm : theme.radius.lg,
                  borderBottomLeftRadius: isUser ? theme.radius.lg : theme.radius.sm,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                }}
              >
                <Text variant="body" style={{ color: isUser ? theme.colors.onAccent : theme.colors.textPrimary }}>
                  {item.content}
                </Text>
              </View>
              <Text variant="caption" color="textTertiary">
                {new Date(item.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
      />
    </Screen>
  );
}
