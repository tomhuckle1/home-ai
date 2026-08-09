import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import type { AiConversationRow, AiMessageRow } from '@/src/types/database';

export function useAiConversations(propertyId: string | undefined) {
  return useQuery<AiConversationRow[]>({
    queryKey: ['ai-conversations', propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('property_id', propertyId!)
        .order('updated_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
}

export function useAiMessages(conversationId: string | undefined) {
  return useQuery<AiMessageRow[]>({
    queryKey: ['ai-messages', conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}
