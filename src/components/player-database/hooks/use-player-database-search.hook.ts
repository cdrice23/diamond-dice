import { supabase } from '@/utils/supabase';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlayerDatabaseFilters } from '../player-database.types';
import { useAwardGroupLookup } from './use-award-group-lookup.hook';

export type PlayerDatabaseRow = {
  id: string;
  name: string;
  eligible_positions: string[];
  batting_rating_level: number | null;
  pitching_rating_level: number | null;
  is_qualified_batter: boolean;
  is_qualified_pitcher: boolean;
  image_url: string | null;
  indexInBatch: number;
  batchId: number;
};

export const PAGE_SIZE = 18;
export const RETAIN_CEILING = 300;
export const RETAIN_FLOOR = 200;

function dedupe(rows: PlayerDatabaseRow[]): PlayerDatabaseRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

function buildQueryParams(
  searchTerm: string,
  filters: PlayerDatabaseFilters,
  expandedAwardTypeIds: string[],
  pageLimit: number,
  pageOffset: number
) {
  return {
    search_term: searchTerm.trim() === '' ? null : searchTerm.trim(),
    player_type: filters.playerType,
    rating_levels: filters.ratingLevels.length === 3 ? null : filters.ratingLevels,
    positions: filters.positions.length === 0 ? null : filters.positions,
    team_ids: filters.teamIds.length === 0 ? null : filters.teamIds,
    award_type_ids: expandedAwardTypeIds.length === 0 ? null : expandedAwardTypeIds,
    on_my_roster: filters.isRostered,
    debut_date_from: filters.debutYearFrom ? `${filters.debutYearFrom}-01-01` : null,
    debut_date_to: filters.debutYearTo ? `${filters.debutYearTo}-12-31` : null,
    page_limit: pageLimit,
    page_offset: pageOffset,
  };
}

export function usePlayerDatabaseSearch(searchTerm: string, filters: PlayerDatabaseFilters) {
  const { expandLabels, isReady: awardLookupReady } = useAwardGroupLookup();

  const [prevSearchTerm, setPrevSearchTerm] = useState(searchTerm);
  const [prevFilters, setPrevFilters] = useState(filters);
  const [prevAwardLookupReady, setPrevAwardLookupReady] = useState(awardLookupReady);

  const [players, setPlayers] = useState<PlayerDatabaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [latestBatch, setLatestBatch] = useState<{ id: number; direction: 'forward' | 'backward' } | null>(null);

  const offsetRef = useRef(0);
  const earliestOffsetRef = useRef(0);
  const isFetchingForwardRef = useRef(false);
  const isFetchingBackwardRef = useRef(false);
  const batchCounterRef = useRef(0);
  const lastGrowthDirectionRef = useRef<'forward' | 'backward'>('forward');
  const searchTokenRef = useRef(0);

  const paramsChanged =
    searchTerm !== prevSearchTerm || filters !== prevFilters || awardLookupReady !== prevAwardLookupReady;

  if (paramsChanged) {
    setPrevSearchTerm(searchTerm);
    setPrevFilters(filters);
    setPrevAwardLookupReady(awardLookupReady);

    if (awardLookupReady) {
      setPlayers([]);
      setHasMore(true);
      setHasPrevious(false);
      setLatestBatch(null);
      setLoading(true);
    }
  }

  const nextBatchId = useCallback(() => {
    batchCounterRef.current += 1;
    return batchCounterRef.current;
  }, []);

  const flushEviction = useCallback(() => {
    setPlayers((prev) => {
      if (prev.length <= RETAIN_CEILING) return prev;

      const excess = prev.length - RETAIN_FLOOR;

      if (lastGrowthDirectionRef.current === 'forward') {
        earliestOffsetRef.current += excess;
        setHasPrevious(earliestOffsetRef.current > 0);
        return prev.slice(excess);
      }

      offsetRef.current -= excess;
      setHasMore(true);
      return prev.slice(0, prev.length - excess);
    });
  }, []);

  const fetchPage = useCallback(
    async (
      currentSearchTerm: string,
      currentFilters: PlayerDatabaseFilters,
      expandedAwardTypeIds: string[],
      offset: number,
      replace: boolean,
      token: number
    ) => {
      const { data, error } = await supabase.rpc(
        'search_player_db',
        buildQueryParams(currentSearchTerm, currentFilters, expandedAwardTypeIds, PAGE_SIZE, offset)
      );

      if (token !== searchTokenRef.current) {
        return null;
      }

      if (error) {
        console.error('search_player_db failed:', error);
        return null;
      }

      const batchId = nextBatchId();
      const rows: PlayerDatabaseRow[] = (data ?? []).map(
        (row: Omit<PlayerDatabaseRow, 'indexInBatch' | 'batchId'>, index: number) => ({
          ...row,
          indexInBatch: index,
          batchId,
        })
      );

      if (replace) {
        earliestOffsetRef.current = 0;
        setHasPrevious(false);
      }

      lastGrowthDirectionRef.current = 'forward';
      setPlayers((prev) => dedupe(replace ? rows : [...prev, ...rows]));

      setHasMore(rows.length === PAGE_SIZE);
      offsetRef.current = offset + rows.length;
      setLatestBatch({ id: batchId, direction: 'forward' });

      return rows;
    },
    [nextBatchId]
  );

  useEffect(() => {
    if (!awardLookupReady) return;

    searchTokenRef.current += 1;
    const token = searchTokenRef.current;

    offsetRef.current = 0;
    earliestOffsetRef.current = 0;
    isFetchingForwardRef.current = false;
    isFetchingBackwardRef.current = false;
    lastGrowthDirectionRef.current = 'forward';

    const expandedAwardTypeIds = expandLabels(filters.awardGroupLabels);

    fetchPage(searchTerm, filters, expandedAwardTypeIds, 0, true, token).finally(() => {
      if (token === searchTokenRef.current) {
        setLoading(false);
      }
    });
  }, [searchTerm, filters, awardLookupReady, expandLabels, fetchPage]);

  const loadMore = useCallback(async () => {
    if (isFetchingForwardRef.current || !hasMore) return;
    isFetchingForwardRef.current = true;
    setLoadingMore(true);
    const expandedAwardTypeIds = expandLabels(filters.awardGroupLabels);
    await fetchPage(searchTerm, filters, expandedAwardTypeIds, offsetRef.current, false, searchTokenRef.current);
    setLoadingMore(false);
    isFetchingForwardRef.current = false;
  }, [hasMore, fetchPage, searchTerm, filters, expandLabels]);

  const loadPrevious = useCallback(async () => {
    if (isFetchingBackwardRef.current || !hasPrevious) return;

    const previousOffset = Math.max(0, earliestOffsetRef.current - PAGE_SIZE);
    if (previousOffset === earliestOffsetRef.current) {
      setHasPrevious(false);
      return;
    }

    isFetchingBackwardRef.current = true;
    setLoadingPrevious(true);

    const token = searchTokenRef.current;
    const expandedAwardTypeIds = expandLabels(filters.awardGroupLabels);
    const { data, error } = await supabase.rpc(
      'search_player_db',
      buildQueryParams(searchTerm, filters, expandedAwardTypeIds, PAGE_SIZE, previousOffset)
    );

    if (token !== searchTokenRef.current) {
      setLoadingPrevious(false);
      isFetchingBackwardRef.current = false;
      return;
    }

    if (error) {
      console.error('search_player_db (loadPrevious) failed:', error);
      setLoadingPrevious(false);
      isFetchingBackwardRef.current = false;
      return;
    }

    const batchId = nextBatchId();
    const rows: PlayerDatabaseRow[] = (data ?? []).map(
      (row: Omit<PlayerDatabaseRow, 'indexInBatch' | 'batchId'>, index: number) => ({
        ...row,
        indexInBatch: index,
        batchId,
      })
    );

    lastGrowthDirectionRef.current = 'backward';
    setPlayers((prev) => dedupe([...rows, ...prev]));

    earliestOffsetRef.current = previousOffset;
    setHasPrevious(previousOffset > 0);
    setLatestBatch({ id: batchId, direction: 'backward' });

    setLoadingPrevious(false);
    isFetchingBackwardRef.current = false;
  }, [hasPrevious, nextBatchId, searchTerm, filters, expandLabels]);

  return {
    players,
    loading,
    loadingMore,
    loadingPrevious,
    hasMore,
    hasPrevious,
    latestBatch,
    loadMore,
    loadPrevious,
    flushEviction,
  };
}