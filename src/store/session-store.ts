import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

type SessionStatus = 'loading' | 'signedIn' | 'signedOut';

type SessionState = {
  session: Session | null;
  status: SessionStatus;
  setSession: (session: Session | null) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  status: 'loading',
  setSession: (session) => set({ session, status: session ? 'signedIn' : 'signedOut' }),
}));
