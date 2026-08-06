// supabase.functions.invoke() gives back a generic FunctionsHttpError whose
// .message is just "Edge Function returned a non-2xx status code" — the
// actual reason our Edge Functions return (e.g. { error: 'premium_required',
// message: '...' }) is on the unread Response at error.context. This turns
// that back into something worth showing a user, and something calling
// code can branch on via `.code`.
import { FunctionsHttpError } from '@supabase/supabase-js';

export class EdgeFunctionError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'EdgeFunctionError';
    this.code = code;
  }
}

export async function toEdgeFunctionError(error: unknown): Promise<EdgeFunctionError> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await (error.context as Response).json();
      const code = typeof body?.error === 'string' ? body.error : undefined;
      const message = typeof body?.message === 'string' ? body.message : (code ?? 'Something went wrong. Please try again.');
      return new EdgeFunctionError(message, code);
    } catch {
      // Response wasn't JSON, or its body was already consumed — fall through.
    }
  }

  return new EdgeFunctionError(
    error instanceof Error && error.message ? error.message : 'Something went wrong. Please try again.',
  );
}
