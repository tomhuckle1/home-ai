// supabase.functions.invoke() gives back a generic FunctionsHttpError whose
// .message is just "Edge Function returned a non-2xx status code" — the
// actual reason our Edge Functions return (e.g. { error: 'premium_required',
// message: '...' }) is on the unread Response at error.context. This turns
// that back into something worth showing a user, and something calling
// code can branch on via `.code`.
//
// Reads the body via .text() + JSON.parse rather than .json() directly —
// React Native's fetch (CFNetwork on iOS) has been observed to throw on a
// direct .json() call in cases where .text() on the same body succeeds,
// which was silently losing every real error detail behind the generic
// fallback message on-device (though not in Expo Go on web/simulator,
// where .json() behaves normally — which is why this went unnoticed).
import { FunctionsHttpError } from '@supabase/supabase-js';

export class EdgeFunctionError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'EdgeFunctionError';
    this.code = code;
  }
}

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

export async function toEdgeFunctionError(error: unknown): Promise<EdgeFunctionError> {
  if (error instanceof FunctionsHttpError) {
    try {
      const text = await (error.context as Response).text();
      const body = text ? JSON.parse(text) : null;
      const code = typeof body?.error === 'string' ? body.error : undefined;
      const message = typeof body?.message === 'string' ? body.message : (code ?? FALLBACK_MESSAGE);
      return new EdgeFunctionError(message, code);
    } catch {
      // Response body wasn't readable, or wasn't JSON — the server did
      // respond, we just couldn't read why. Don't fall through to
      // error.message here: for a FunctionsHttpError that's always the
      // SDK's own internal wording ("Edge Function returned a non-2xx
      // status code"), not anything a user should see.
      return new EdgeFunctionError(FALLBACK_MESSAGE);
    }
  }

  return new EdgeFunctionError(error instanceof Error && error.message ? error.message : FALLBACK_MESSAGE);
}
