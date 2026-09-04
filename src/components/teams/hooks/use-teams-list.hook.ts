import { PREFETCH_AVATARS_ENABLED, runWithConcurrencyLimit } from '@/utils/prefetch-queue';
import { supabase } from '@/utils/supabase';
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { TeamSummary } from '../teams.types';

const PAGE_SIZE = 20;

export type TeamsSortDirection = 'asc' | 'desc';

const DEFAULT_SEARCH_TERM = '';
const DEFAULT_FORMAT_ID: string | null = null;
const DEFAULT_SORT_DIRECTION: TeamsSortDirection = 'desc';

const AVATAR_PREFETCH_CAP_PER_TEAM = 8;
const AVATAR_PREFETCH_CONCURRENCY = 6;

type TeamsListCacheEntry = {
  teams: TeamSummary[];
  hasMore: boolean;
};

let cachedFirstPage: TeamsListCacheEntry | null = null;
let inFlightFetch: Promise<TeamsListCacheEntry | null> | null = null;

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

function isDefaultParams(searchTerm: string, formatId: string | null, sortDirection: TeamsSortDirection) {
  return (
    searchTerm.trim() === DEFAULT_SEARCH_TERM &&
    formatId === DEFAULT_FORMAT_ID &&
    sortDirection === DEFAULT_SORT_DIRECTION
  );
}

async function fetchAndCacheDefaultTeamsPage(): Promise<TeamsListCacheEntry | null> {
  const { data, error } = await supabase.rpc('get_teams_list', {
    p_search_term: null,
    p_format_id: DEFAULT_FORMAT_ID,
    p_sort_direction: DEFAULT_SORT_DIRECTION,
    p_page_limit: PAGE_SIZE,
    p_page_offset: 0,
  });

  if (error || !data) {
    console.error('fetchAndCacheDefaultTeamsPage: get_teams_list failed', error);
    cachedFirstPage = null;
    return null;
  }

  const teams: TeamSummary[] = data.map(mapRow);
  const entry: TeamsListCacheEntry = { teams, hasMore: teams.length === PAGE_SIZE };
  cachedFirstPage = entry;
  return entry;
}

function prefetchRosterAvatars(teams: TeamSummary[]): void {
  if (!PREFETCH_AVATARS_ENABLED) return;

  const urls = teams.flatMap((team) =>
    team.roster_preview
      .slice(0, AVATAR_PREFETCH_CAP_PER_TEAM)
      .map((player) => player.image_url)
      .filter((url): url is string => Boolean(url))
  );

  if (urls.length === 0) return;

  runWithConcurrencyLimit(urls, AVATAR_PREFETCH_CONCURRENCY, async (url) => {
    await Image.prefetch(url);
  }).catch((error) => {
    console.warn('prefetchRosterAvatars: batch failed', error);
  });
}

export function prefetchTeamsList(): void {
  if (cachedFirstPage || inFlightFetch) return;

  inFlightFetch = fetchAndCacheDefaultTeamsPage()
    .then((entry) => {
      if (entry) prefetchRosterAvatars(entry.teams);
      return entry;
    })
    .finally(() => {
      inFlightFetch = null;
    });
}

export function clearCachedTeamsList(): void {
  cachedFirstPage = null;
  inFlightFetch = null;
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
        p_search_term: searchTerm.trim() === '' ? null : searchTerm.trim(),
        p_format_id: formatId,
        p_sort_direction: sortDirection,
        p_page_limit: PAGE_SIZE,
        p_page_offset: offset,
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
    setHasMore(true);

    const useCache = isDefaultParams(searchTerm, formatId, sortDirection);

    if (useCache && cachedFirstPage) {
      setTeams(cachedFirstPage.teams);
      setHasMore(cachedFirstPage.hasMore);
      offsetRef.current = cachedFirstPage.teams.length;
      setLoading(false);
    } else if (useCache && inFlightFetch) {
      setLoading(true);
      inFlightFetch.then((entry) => {
        if (!isMountedRef.current || token !== searchTokenRef.current) return;
        if (entry) {
          setTeams(entry.teams);
          setHasMore(entry.hasMore);
          offsetRef.current = entry.teams.length;
        } else {
          setTeams([]);
          setHasMore(false);
        }
        setLoading(false);
      });
    } else {
      setLoading(true);
      fetchPage(0, true, token).finally(() => {
        if (isMountedRef.current && token === searchTokenRef.current) {
          setLoading(false);
        }
      });
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchPage, searchTerm, formatId, sortDirection]);

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