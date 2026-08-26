import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  failedAttempts: number;
  lockedUntil: number | null; // epoch ms, null when not locked
  signIn: (email: string, password: string) => Promise<{ success: boolean }>;
  signUp: (params: {
    email: string;
    password: string;
    fullName: string;
    role: 'student' | 'coach' | 'staff';
    sport?: string;
  }) => Promise<{ success: boolean }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  failedAttempts: 0,
  lockedUntil: null,

  signIn: async (email, password) => {
    const { lockedUntil } = get();

    if (lockedUntil && Date.now() < lockedUntil) {
      const minutesLeft = Math.ceil((lockedUntil - Date.now()) / 60000);
      set({ error: `Too many attempts. Try again in ${minutesLeft} min.` });
      return { success: false };
    }

    set({ isLoading: true, error: null });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const attempts = get().failedAttempts + 1;
      const shouldLock = attempts >= MAX_ATTEMPTS;

      set({
        isLoading: false,
        error: error.message,
        failedAttempts: attempts,
        lockedUntil: shouldLock ? Date.now() + LOCKOUT_MINUTES * 60_000 : null,
      });
      return { success: false };
    }

    set({
      user: data.user,
      isLoading: false,
      error: null,
      failedAttempts: 0,
      lockedUntil: null,
    });
    return { success: true };
  },

  signUp: async ({ email, password, fullName, role, sport }) => {
    set({ isLoading: true, error: null });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          sport: sport ?? null,
        },
      },
    });

    if (error) {
      set({ isLoading: false, error: error.message });
      return { success: false };
    }

    set({ user: data.user, isLoading: false, error: null });
    return { success: true };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },

  clearError: () => set({ error: null }),
}));