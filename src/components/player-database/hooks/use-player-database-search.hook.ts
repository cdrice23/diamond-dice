import { supabase } from '@/utils/supabase';
import { useCallback, useEffect, useRef, useState } from 'react';

export type PlayerDatabaseRow = {
  id: string;
  name: string;
  eligible_positions: string[];
  batting_rating_level: number | null;
  pitching_rating_level: number | null;
  is_qualified_batter: boolean;
  is_qualified_pitcher: boolean;
  indexInBatch: number;
};

const PAGE_SIZE = 20;
const RETAIN_CEILING = PAGE_SIZE * 15;
const RETAIN_FLOOR = PAGE_SIZE * 10;

type TrimResult = {
  rows: PlayerDatabaseRow[];
  trimmedFromFront: number;
  trimmedFromBack: number;
};

function dedupe(rows: PlayerDatabaseRow[]): PlayerDatabaseRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

function capFromOppositeEdge(rows: PlayerDatabaseRow[], trimFromFront: boolean): TrimResult {
  if (rows.length <= RETAIN_CEILING) {
    return { rows, trimmedFromFront: 0, trimmedFromBack: 0 };
  }

  const excess = rows.length - RETAIN_FLOOR;

  if (trimFromFront) {
    return { rows: rows.slice(excess), trimmedFromFront: excess, trimmedFromBack: 0 };
  }

  return { rows: rows.slice(0, rows.length - excess), trimmedFromFront: 0, trimmedFromBack: excess };
}

export function usePlayerDatabaseSearch() {
  const [players, setPlayers] = useState<PlayerDatabaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [hasPrevious, setHasPrevious] = useState(false);
  const offsetRef = useRef(0);
  const earliestOffsetRef = useRef(0);
  const isFetchingForwardRef = useRef(false);
  const isFetchingBackwardRef = useRef(false);

  const fetchPage = useCallback(async (offset: number, replace: boolean) => {
    const { data, error } = await supabase.rpc('search_player_db', {
      page_limit: PAGE_SIZE,
      page_offset: offset,
    });

    if (error) {
      console.error('search_player_db failed:', error);
      return null;
    }

    const rows: PlayerDatabaseRow[] = (data ?? []).map((row: Omit<PlayerDatabaseRow, 'indexInBatch'>, index: number) => ({
      ...row,
      indexInBatch: index,
    }));

    if (replace) {
      earliestOffsetRef.current = 0;
      setHasPrevious(false);
    }

    setPlayers((prev) => {
      const merged = dedupe(replace ? rows : [...prev, ...rows]);
      const { rows: capped, trimmedFromFront } = capFromOppositeEdge(merged, true);

      if (trimmedFromFront > 0) {
        earliestOffsetRef.current += trimmedFromFront;
        setHasPrevious(earliestOffsetRef.current > 0);
      }

      return capped;
    });

    setHasMore(rows.length === PAGE_SIZE);
    offsetRef.current = offset + rows.length;

    return rows;
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPage(0, true).finally(() => setLoading(false));
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (isFetchingForwardRef.current || !hasMore) return;
    isFetchingForwardRef.current = true;
    setLoadingMore(true);
    await fetchPage(offsetRef.current, false);
    setLoadingMore(false);
    isFetchingForwardRef.current = false;
  }, [hasMore, fetchPage]);

  const loadPrevious = useCallback(async () => {
    if (isFetchingBackwardRef.current || !hasPrevious) return;

    const previousOffset = Math.max(0, earliestOffsetRef.current - PAGE_SIZE);
    if (previousOffset === earliestOffsetRef.current) {
      setHasPrevious(false);
      return;
    }

    isFetchingBackwardRef.current = true;
    setLoadingPrevious(true);

    const { data, error } = await supabase.rpc('search_player_db', {
      page_limit: PAGE_SIZE,
      page_offset: previousOffset,
    });

    if (error) {
      console.error('search_player_db (loadPrevious) failed:', error);
      setLoadingPrevious(false);
      isFetchingBackwardRef.current = false;
      return;
    }

    const rows: PlayerDatabaseRow[] = (data ?? []).map((row: Omit<PlayerDatabaseRow, 'indexInBatch'>, index: number) => ({
      ...row,
      indexInBatch: index,
    }));

    setPlayers((prev) => {
      const merged = dedupe([...rows, ...prev]);
      const { rows: capped, trimmedFromBack } = capFromOppositeEdge(merged, false);

      if (trimmedFromBack > 0) {
        offsetRef.current -= trimmedFromBack;
        setHasMore(true);
      }

      return capped;
    });

    earliestOffsetRef.current = previousOffset;
    setHasPrevious(previousOffset > 0);

    setLoadingPrevious(false);
    isFetchingBackwardRef.current = false;
  }, [hasPrevious]);

  return { players, loading, loadingMore, loadingPrevious, hasMore, hasPrevious, loadMore, loadPrevious };
}