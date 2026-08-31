import { supabase } from '@/utils/supabase';
import { useEffect, useState } from 'react';

export function useFormatPitcherCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchCounts() {
      const { data } = await supabase.from('format_roster_requirements').select('format_id, min_count').eq('player_type', 'pitcher');

      if (isMounted) {
        const totals: Record<string, number> = {};
        for (const row of data ?? []) {
          totals[row.format_id] = (totals[row.format_id] ?? 0) + row.min_count;
        }
        setCounts(totals);
        setLoading(false);
      }
    }

    fetchCounts();
    return () => {
      isMounted = false;
    };
  }, []);

  return { counts, loading };
}