import { FriendRequestRow } from '@/components/friends/components/friend-request-row.component';
import { SentRequestRow } from '@/components/friends/components/sent-request-row.component';
import { useFriendRequests } from '@/components/friends/hooks/use-friend-requests.hook';
import { usePendingRequests } from '@/components/friends/hooks/use-pending-requests.hook';
import { BandedScreenBackdrop } from '@/components/navigation/components/banded-screen-backdrop.component';
import { useNavLayout } from '@/components/navigation/nav-layout.context';
import { usePitchState } from '@/components/navigation/pitch-state.context';
import { AnimatedCascadeItem } from '@/components/primitives/animated-cascade-item.component';
import { ScreenDetailBackButton } from '@/components/primitives/screen-detail-back-button.component';
import { Text } from '@/components/primitives/text.component';
import { useTheme } from '@/utils/theme-provider';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type MailboxTab = 'pending' | 'sent';

const TOP_BAND_HEIGHT = 40;
const CASCADE_PAGE_SIZE = 20;
const NAV_CLEARANCE_EXTRA = 16;

export default function MailboxScreen() {
  const { colors } = useTheme();
  const { pastThreshold } = usePitchState();
  const { navTopY } = useNavLayout();
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<MailboxTab>('pending');
  const [switchCount, setSwitchCount] = useState(0);

  const incoming = usePendingRequests('incoming');
  const outgoing = usePendingRequests('outgoing');
  const { acceptFriendRequest, rejectFriendRequest } = useFriendRequests();

  function handleTabPress(tab: MailboxTab) {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setSwitchCount((prev) => prev + 1);
  }

  async function handleAccept(friendRequestId: string) {
    await acceptFriendRequest(friendRequestId);
    incoming.removeRequest(friendRequestId);
  }

  async function handleReject(friendRequestId: string) {
    await rejectFriendRequest(friendRequestId);
    incoming.removeRequest(friendRequestId);
  }

  const contentFadeStyle = useAnimatedStyle(() => ({
    opacity: 1 - pastThreshold.value,
  }));

  const headerTopOffset = insets.top + TOP_BAND_HEIGHT;
  const navClearance = (navTopY !== null ? screenHeight - navTopY : 116) + NAV_CLEARANCE_EXTRA;
  const active = activeTab === 'pending' ? incoming : outgoing;

  return (
    <View style={{ flex: 1 }}>
      <BandedScreenBackdrop svgColor={colors.primary} backgroundColor={colors.background} topBandHeight={TOP_BAND_HEIGHT} />
      <Animated.View style={[{ flex: 1 }, contentFadeStyle]}>
        <View style={{ marginTop: headerTopOffset }} className="gap-1 pb-2">
          <ScreenDetailBackButton flat onPress={() => router.replace('/friends')} />
          <Text className="text-foreground px-3 text-3xl font-bold">Friend Requests</Text>
        </View>

        <View className="flex-row px-4 pb-3 pt-2 gap-2">
          <Pressable
            onPress={() => handleTabPress('pending')}
            className="flex-1 items-center rounded-sm py-2.5 active:opacity-80"
            style={{ backgroundColor: activeTab === 'pending' ? colors.level2 : colors.muted }}
          >
            <Text style={{ color: activeTab === 'pending' ? '#F7F7F7' : colors.mutedForeground }} className="font-semibold">
              Pending
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleTabPress('sent')}
            className="flex-1 items-center rounded-sm py-2.5 active:opacity-80"
            style={{ backgroundColor: activeTab === 'sent' ? colors.level2 : colors.muted }}
          >
            <Text style={{ color: activeTab === 'sent' ? '#F7F7F7' : colors.mutedForeground }} className="font-semibold">
              Sent
            </Text>
          </Pressable>
        </View>

        <View className="bg-card border-border mx-4 mb-4 flex-1 rounded-lg border p-4 shadow-sm shadow-black/5" style={{ marginBottom: navClearance }}>
          {active.loading ? (
            <ActivityIndicator color={colors.mutedForeground} />
          ) : (
            <FlatList
              key={`${activeTab}-${switchCount}`}
              data={active.requests}
              keyExtractor={(item) => item.friendRequestId}
              renderItem={({ item, index }) => (
                <AnimatedCascadeItem
                  index={index}
                  staggerDelayMs={40}
                  fadeDurationMs={300}
                  translateYStart={6}
                  enabled={index < CASCADE_PAGE_SIZE}
                >
                  <View style={index > 0 ? { borderTopWidth: 1, borderColor: colors.border } : undefined}>
                    {activeTab === 'pending' ? (
                      <FriendRequestRow
                        username={item.username}
                        displayName={item.displayName}
                        onAccept={() => handleAccept(item.friendRequestId)}
                        onReject={() => handleReject(item.friendRequestId)}
                      />
                    ) : (
                      <SentRequestRow username={item.username} displayName={item.displayName} createdAt={item.createdAt} />
                    )}
                  </View>
                </AnimatedCascadeItem>
              )}
              onEndReached={() => {
                if (active.hasMore) active.loadMore();
              }}
              onEndReachedThreshold={0.4}
              ListEmptyComponent={
                <Text variant="muted" className="py-6 text-center text-sm">
                  {activeTab === 'pending' ? 'No pending requests' : 'No sent requests'}
                </Text>
              }
              ListFooterComponent={active.loadingMore ? <ActivityIndicator className="py-3" color={colors.mutedForeground} /> : null}
            />
          )}
        </View>
      </Animated.View>
    </View>
  );
}