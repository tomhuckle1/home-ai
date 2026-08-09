import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Badge, Button, Card, EmptyState, Screen, Text, TextField, useTheme } from '@/src/design-system';
import { useAskAi } from '@/src/hooks/useAiAssistant';
import { useProperties } from '@/src/hooks/useProperties';
import { EdgeFunctionError } from '@/src/lib/functionError';
import type { AiCitation } from '@/src/types/database';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: AiCitation[];
  premiumRequired?: boolean;
  timestamp: Date;
};

const EXAMPLE_QUESTIONS = [
  { icon: 'shield-checkmark-outline' as const, text: 'Is my washing machine still under warranty?' },
  { icon: 'flame-outline' as const, text: 'When was my boiler last serviced?' },
  { icon: 'construct-outline' as const, text: 'Who installed my windows?' },
  { icon: 'cash-outline' as const, text: 'How much have I spent on repairs?' },
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

    const userMessage: ChatMessage = { id: `local-${Date.now()}`, role: 'user', content: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const result = await askAi.mutateAsync({ propertyId: property.id, question: trimmed, conversationId });
      setConversationId(result.conversationId);
      setMessages((prev) => [...prev, { id: `local-${Date.now()}-a`, role: 'assistant', content: result.answer, citations: result.citations, timestamp: new Date() }]);
    } catch (err) {
      const isPremiumRequired = err instanceof EdgeFunctionError && err.code === 'premium_required';
      setMessages((prev) => [...prev, { id: `local-${Date.now()}-e`, role: 'assistant', content: err instanceof Error ? err.message : 'Something went wrong.', premiumRequired: isPremiumRequired, timestamp: new Date() }]);
    } finally {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }

  if (propertiesLoading) {
    return (<Screen edges={['top']} style={{ justifyContent: 'center' }}><ActivityIndicator /></Screen>);
  }

  if (!property) {
    return (<Screen edges={['top']} style={{ justifyContent: 'center' }}><EmptyState icon="💬" title="Ask AI" description="Add your property and record a few things first." /></Screen>);
  }

  return (
    <Screen edges={['top']} padded={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View style={{ paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text variant="largeTitle">Ask AI</Text>
            <Text variant="footnote" color="textSecondary" style={{ marginTop: 2 }}>Answers only from what you&apos;ve recorded</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Past conversations" onPress={() => router.push('/ai-history')}>
            <Ionicons name="time-outline" size={22} color={theme.colors.textSecondary} />
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg, flexGrow: 1 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={<WelcomeState onAsk={handleAsk} />}
          renderItem={({ item }) => <ChatBubble message={item} />}
          ListFooterComponent={askAi.isPending ? <TypingIndicator /> : null}
        />

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing.xs, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.background }}>
          <View style={{ flex: 1 }}>
            <TextField placeholder="Ask a question…" value={input} onChangeText={setInput} onSubmitEditing={() => handleAsk(input)} returnKeyType="send" />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            disabled={!input.trim() || askAi.isPending}
            onPress={() => handleAsk(input)}
            style={{ backgroundColor: input.trim() ? theme.colors.accent : theme.colors.surfaceAlt, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-up" size={20} color={input.trim() ? theme.colors.onAccent : theme.colors.textTertiary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function WelcomeState({ onAsk }: { onAsk: (q: string) => void }) {
  const theme = useTheme();
  return (
    <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1, justifyContent: 'center', gap: theme.spacing.lg }}>
      <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.accentMuted, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chatbubble-ellipses" size={28} color={theme.colors.accent} />
        </View>
        <Text variant="title2" style={{ textAlign: 'center' }}>Ask about your home</Text>
        <Text variant="body" color="textSecondary" style={{ textAlign: 'center' }}>Every answer comes with a source you can check</Text>
      </View>
      <View style={{ gap: theme.spacing.xs }}>
        <Text variant="caption" color="textTertiary" style={{ marginBottom: 2 }}>TRY ASKING</Text>
        {EXAMPLE_QUESTIONS.map((q) => (
          <Pressable
            key={q.text}
            accessibilityRole="button"
            onPress={() => onAsk(q.text)}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.sm, opacity: pressed ? 0.7 : 1 })}
          >
            <Ionicons name={q.icon} size={18} color={theme.colors.accent} />
            <Text variant="body" style={{ flex: 1 }}>{q.text}</Text>
            <Ionicons name="arrow-forward" size={14} color={theme.colors.textTertiary} />
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}

function TypingIndicator() {
  const theme = useTheme();
  const [dots, setDots] = useState(1);
  useEffect(() => { const i = setInterval(() => setDots((d) => (d % 3) + 1), 500); return () => clearInterval(i); }, []);
  return (
    <Animated.View entering={FadeInDown.duration(200)}>
      <View style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.lg, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs }}>
        <Text variant="body" color="textSecondary">{'•'.repeat(dots)}</Text>
      </View>
    </Animated.View>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const theme = useTheme();
  const isUser = message.role === 'user';

  if (message.premiumRequired) {
    return (
      <Animated.View entering={FadeInDown.duration(300)} style={{ alignItems: 'flex-start', maxWidth: '90%' }}>
        <Card><View style={{ gap: theme.spacing.sm }}>
          <Text variant="body">{message.content}</Text>
          <Button label="Upgrade to Premium" size="md" fullWidth={false} onPress={() => router.push('/subscription/paywall')} />
        </View></Card>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.duration(200)} style={{ alignItems: isUser ? 'flex-end' : 'flex-start', gap: theme.spacing.xxs }}>
      <View style={{ maxWidth: '85%', backgroundColor: isUser ? theme.colors.accent : theme.colors.surfaceAlt, borderRadius: theme.radius.lg, borderBottomRightRadius: isUser ? theme.radius.sm : theme.radius.lg, borderBottomLeftRadius: isUser ? theme.radius.lg : theme.radius.sm, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs }}>
        <Text variant="body" style={{ color: isUser ? theme.colors.onAccent : theme.colors.textPrimary }}>{message.content}</Text>
      </View>
      {message.citations && message.citations.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xxs }}>
          {message.citations.map((c) => (
            <Pressable key={`${c.type}-${c.id}`} accessibilityRole="button" onPress={() => {
              if (c.type === 'asset') router.push(`/asset/${c.id}`);
              else if (c.type === 'document') router.push(`/document/${c.id}`);
              else router.push(`/timeline/${c.id}`);
            }}>
              <Badge label={c.label} tone="accent" />
            </Pressable>
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}
