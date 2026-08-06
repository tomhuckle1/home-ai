import { useMutation } from '@tanstack/react-query';

import { AnalyticsEvent, track } from '@/src/lib/analytics';
import { supabase } from '@/src/lib/supabase';
import type { AiCitation } from '@/src/types/database';

export type AskAiInput = {
  propertyId: string;
  question: string;
  conversationId?: string;
};

export type AskAiResult = {
  conversationId: string;
  answer: string;
  citations: AiCitation[];
};

export function useAskAi() {
  return useMutation({
    mutationFn: async (input: AskAiInput): Promise<AskAiResult> => {
      const { data, error } = await supabase.functions.invoke('ai-assistant', { body: input });
      if (error) throw error;
      return data as AskAiResult;
    },
    onSuccess: () => track(AnalyticsEvent.AiQuestionAsked),
  });
}
