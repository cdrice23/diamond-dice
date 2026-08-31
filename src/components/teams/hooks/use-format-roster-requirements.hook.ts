import { supabase } from '@/utils/supabase';
import { useEffect, useState } from 'react';

export type FormatLevelRequirement = {
  playerType: 'batter' | 'pitcher';
  level: number | null;
  minCount: number;
  maxCount: number | null;
};

type LevelEmbed = { level: number } | { level: number }[] | null;

type RequirementRow = {
  player_type: 'batter' | 'pitcher';
  min_count: number;
  max_count: number | null;
  levels: LevelEmbed;
};

function resolveLevel(levels: LevelEmbed): number | null {
  if (!levels) return null;
  return Array.isArray(levels) ? (levels[0]?.level ?? null) : levels.level;
}

export function useFormatRosterRequirements(formatId: string | null) {
  const [requirements, setRequirements] = useState<FormatLevelRequirement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!formatId) {
      setRequirements([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchRequirements() {
      setLoading(true);
      const { data } = await supabase
        .from('format_roster_requirements')
        .select('player_type, min_count, max_count, levels(level)')
        .eq('format_id', formatId);

      if (isMounted) {
        setRequirements(
          (data as RequirementRow[] | null ?? []).map((row) => ({
            playerType: row.player_type,
            level: resolveLevel(row.levels),
            minCount: row.min_count,
            maxCount: row.max_count,
          }))
        );
        setLoading(false);
      }
    }

    fetchRequirements();
    return () => {
      isMounted = false;
    };
  }, [formatId]);

  return { requirements, loading };
}