import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface DocRequirement {
  id: string;
  doc_type: string;
  label: string;
  sort_order: number;
}

export function useSportDocumentRequirements(sport: string | null | undefined) {
  const [requirements, setRequirements] = useState<DocRequirement[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!sport) {
      setRequirements([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('sport_document_requirements')
      .select('id, doc_type, label, sort_order')
      .eq('sport', sport)
      .eq('active', true)
      .order('sort_order');
    setRequirements(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport]);

  return { requirements, loading, reload };
}