import { supabase } from './supabase';

/** Fetches the current academic term label set by Super Admin (e.g. "AY 2026-2027, 1st Semester"). */
export async function getCurrentAcademicTerm(): Promise<string> {
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'academic_term')
    .maybeSingle();
  return data?.value ?? 'Unspecified Term';
}

/** Turns a term label into something safe to use as a storage folder name. */
export function slugifyTerm(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
