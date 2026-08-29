import { supabase } from '@/utils/supabase';
import { useEffect, useState } from 'react';

export type FormatOption = { id: string; name: string };

export function useFormats() {
  const [formats, setFormats] = useState<FormatOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchFormats() {
      const { data } = await supabase.from('formats').select('id, name').order('name');
      if (isMounted) {
        setFormats(data ?? []);
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