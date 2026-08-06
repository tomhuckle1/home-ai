import { useEffect } from 'react';

import { AnalyticsEvent, identifyUser, resetAnalytics, track } from '@/src/lib/analytics';
import { supabase } from '@/src/lib/supabase';
import { useSessionStore } from '@/src/store/session-store';

/**
 * Subscribes once to Supabase's auth state and keeps the session store (and
 * analytics identity) in sync. Mount this exactly once, at the app root.
 */
export function useSessionSync() {
  const setSession = useSessionStore((state) => state.setSession);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      if (event === 'SIGNED_IN' && session) {
        identifyUser(session.user.id, { email: session.user.email ?? null });
        track(AnalyticsEvent.SignedIn);
      } else if (event === 'SIGNED_OUT') {
        track(AnalyticsEvent.SignedOut);
        resetAnalytics();
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, [setSession]);
}

export function useSession() {
  // Two primitive selectors, not one selector returning a new object literal
  // every call — the latter defeats useSyncExternalStore's snapshot caching
  // and causes an infinite render loop ("getSnapshot should be cached").
  const session = useSessionStore((state) => state.session);
  const status = useSessionStore((state) => state.status);
  return { session, status };
}
