import { supabase } from '@/utils/supabase';
import { useEffect, useState } from 'react';
import { SearchableMultiSelectOption } from '../player-database.types';

let cachedTeamOptions: SearchableMultiSelectOption[] | null = null;

export function useMlbTeams() {
  const [options, setOptions] = useState<SearchableMultiSelectOption[]>(cachedTeamOptions ?? []);
  const [loading, setLoading] = useState(!cachedTeamOptions);

  useEffect(() => {
    if (cachedTeamOptions) return;

    let isMounted = true;

    async function fetchTeams() {
      const { data, error } = await supabase.from('mlb_teams').select('id, name').order('name');

      if (error || !data || !isMounted) {
        console.error('Failed to load MLB teams for filtering:', error);
        return;
      }

      const mapped = data.map((row) => ({ id: row.id, label: row.name }));
      cachedTeamOptions = mapped;
      setOptions(mapped);
      setLoading(false);
    }

    fetchTeams();

    return () => {
      isMounted = false;
    };
  }, []);

  return { options, loading };
}