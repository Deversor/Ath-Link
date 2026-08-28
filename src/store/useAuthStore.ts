import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  email: string;
  phone_number: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  age: number;
  blood_type: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  student_id: string;
  college_department: string | null;
  course: string;
  year_level: string;
  sport: string;
  role: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  failedAttempts: number;
  lockedUntil: number | null; // epoch ms, null when not locked
  init: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean }>;
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
  profile: null,
  isLoading: false,
  isInitialized: false,
  error: null,
  failedAttempts: 0,
  lockedUntil: null,

  // Restores the session on page refresh/reload so the portal doesn't
  // bounce a logged-in user back to /login every time they refresh.
  init: async () => {
    const { data } = await supabase.auth.getSession();
    set({ user: data.session?.user ?? null, isInitialized: true });

    if (data.session?.user) {
      get().fetchProfile();
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null });
      if (session?.user) {
        get().fetchProfile();
      } else {
        set({ profile: null });
      }
    });
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!error && data) {
      set({ profile: data as Profile });
    }
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return { success: false };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      set({ error: error.message });
      return { success: false };
    }

    set({ profile: data as Profile });
    return { success: true };
  },

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
    set({ user: null, profile: null });
  },

  clearError: () => set({ error: null }),
}));