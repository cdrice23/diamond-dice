import { supabase } from '@/utils/supabase';
import { useEffect, useState } from 'react';

export type FormatOption = {
  id: string;
  name: string;
  description: string | null;
};

export function useFormats() {
  const [formats, setFormats] = useState<FormatOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchFormats() {
      const { data } = await supabase
        .from('formats')
        .select('id, name, team_format_description, display_order')
        .order('display_order');

      if (isMounted) {
        setFormats(
          (data ?? []).map((row) => ({
            id: row.id,
            name: row.name,
            description: row.team_format_description,
          }))
        );
        setLoading(false);
      }
    }

    fetchFormats();
    return () => {
      isMounted = false;
    };
  }, []);

  return { formats, loading };
}