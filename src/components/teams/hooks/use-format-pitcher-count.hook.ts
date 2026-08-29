import { supabase } from '@/utils/supabase';
import { useEffect, useState } from 'react';

export function useFormatPitcherCount(formatId: string | null) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!formatId) {
      setCount(0);
      return;
    }

    let isMounted = true;
    async function fetchCount() {
      const { data } = await supabase
        .from('format_roster_requirements')
        .select('min_count')
        .eq('format_id', formatId)
        .eq('player_type', 'pitcher');

      if (isMounted) {
        const total = (data ?? []).reduce((sum, row) => sum + row.min_count, 0);
        setCount(total);
      }
    }
    fetchCount();
    return () => {
      isMounted = false;
    };
  }, [formatId]);

  return count;
}