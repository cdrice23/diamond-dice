import { AnimatedCascadeItem } from '@/components/primitives/animated-cascade-item.component';
import { CardSectionHeader } from '@/components/primitives/card-section-header.component';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { ActivityIndicator, FlatList, View } from 'react-native';
import type { FriendSummary } from '../friends.types';
import { FriendRow } from './friend-row.component';

const INITIAL_PAGE_SIZE = 20;

type FriendsCardProps = {
  friends: FriendSummary[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onlineProfileIds: Set<string>;
  onLoadMore: () => void;
  onFriendPress: (friend: FriendSummary) => void;
};

export function FriendsCard({
  friends,
  loading,
  loadingMore,
  hasMore,
  onlineProfileIds,
  onLoadMore,
  onFriendPress,
}: FriendsCardProps) {
  const { colors } = useTheme();

  return (
    <View className="bg-card border-border mx-4 mb-4 flex-1 rounded-lg border p-4 shadow-sm shadow-black/5">
      <CardSectionHeader label="Friends" />

      {loading ? (
        <ActivityIndicator color={colors.mutedForeground} />
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.profileId}
          renderItem={({ item, index }) => (
            <AnimatedCascadeItem
              index={index}
              staggerDelayMs={40}
              fadeDurationMs={300}
              translateYStart={6}
              enabled={index < INITIAL_PAGE_SIZE}
            >
              <View style={index > 0 ? { borderTopWidth: 1, borderColor: colors.border } : undefined}>
                <FriendRow
                  username={item.username}
                  displayName={item.displayName}
                  isOnline={onlineProfileIds.has(item.profileId)}
                  onPress={() => onFriendPress(item)}
                />
              </View>
            </AnimatedCascadeItem>
          )}
          onEndReached={() => {
            if (hasMore) onLoadMore();
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <Text variant="muted" className="py-6 text-center text-sm">
              No friends yet — tap + to add some!
            </Text>
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator className="py-3" color={colors.mutedForeground} /> : null}
        />
      )}
    </View>
  );
}