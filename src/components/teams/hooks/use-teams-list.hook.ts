import { supabase } from '@/utils/supabase';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { TeamSummary } from '../teams.types';

const PAGE_SIZE = 20;

export type TeamsSortDirection = 'asc' | 'desc';

function mapRow(row: any): TeamSummary {
  return {
    id: row.id,
    team_name: row.team_name,
    home_field_name: row.home_field_name,
    team_theme_color_primary: row.team_theme_color_primary,
    team_theme_color_secondary: row.team_theme_color_secondary,
    format_id: row.format_id,
    format_name: row.format_name,
    updated_at: row.updated_at,
    last_played_at: row.last_played_at,
    wins: row.wins,
    losses: row.losses,
    roster_preview: row.roster_preview,
    position_levels: row.position_levels,
    pitcher_levels: row.pitcher_levels,
    batting_order: row.batting_order,
  };
}

export function useTeamsList(searchTerm: string, formatId: string | null, sortDirection: TeamsSortDirection) {
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const isMountedRef = useRef(true);
  const offsetRef = useRef(0);
  const isFetchingMoreRef = useRef(false);
  const searchTokenRef = useRef(0);

  const fetchPage = useCallback(
    async (offset: number, replace: boolean, token: number) => {
      const { data, error } = await supabase.rpc('get_teams_list', {
        search_term: searchTerm.trim() === '' ? null : searchTerm.trim(),
        format_id: formatId,
        sort_direction: sortDirection,
        page_limit: PAGE_SIZE,
        page_offset: offset,
      });

      if (!isMountedRef.current || token !== searchTokenRef.current) return;

      if (error) {
        console.error('get_teams_list failed:', error);
        if (replace) setTeams([]);
        setHasMore(false);
        return;
      }

      const rows: TeamSummary[] = (data ?? []).map(mapRow);
      setTeams((prev) => (replace ? rows : [...prev, ...rows]));
      setHasMore(rows.length === PAGE_SIZE);
      offsetRef.current = offset + rows.length;
    },
    [searchTerm, formatId, sortDirection]
  );

  useEffect(() => {
    isMountedRef.current = true;
    searchTokenRef.current += 1;
    const token = searchTokenRef.current;

    offsetRef.current = 0;
    isFetchingMoreRef.current = false;
    setLoading(true);
    setHasMore(true);

    fetchPage(0, true, token).finally(() => {
      if (isMountedRef.current && token === searchTokenRef.current) {
        setLoading(false);
      }
    });

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (isFetchingMoreRef.current || !hasMore) return;
    isFetchingMoreRef.current = true;
    setLoadingMore(true);
    await fetchPage(offsetRef.current, false, searchTokenRef.current);
    setLoadingMore(false);
    isFetchingMoreRef.current = false;
  }, [hasMore, fetchPage]);

  const refetch = useCallback(async () => {
    const token = searchTokenRef.current;
    offsetRef.current = 0;
    setHasMore(true);
    await fetchPage(0, true, token);
  }, [fetchPage]);

  return { teams, loading, loadingMore, hasMore, loadMore, refetch };
}