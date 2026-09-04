import { supabase } from '@/utils/supabase';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MOCK_PENDING_INCOMING, MOCK_PENDING_OUTGOING, USE_MOCK_FRIENDS_DATA } from '../friends.mock';
import type { PendingRequestSummary } from '../friends.types';

const PAGE_SIZE = 20;

function mapRow(row: any): PendingRequestSummary {
  return {
    friendRequestId: row.friend_request_id,
    profileId: row.profile_id,
    username: row.username,
    displayName: row.display_name,
    direction: row.direction,
    createdAt: row.created_at,
  };
}

function getMockRequests(direction: 'incoming' | 'outgoing'): PendingRequestSummary[] {
  return direction === 'incoming' ? MOCK_PENDING_INCOMING : MOCK_PENDING_OUTGOING;
}

export function usePendingRequests(direction: 'incoming' | 'outgoing') {
  const [prevDirection, setPrevDirection] = useState(direction);
  const [requests, setRequests] = useState<PendingRequestSummary[]>(
    USE_MOCK_FRIENDS_DATA ? getMockRequests(direction) : []
  );
  const [loading, setLoading] = useState(!USE_MOCK_FRIENDS_DATA);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(!USE_MOCK_FRIENDS_DATA);

  const isMountedRef = useRef(true);
  const offsetRef = useRef(0);
  const isFetchingMoreRef = useRef(false);
  const requestTokenRef = useRef(0);

  if (direction !== prevDirection) {
    setPrevDirection(direction);
    setRequests(USE_MOCK_FRIENDS_DATA ? getMockRequests(direction) : []);
    setHasMore(!USE_MOCK_FRIENDS_DATA);
    setLoading(!USE_MOCK_FRIENDS_DATA);
  }

  const fetchPage = useCallback(
    async (offset: number, replace: boolean, token: number) => {
      const { data, error } = await supabase.rpc('get_pending_requests', {
        p_direction: direction,
        p_page_limit: PAGE_SIZE,
        p_page_offset: offset,
      });

      if (!isMountedRef.current || token !== requestTokenRef.current) return;

      if (error) {
        console.error('get_pending_requests failed:', error);
        if (replace) setRequests([]);
        setHasMore(false);
        return;
      }

      const rows: PendingRequestSummary[] = (data ?? []).map(mapRow);
      setRequests((prev) => (replace ? rows : [...prev, ...rows]));
      setHasMore(rows.length === PAGE_SIZE);
      offsetRef.current = offset + rows.length;
    },
    [direction]
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
  }, [direction, fetchPage]);

  const loadMore = useCallback(async () => {
    if (USE_MOCK_FRIENDS_DATA) return;
    if (isFetchingMoreRef.current || !hasMore) return;
    isFetchingMoreRef.current = true;
    setLoadingMore(true);
    await fetchPage(offsetRef.current, false, requestTokenRef.current);
    setLoadingMore(false);
    isFetchingMoreRef.current = false;
  }, [hasMore, fetchPage]);

  const removeRequest = useCallback((friendRequestId: string) => {
    setRequests((prev) => prev.filter((request) => request.friendRequestId !== friendRequestId));
  }, []);

  return { requests, loading, loadingMore, hasMore, loadMore, removeRequest };
}