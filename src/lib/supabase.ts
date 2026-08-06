import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from '@/src/types/database';

import { env } from './env';

// Expo Router's web build statically renders on Node during export/SSR,
// where `window` (and AsyncStorage's underlying localStorage) don't exist.
// A no-op storage in that context is fine — the server render doesn't need
// a persisted session, only the browser does.
const isBrowser = typeof window !== 'undefined';
const noopStorage: SupportedStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

export const supabase = createClient<Database>(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: Platform.OS === 'web' && !isBrowser ? noopStorage : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// Supabase's client only refreshes the session on a timer while something is
// actively listening; without this, a backgrounded app misses refreshes and
// the user gets silently signed out when they return. Guarded because this
// module also gets imported during Expo Router's server-side web export.
if (isBrowser || Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
