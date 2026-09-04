import { supabase } from '@/utils/supabase';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MOCK_SEARCH_RESULTS, USE_MOCK_FRIENDS_DATA } from '../friends.mock';

const PAGE_SIZE = 20;

export type FriendSearchResult = {
  profileId: string;
  username: string;
  displayName: string;
  relationshipStatus: 'none' | 'pending_sent' | 'pending_received' | 'friends';
  friendRequestId: string | null;
};

function mapRow(row: any): FriendSearchResult {
  return {
    profileId: row.profile_id,
    username: row.username,
    displayName: row.display_name,
    relationshipStatus: row.relationship_status,
    friendRequestId: row.friend_request_id,
  };
}

function getMockResults(trimmed: string): FriendSearchResult[] {
  const lowered = trimmed.toLowerCase();
  return MOCK_SEARCH_RESULTS.filter(
    (result) => result.username.toLowerCase().includes(lowered) || result.displayName.toLowerCase().includes(lowered)
  );
}

export function useFriendSearch(searchTerm: string) {
  const trimmed = searchTerm.trim();

  const [prevTrimmed, setPrevTrimmed] = useState(trimmed);
  const [results, setResults] = useState<FriendSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const isMountedRef = useRef(true);
  const offsetRef = useRef(0);
  const searchTokenRef = useRef(0);
  const isFetchingMoreRef = useRef(false);

  if (trimmed !== prevTrimmed) {
    setPrevTrimmed(trimmed);
    setResults(USE_MOCK_FRIENDS_DATA ? getMockResults(trimmed) : []);
    setHasMore(false);
    setLoading(USE_MOCK_FRIENDS_DATA ? false : trimmed !== '');
  }

  const fetchPage = useCallback(
    async (offset: number, replace: boolean, token: number) => {
      const { data, error } = await supabase.rpc('search_profile_for_friend', {
        search_query: trimmed,
        p_page_limit: PAGE_SIZE,
        p_page_offset: offset,
      });

      if (!isMountedRef.current || token !== searchTokenRef.current) return;

      if (error) {
        console.error('search_profile_for_friend failed:', error);
        if (replace) setResults([]);
        setHasMore(false);
        return;
      }

      const rows = (data ?? []).map(mapRow);
      setResults((prev) => (replace ? rows : [...prev, ...rows]));
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
    if (trimmed === '') return;

    offsetRef.current = 0;
    isFetchingMoreRef.current = false;
    searchTokenRef.current += 1;
    const token = searchTokenRef.current;

     
    fetchPage(0, true, token).finally(() => {
      if (isMountedRef.current && token === searchTokenRef.current) setLoading(false);
    });
  }, [trimmed, fetchPage]);

  const loadMore = useCallback(async () => {
    if (USE_MOCK_FRIENDS_DATA) return;
    if (isFetchingMoreRef.current || !hasMore || trimmed === '') return;
    isFetchingMoreRef.current = true;
    setLoadingMore(true);
    await fetchPage(offsetRef.current, false, searchTokenRef.current);
    setLoadingMore(false);
    isFetchingMoreRef.current = false;
  }, [hasMore, trimmed, fetchPage]);

  return { results, loading, loadingMore, hasMore, loadMore, hasQuery: trimmed !== '' };
}