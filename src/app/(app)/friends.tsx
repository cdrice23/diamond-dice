import { AddFriendModal } from '@/components/friends/components/add-friend-modal.component';
import { FriendRequestsCard } from '@/components/friends/components/friend-requests-card.component';
import { FriendsCard } from '@/components/friends/components/friends-card.component';
import { FriendsHeader } from '@/components/friends/components/friends-header.component';
import { RequestGameModal } from '@/components/friends/components/request-game-modal.component';
import { MOCK_PENDING_INCOMING, USE_MOCK_FRIENDS_DATA } from '@/components/friends/friends.mock';
import type { FriendSummary, PendingRequestSummary } from '@/components/friends/friends.types';
import { useFriendRequests } from '@/components/friends/hooks/use-friend-requests.hook';
import { useFriendsList } from '@/components/friends/hooks/use-friends-list.hook';
import { useFriendsPresence } from '@/components/friends/hooks/use-friends-presence.hook';
import { BandedScreenBackdrop } from '@/components/navigation/components/banded-screen-backdrop.component';
import { useNavLayout } from '@/components/navigation/nav-layout.context';
import { usePitchState } from '@/components/navigation/pitch-state.context';
import { supabase } from '@/utils/supabase';
import { useTheme } from '@/utils/theme-provider';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

const REQUEST_PREVIEW_LIMIT = 3;
const NAV_CLEARANCE_EXTRA = 16;

function mapPendingRow(row: any): PendingRequestSummary {
  return {
    friendRequestId: row.friend_request_id,
    profileId: row.profile_id,
    username: row.username,
    displayName: row.display_name,
    direction: row.direction,
    createdAt: row.created_at,
  };
}

export default function FriendsScreen() {
  const { colors } = useTheme();
  const { pastThreshold } = usePitchState();
  const { navTopY } = useNavLayout();
  const { height: screenHeight } = useWindowDimensions();
  const router = useRouter();

  const { friends, loading: friendsLoading, loadingMore, hasMore, loadMore } = useFriendsList();
  const onlineProfileIds = useFriendsPresence();
  const { acceptFriendRequest, rejectFriendRequest } = useFriendRequests();

  const [requestPreview, setRequestPreview] = useState<PendingRequestSummary[]>([]);
  const [requestTotalCount, setRequestTotalCount] = useState(0);
  const [selectedFriend, setSelectedFriend] = useState<FriendSummary | null>(null);
  const [addFriendVisible, setAddFriendVisible] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchRequestPreview = useCallback(async () => {
    if (USE_MOCK_FRIENDS_DATA) {
      setRequestPreview(MOCK_PENDING_INCOMING.slice(0, REQUEST_PREVIEW_LIMIT));
      setRequestTotalCount(MOCK_PENDING_INCOMING.length);
      return;
    }

    const [previewResult, countResult] = await Promise.all([
      supabase.rpc('get_pending_requests', {
        p_direction: 'incoming',
        p_page_limit: REQUEST_PREVIEW_LIMIT,
        p_page_offset: 0,
      }),
      supabase.rpc('get_pending_incoming_count'),
    ]);

    if (!isMountedRef.current) return;

    if (!previewResult.error) {
      setRequestPreview((previewResult.data ?? []).map(mapPendingRow));
    }
    if (!countResult.error && typeof countResult.data === 'number') {
      setRequestTotalCount(countResult.data);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRequestPreview();
  }, [fetchRequestPreview]);

  async function handleAccept(friendRequestId: string) {
    await acceptFriendRequest(friendRequestId);
    await fetchRequestPreview();
  }

  async function handleReject(friendRequestId: string) {
    await rejectFriendRequest(friendRequestId);
    await fetchRequestPreview();
  }

  const contentFadeStyle = useAnimatedStyle(() => ({
    opacity: 1 - pastThreshold.value,
  }));

  const navClearance = (navTopY !== null ? screenHeight - navTopY : 116) + NAV_CLEARANCE_EXTRA;

  return (
    <View style={{ flex: 1 }}>
      <BandedScreenBackdrop svgColor={colors.primary} backgroundColor={colors.background} topBandHeight={40} />
      <Animated.View style={[{ flex: 1 }, contentFadeStyle]}>
        <FriendsHeader
          hasPendingRequests={false}
          onMailboxPress={() => router.push('/mailbox')}
          onAddFriendPress={() => setAddFriendVisible(true)}
        />

        <View className="flex-1 gap-4" style={{ paddingBottom: navClearance }}>
          {requestTotalCount > 0 && (
            <FriendRequestsCard
              requests={requestPreview}
              totalCount={requestTotalCount}
              onAccept={handleAccept}
              onReject={handleReject}
              onViewAllPress={() => router.push('/mailbox')}
            />
          )}

          <FriendsCard
            friends={friends}
            loading={friendsLoading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onlineProfileIds={onlineProfileIds}
            onLoadMore={loadMore}
            onFriendPress={setSelectedFriend}
          />
        </View>

        <RequestGameModal
          visible={selectedFriend !== null}
          friendDisplayName={selectedFriend?.displayName ?? null}
          onDismiss={() => setSelectedFriend(null)}
        />
      </Animated.View>

      <AddFriendModal visible={addFriendVisible} onDismiss={() => setAddFriendVisible(false)} />
    </View>
  );
}