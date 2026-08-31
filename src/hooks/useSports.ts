import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SPORTS_LIST } from '../lib/schemas/signupSchema';

/**
 * Returns the live list of active sport names from the `sports` table.
 * Falls back to the static SPORTS_LIST while the query is in flight (or if
 * it fails), so dropdowns never render empty.
 */
export function useSports(): string[] {
  const [sports, setSports] = useState<string[]>([...SPORTS_LIST]);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from('sports')
      .select('name')
      .eq('active', true)
      .order('name')
      .then(({ data }) => {
        if (!cancelled && data && data.length > 0) {
          setSports(data.map((s) => s.name));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return sports;
}
