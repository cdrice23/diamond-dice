import { AddFriendModal } from '@/components/friends/components/add-friend-modal.component';
import { FriendRow } from '@/components/friends/components/friend-row.component';
import { FriendsFilterBar } from '@/components/friends/components/friends-filter-bar.component';
import { FriendsHeader } from '@/components/friends/components/friends-header.component';
import { FriendsSearchInput } from '@/components/friends/components/friends-search-input.component';
import { RequestGameModal } from '@/components/friends/components/request-game-modal.component';
import { MOCK_HAS_PENDING_REQUESTS, USE_MOCK_FRIENDS_DATA } from '@/components/friends/friends.mock';
import type { FriendSummary } from '@/components/friends/friends.types';
import { useFriendsList } from '@/components/friends/hooks/use-friends-list.hook';
import { useFriendsPresence } from '@/components/friends/hooks/use-friends-presence.hook';
import { BandedScreenBackdrop } from '@/components/navigation/components/banded-screen-backdrop.component';
import { useNavLayout } from '@/components/navigation/nav-layout.context';
import { usePitchState } from '@/components/navigation/pitch-state.context';
import { PlayerDatabaseFadeList } from '@/components/player-database/components/player-database-fade-list.component';
import { PlayerDatabaseRowSkeleton } from '@/components/player-database/components/player-database-row-skeleton.component';
import { AnimatedCascadeItem } from '@/components/primitives/animated-cascade-item.component';
import { Text } from '@/components/primitives/text.component';
import { supabase } from '@/utils/supabase';
import { useTheme } from '@/utils/theme-provider';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

const NAV_CLEARANCE_EXTRA = 16;

export default function FriendsScreen() {
  const { colors } = useTheme();
  const { pastThreshold } = usePitchState();
  const { navTopY } = useNavLayout();
  const { height: screenHeight } = useWindowDimensions();
  const router = useRouter();

  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<FriendSummary | null>(null);
  const [addFriendVisible, setAddFriendVisible] = useState(false);
  const [hasPendingRequests, setHasPendingRequests] = useState(false);

  const { friends, loading, loadingMore, hasMore, loadMore } = useFriendsList(searchTerm);
  const onlineProfileIds = useFriendsPresence();

  const isMountedRef = useRef(true);
  const hasTriggeredMoreRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchHasPendingRequests = useCallback(async () => {
    if (USE_MOCK_FRIENDS_DATA) {
      setHasPendingRequests(MOCK_HAS_PENDING_REQUESTS);
      return;
    }

    const { data, error } = await supabase.rpc('get_pending_incoming_count');
    if (!isMountedRef.current) return;
    if (!error && typeof data === 'number') {
      setHasPendingRequests(data > 0);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHasPendingRequests();
  }, [fetchHasPendingRequests]);

  const displayedFriends = useMemo(
    () => (onlineOnly ? friends.filter((friend) => onlineProfileIds.has(friend.profileId)) : friends),
    [friends, onlineOnly, onlineProfileIds]
  );

  const hasActiveFilters = searchTerm.trim() !== '' || onlineOnly;

  function handleClearAll() {
    setInputValue('');
    setSearchTerm('');
    setOnlineOnly(false);
  }

  const handleEndReached = useCallback(() => {
    if (hasTriggeredMoreRef.current || !hasMore) return;
    hasTriggeredMoreRef.current = true;
    loadMore().finally(() => {
      hasTriggeredMoreRef.current = false;
    });
  }, [hasMore, loadMore]);

  const contentFadeStyle = useAnimatedStyle(() => ({
    opacity: 1 - pastThreshold.value,
  }));

  const navClearance = (navTopY !== null ? screenHeight - navTopY : 116) + NAV_CLEARANCE_EXTRA;

  return (
    <View style={{ flex: 1 }}>
      <BandedScreenBackdrop svgColor={colors.primary} backgroundColor={colors.background} topBandHeight={40} />
      <Animated.View style={[{ flex: 1 }, contentFadeStyle]}>
        <FriendsHeader
          hasPendingRequests={hasPendingRequests}
          onMailboxPress={() => router.push('/mailbox')}
          onAddFriendPress={() => setAddFriendVisible(true)}
        />

        <FriendsSearchInput value={inputValue} onChangeText={setInputValue} onSearchTermChange={setSearchTerm} />
        <FriendsFilterBar
          onlineOnly={onlineOnly}
          onOnlineOnlyChange={setOnlineOnly}
          hasActiveFilters={hasActiveFilters}
          onClearAll={handleClearAll}
        />

        <View style={{ flex: 1, paddingBottom: navClearance, position: 'relative' }}>
          {loading ? (
            <View className="px-4 pt-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <PlayerDatabaseRowSkeleton key={i} isFirst={i === 0} indexInBatch={i} />
              ))}
            </View>
          ) : displayedFriends.length === 0 ? (
            <Text variant="muted" className="px-8 pt-12 text-center text-base">
              No friends match your filters.
            </Text>
          ) : (
            <FlatList
              data={displayedFriends}
              keyExtractor={(item) => item.profileId}
              renderItem={({ item, index }) => (
                <AnimatedCascadeItem index={index} staggerDelayMs={40} fadeDurationMs={300} translateYStart={6}>
                  <View style={index > 0 ? { borderTopWidth: 1, borderColor: colors.border } : undefined}>
                    <FriendRow
                      username={item.username}
                      displayName={item.displayName}
                      isOnline={onlineProfileIds.has(item.profileId)}
                      onPress={() => setSelectedFriend(item)}
                    />
                  </View>
                </AnimatedCascadeItem>
              )}
              onEndReached={hasMore ? handleEndReached : undefined}
              onEndReachedThreshold={0.5}
              contentContainerClassName="px-4 pb-6"
              contentContainerStyle={{ paddingTop: 8 }}
              ListFooterComponent={
                loadingMore ? (
                  <View>
                    {Array.from({ length: 2 }).map((_, i) => (
                      <PlayerDatabaseRowSkeleton key={i} isFirst={false} indexInBatch={i} />
                    ))}
                  </View>
                ) : null
              }
            />
          )}
          <PlayerDatabaseFadeList backgroundColor={colors.background} bottomInset={navClearance} />
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