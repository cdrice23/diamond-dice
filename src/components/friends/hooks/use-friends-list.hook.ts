import { supabase } from '@/utils/supabase';
import { useCallback, useEffect, useRef, useState } from 'react';
import { filterMockFriends, USE_MOCK_FRIENDS_DATA } from '../friends.mock';
import type { FriendSummary } from '../friends.types';

const PAGE_SIZE = 20;

function mapRow(row: any): FriendSummary {
  return {
    profileId: row.profile_id,
    username: row.username,
    displayName: row.display_name,
  };
}

export function useFriendsList(searchTerm: string) {
  const trimmed = searchTerm.trim();

  const [prevTrimmed, setPrevTrimmed] = useState(trimmed);
  const [friends, setFriends] = useState<FriendSummary[]>(
    USE_MOCK_FRIENDS_DATA ? filterMockFriends(trimmed) : []
  );
  const [loading, setLoading] = useState(!USE_MOCK_FRIENDS_DATA);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(!USE_MOCK_FRIENDS_DATA);

  const isMountedRef = useRef(true);
  const offsetRef = useRef(0);
  const isFetchingMoreRef = useRef(false);
  const requestTokenRef = useRef(0);

  if (trimmed !== prevTrimmed) {
    setPrevTrimmed(trimmed);
    setFriends(USE_MOCK_FRIENDS_DATA ? filterMockFriends(trimmed) : []);
    setHasMore(!USE_MOCK_FRIENDS_DATA);
    setLoading(!USE_MOCK_FRIENDS_DATA);
  }

  const fetchPage = useCallback(
    async (offset: number, replace: boolean, token: number) => {
      const { data, error } = await supabase.rpc('get_friends_list', {
        p_search_term: trimmed === '' ? null : trimmed,
        p_page_limit: PAGE_SIZE,
        p_page_offset: offset,
      });

      if (!isMountedRef.current || token !== requestTokenRef.current) return;

      if (error) {
        console.error('get_friends_list failed:', error);
        if (replace) setFriends([]);
        setHasMore(false);
        return;
      }

      const rows: FriendSummary[] = (data ?? []).map(mapRow);
      setFriends((prev) => (replace ? rows : [...prev, ...rows]));
      setHasMore(rows.length === PAGE_SIZE);
      offsetRef.current = offset + rows.length;
    },
    [trimmed]
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (USE_MOCK_FRIENDS_DATA) return;

    offsetRef.current = 0;
    isFetchingMoreRef.current = false;
    requestTokenRef.current += 1;
    const token = requestTokenRef.current;

     
    fetchPage(0, true, token).finally(() => {
      if (isMountedRef.current && token === requestTokenRef.current) setLoading(false);
    });
  }, [trimmed, fetchPage]);

  const loadMore = useCallback(async () => {
    if (USE_MOCK_FRIENDS_DATA) return;
    if (isFetchingMoreRef.current || !hasMore) return;
    isFetchingMoreRef.current = true;
    setLoadingMore(true);
    await fetchPage(offsetRef.current, false, requestTokenRef.current);
    setLoadingMore(false);
    isFetchingMoreRef.current = false;
  }, [hasMore, fetchPage]);

  const refetch = useCallback(async () => {
    if (USE_MOCK_FRIENDS_DATA) return;
    offsetRef.current = 0;
    setHasMore(true);
    setLoading(true);
    await fetchPage(0, true, requestTokenRef.current);
    setLoading(false);
  }, [fetchPage]);

  return { friends, loading, loadingMore, hasMore, loadMore, refetch };
}