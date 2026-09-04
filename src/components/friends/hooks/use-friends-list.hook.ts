import { supabase } from '@/utils/supabase';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MOCK_FRIENDS, USE_MOCK_FRIENDS_DATA } from '../friends.mock';
import type { FriendSummary } from '../friends.types';

const PAGE_SIZE = 20;

function mapRow(row: any): FriendSummary {
  return {
    profileId: row.profile_id,
    username: row.username,
    displayName: row.display_name,
  };
}

export function useFriendsList() {
  const [friends, setFriends] = useState<FriendSummary[]>(USE_MOCK_FRIENDS_DATA ? MOCK_FRIENDS : []);
  const [loading, setLoading] = useState(!USE_MOCK_FRIENDS_DATA);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(!USE_MOCK_FRIENDS_DATA);

  const isMountedRef = useRef(true);
  const offsetRef = useRef(0);
  const isFetchingMoreRef = useRef(false);

  const fetchPage = useCallback(async (offset: number, replace: boolean) => {
    const { data, error } = await supabase.rpc('get_friends_list', {
      p_page_limit: PAGE_SIZE,
      p_page_offset: offset,
    });

    if (!isMountedRef.current) return;

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
  }, []);

  useEffect(() => {
    if (USE_MOCK_FRIENDS_DATA) return;

    isMountedRef.current = true;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPage(0, true).finally(() => {
      if (isMountedRef.current) setLoading(false);
    });

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (USE_MOCK_FRIENDS_DATA) return;
    if (isFetchingMoreRef.current || !hasMore) return;
    isFetchingMoreRef.current = true;
    setLoadingMore(true);
    await fetchPage(offsetRef.current, false);
    setLoadingMore(false);
    isFetchingMoreRef.current = false;
  }, [hasMore, fetchPage]);

  const refetch = useCallback(async () => {
    if (USE_MOCK_FRIENDS_DATA) return;
    offsetRef.current = 0;
    setHasMore(true);
    setLoading(true);
    await fetchPage(0, true);
    setLoading(false);
  }, [fetchPage]);

  return { friends, loading, loadingMore, hasMore, loadMore, refetch };
}