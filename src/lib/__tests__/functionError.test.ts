import { FunctionsHttpError } from '@supabase/supabase-js';

import { toEdgeFunctionError } from '@/src/lib/functionError';

function mockHttpError(body: unknown, { textThrows = false }: { textThrows?: boolean } = {}) {
  const context = {
    text: async () => {
      if (textThrows) throw new Error('body already consumed');
      return JSON.stringify(body);
    },
  };
  return new FunctionsHttpError(context as unknown as Response);
}

describe('toEdgeFunctionError', () => {
  it('extracts a specific message from the Edge Function body', async () => {
    const result = await toEdgeFunctionError(mockHttpError({ error: "OPENAI_API_KEY is not configured for this Supabase project" }));
    expect(result.message).toBe("OPENAI_API_KEY is not configured for this Supabase project");
  });

  it('prefers an explicit message field over the error/code field', async () => {
    const result = await toEdgeFunctionError(mockHttpError({ error: 'premium_required', message: 'Upgrade to ask more questions.' }));
    expect(result.message).toBe('Upgrade to ask more questions.');
    expect(result.code).toBe('premium_required');
  });

  it('falls back to a generic message when the body cannot be read', async () => {
    const result = await toEdgeFunctionError(mockHttpError({}, { textThrows: true }));
    expect(result.message).toBe('Something went wrong. Please try again.');
    expect(result.code).toBeUndefined();
  });

  it('falls back to a generic message when the body is not JSON', async () => {
    const context = { text: async () => 'Internal Server Error' };
    const error = new FunctionsHttpError(context as unknown as Response);
    const result = await toEdgeFunctionError(error);
    expect(result.message).toBe('Something went wrong. Please try again.');
    expect(result.code).toBeUndefined();
  });

  it('passes through a plain Error message for non-HTTP errors', async () => {
    const result = await toEdgeFunctionError(new Error('Network request failed'));
    expect(result.message).toBe('Network request failed');
  });
});
