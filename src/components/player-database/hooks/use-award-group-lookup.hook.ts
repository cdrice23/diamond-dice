import { AWARD_GROUPS } from '@/components/player-database/player-database.constants';
import { supabase } from '@/utils/supabase';
import { useCallback, useEffect, useState } from 'react';

export function useAwardGroupLookup() {
  const [lookup, setLookup] = useState<Map<string, string[]> | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchAndBuildLookup() {
      const { data, error } = await supabase.from('award_types').select('id, external_id');

      if (error || !data || !isMounted) {
        console.error('Failed to load award types for filtering:', error);
        return;
      }

      const externalIdToUuid = new Map(data.map((row) => [row.external_id, row.id]));
      const groupLookup = new Map<string, string[]>();

      for (const group of AWARD_GROUPS) {
        const uuids = group.externalIds
          .map((externalId) => externalIdToUuid.get(externalId))
          .filter((id): id is string => !!id);
        groupLookup.set(group.label, uuids);
      }

      if (isMounted) {
        setLookup(groupLookup);
      }
    }

    fetchAndBuildLookup();

    return () => {
      isMounted = false;
    };
  }, []);

  const expandLabels = useCallback(
    (labels: string[]): string[] => {
      if (!lookup) return [];
      return labels.flatMap((label) => lookup.get(label) ?? []);
    },
    [lookup]
  );

  return { expandLabels, isReady: lookup !== null };
}