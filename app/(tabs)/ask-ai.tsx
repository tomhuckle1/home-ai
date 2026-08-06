import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';

import { Badge, EmptyState, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useAskAi } from '@/src/hooks/useAiAssistant';
import { useProperties } from '@/src/hooks/useProperties';
import type { AiCitation } from '@/src/types/database';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: AiCitation[];
};

const EXAMPLE_QUESTIONS = [
  'Is my washing machine still under warranty?',
  'When was my boiler last serviced?',
  'Who installed my windows?',
];

export default function AskAiScreen() {
  const theme = useTheme();
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const property = properties?.[0];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [input, setInput] = useState('');
  const askAi = useAskAi();
  const listRef = useRef<FlatList<ChatMessage>>(null);

  async function handleAsk(question: string) {
    const trimmed = question.trim();
    if (!trimmed || !property) return;

    const userMessage: ChatMessage = { id: `local-${Date.now()}`, role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const result = await askAi.mutateAsync({ propertyId: property.id, question: trimmed, conversationId });
      setConversationId(result.conversationId);
      setMessages((prev) => [
        ...prev,
        { id: `local-${Date.now()}-a`, role: 'assistant', content: result.answer, citations: result.citations },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}-e`,
          role: 'assistant',
          content: err instanceof Error ? `Something went wrong: ${err.message}` : 'Something went wrong.',
        },
      ]);
    } finally {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }

  if (propertiesLoading) {
    return (
      <Screen edges={['top']} style={{ justifyContent: 'center' }}>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (!property) {
    return (
      <Screen edges={['top']} style={{ justifyContent: 'center' }}>
        <EmptyState
          icon="💬"
          title="Ask AI"
          description="Add your property and record a few things about it first — then you can ask questions about it here."
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} padded={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={{ paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm }}>
          <Text variant="largeTitle">Ask AI</Text>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            gap: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.lg,
            flexGrow: 1,
          }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing.md }}>
              <EmptyState
                icon="💬"
                title="Ask about your home"
                description="Answers come only from what you've recorded — with a source you can check."
              />
              <View style={{ gap: theme.spacing.xs }}>
                {EXAMPLE_QUESTIONS.map((q) => (
                  <Pressable
                    key={q}
                    accessibilityRole="button"
                    onPress={() => handleAsk(q)}
                    style={{
                      backgroundColor: theme.colors.surfaceAlt,
                      borderRadius: theme.radius.md,
                      padding: theme.spacing.sm,
                    }}
                  >
                    <Text variant="body">{q}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          }
          renderItem={({ item }) => <ChatBubble message={item} />}
          ListFooterComponent={
            askAi.isPending ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                <ActivityIndicator size="small" />
                <Text variant="footnote" color="textSecondary">
                  Thinking…
                </Text>
              </View>
            ) : null
          }
        />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: theme.spacing.xs,
            padding: theme.spacing.lg,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          }}
        >
          <View style={{ flex: 1 }}>
            <TextField
              placeholder="Ask a question…"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => handleAsk(input)}
              returnKeyType="send"
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            disabled={!input.trim() || askAi.isPending}
            onPress={() => handleAsk(input)}
            style={{
              backgroundColor: input.trim() ? theme.colors.accent : theme.colors.surfaceAlt,
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: input.trim() ? theme.colors.onAccent : theme.colors.textTertiary }}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const theme = useTheme();
  const isUser = message.role === 'user';

  return (
    <View style={{ alignItems: isUser ? 'flex-end' : 'flex-start', gap: theme.spacing.xxs }}>
      <View
        style={{
          maxWidth: '85%',
          backgroundColor: isUser ? theme.colors.accent : theme.colors.surfaceAlt,
          borderRadius: theme.radius.lg,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
        }}
      >
        <Text variant="body" style={{ color: isUser ? theme.colors.onAccent : theme.colors.textPrimary }}>
          {message.content}
        </Text>
      </View>
      {message.citations && message.citations.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xxs }}>
          {message.citations.map((citation) => (
            <Pressable
              key={`${citation.type}-${citation.id}`}
              accessibilityRole="button"
              onPress={() => router.push(citation.type === 'asset' ? `/asset/${citation.id}` : `/document/${citation.id}`)}
            >
              <Badge label={citation.label} tone="accent" />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
