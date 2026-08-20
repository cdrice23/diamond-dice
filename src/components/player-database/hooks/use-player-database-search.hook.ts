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

export function usePlayerDatabaseSearch() {
  const [players, setPlayers] = useState<PlayerDatabaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);

  const fetchPage = useCallback(async (offset: number, replace: boolean) => {
    const { data, error } = await supabase.rpc('search_player_db', {
      page_limit: PAGE_SIZE,
      page_offset: offset,
    });

    if (error) {
      console.error('search_player_db failed:', error);
      return;
    }

    const rows: PlayerDatabaseRow[] = (data ?? []).map((row: Omit<PlayerDatabaseRow, 'indexInBatch'>, index: number) => ({
      ...row,
      indexInBatch: index,
    }));

    setPlayers((prev) => {
      const merged = replace ? rows : [...prev, ...rows];
      const seen = new Set<string>();
      const deduped = merged.filter((row) => {
        if (seen.has(row.id)) return false;
        seen.add(row.id);
        return true;
      });
      return deduped.length > RETAIN_CEILING ? deduped.slice(deduped.length - RETAIN_FLOOR) : deduped;
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPage(0, true).finally(() => setLoading(false));
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchPage(offsetRef.current, false);
    setLoadingMore(false);
  }, [loading, loadingMore, hasMore, fetchPage]);

  return { players, loading, loadingMore, hasMore, loadMore };
}