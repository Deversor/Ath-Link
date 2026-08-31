import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { isPrivilegedRole, type AppRole } from '../lib/roleHome';

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  email: string;
  phone_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  age: number | null;
  blood_type: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  student_id: string | null;
  college_department: string | null;
  course: string | null;
  year_level: string | null;
  sport: string | null;
  role: AppRole;
  specialization: string | null;
  years_experience: number | null;
  department: string | null;
  is_active: boolean;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  isProfileLoading: boolean;
  error: string | null;
  failedAttempts: number;
  lockedUntil: number | null; // epoch ms, null when not locked

  // Admin login-key verification (separate step, separate lockout)
  isAdminVerified: boolean;
  adminKeyError: string | null;
  adminKeyAttempts: number;
  adminKeyLockedUntil: number | null;

  init: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean }>;
  signUp: (params: {
    email: string;
    password: string;
    fullName: string;
    role: 'student' | 'coach';
    sport?: string;
  }) => Promise<{ success: boolean }>;
  verifyAdminKey: (key: string) => Promise<{ success: boolean }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

function adminVerifiedStorageKey(userId: string) {
  return `admin_verified_${userId}`;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: false,
  isInitialized: false,
  isProfileLoading: false,
  error: null,
  failedAttempts: 0,
  lockedUntil: null,

  isAdminVerified: false,
  adminKeyError: null,
  adminKeyAttempts: 0,
  adminKeyLockedUntil: null,

  // Restores the session on page refresh/reload so the portal doesn't
  // bounce a logged-in user back to /login every time they refresh.
  init: async () => {
    const { data } = await supabase.auth.getSession();
    set({ user: data.session?.user ?? null, isInitialized: true });

    if (data.session?.user) {
      await get().fetchProfile();
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null });
      if (session?.user) {
        get().fetchProfile();
      } else {
        set({ profile: null, isAdminVerified: false });
      }
    });
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    set({ isProfileLoading: true });

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!error && data) {
      const profile = data as Profile;
      set({ profile });

      // A privileged role that already cleared admin verification earlier
      // in this browser session shouldn't be asked again on every refresh.
      if (isPrivilegedRole(profile.role)) {
        const wasVerified = sessionStorage.getItem(adminVerifiedStorageKey(user.id)) === 'true';
        set({ isAdminVerified: wasVerified });
      } else {
        set({ isAdminVerified: true }); // not applicable to this role
      }
    }
    set({ isProfileLoading: false });
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

    // Load the profile right away so the caller can decide where to route
    // the person (dashboard vs. admin-verify) without waiting on the
    // onAuthStateChange listener's timing.
    await get().fetchProfile();

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

  verifyAdminKey: async (key) => {
    const { user, profile, adminKeyLockedUntil } = get();

    if (adminKeyLockedUntil && Date.now() < adminKeyLockedUntil) {
      const minutesLeft = Math.ceil((adminKeyLockedUntil - Date.now()) / 60000);
      set({ adminKeyError: `Too many attempts. Try again in ${minutesLeft} min.` });
      return { success: false };
    }

    if (!user || !profile) {
      set({ adminKeyError: 'Your session expired. Please sign in again.' });
      return { success: false };
    }

    set({ isLoading: true, adminKeyError: null });

    const { data, error } = await supabase.rpc('verify_admin_key', {
      p_role: profile.role,
      p_key: key,
    });

    if (error || !data) {
      const attempts = get().adminKeyAttempts + 1;
      const shouldLock = attempts >= MAX_ATTEMPTS;

      set({
        isLoading: false,
        adminKeyAttempts: attempts,
        adminKeyLockedUntil: shouldLock ? Date.now() + LOCKOUT_MINUTES * 60_000 : null,
        adminKeyError: shouldLock
          ? `Too many attempts. Try again in ${LOCKOUT_MINUTES} min.`
          : 'Incorrect login key.',
      });
      return { success: false };
    }

    sessionStorage.setItem(adminVerifiedStorageKey(user.id), 'true');
    set({
      isLoading: false,
      isAdminVerified: true,
      adminKeyError: null,
      adminKeyAttempts: 0,
      adminKeyLockedUntil: null,
    });
    return { success: true };
  },

  signOut: async () => {
    const { user } = get();
    if (user) sessionStorage.removeItem(adminVerifiedStorageKey(user.id));
    await supabase.auth.signOut();
    set({ user: null, profile: null, isAdminVerified: false });
  },

  clearError: () => set({ error: null }),
}));