// Global JS-level crash reporting. There's no Sentry/Bugsnag account to
// wire up here, so this reports through the PostHog project we already
// have credentials for — captureException() sends a $exception event
// with a stack trace, visible in PostHog's error tracking view.
import { captureException } from './analytics';

let installed = false;

export function installGlobalErrorHandlers() {
  if (installed) return;
  installed = true;

  const g = globalThis as typeof globalThis & {
    ErrorUtils?: {
      getGlobalHandler: () => (error: unknown, isFatal?: boolean) => void;
      setGlobalHandler: (handler: (error: unknown, isFatal?: boolean) => void) => void;
    };
    addEventListener?: (type: string, listener: (event: { reason: unknown }) => void) => void;
  };

  if (g.ErrorUtils) {
    const previousHandler = g.ErrorUtils.getGlobalHandler();
    g.ErrorUtils.setGlobalHandler((error, isFatal) => {
      captureException(error, { isFatal: Boolean(isFatal), source: 'global_handler' });
      previousHandler?.(error, isFatal);
    });
  }

  // Best-effort — not every RN/Hermes runtime supports this event, but
  // registering it is harmless when unsupported.
  g.addEventListener?.('unhandledrejection', (event) => {
    captureException(event.reason, { source: 'unhandled_rejection' });
  });
}
