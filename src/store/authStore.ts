import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  isInitialized: boolean;
  initialize: () => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isInitialized: false,
  
  initialize: () => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, isInitialized: true });
    });

    // Listen for changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
  }
}));
