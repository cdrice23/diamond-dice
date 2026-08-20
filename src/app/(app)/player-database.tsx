import { BandedScreenBackdrop } from '@/components/navigation/components/banded-screen-backdrop.component';
import { useNavLayout } from '@/components/navigation/nav-layout.context';
import { usePitchState } from '@/components/navigation/pitch-state.context';
import { PlayerDatabaseFadeList } from '@/components/player-database/components/player-database-fade-list.component';
import { PlayerDatabaseHeader } from '@/components/player-database/components/player-database-header.component';
import { PlayerDatabaseRowSkeleton } from '@/components/player-database/components/player-database-row-skeleton.component';
import { PlayerDatabaseRow } from '@/components/player-database/components/player-database-row.component';
import {
  PAGE_SIZE,
  usePlayerDatabaseSearch,
  type PlayerDatabaseRow as PlayerDatabaseRowData,
} from '@/components/player-database/hooks/use-player-database-search.hook';
import { useTheme } from '@/utils/theme-provider';
import { useCallback, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { FlatList, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

const TOP_SCROLL_THRESHOLD = 200;
const NAV_CLEARANCE_EXTRA = 16;
const REQUIRED_NEAR_TOP_STREAK = 3;

function deriveLevel(row: PlayerDatabaseRowData): 1 | 2 | 3 {
  const relevantLevel = row.is_qualified_batter ? row.batting_rating_level : row.pitching_rating_level;
  return (relevantLevel ?? 1) as 1 | 2 | 3;
}

export default function PlayerDatabaseScreen() {
  const { colors } = useTheme();
  const { pastThreshold } = usePitchState();
  const { navTopY } = useNavLayout();
  const { height: screenHeight } = useWindowDimensions();
  const { players, loading, loadingMore, loadingPrevious, hasPrevious, latestBatch, loadMore, loadPrevious, flushEviction } =
    usePlayerDatabaseSearch();

  const hasTriggeredPreviousRef = useRef(false);
  const hasTriggeredMoreRef = useRef(false);
  const nearTopStreakRef = useRef(0);

  const contentFadeStyle = useAnimatedStyle(() => ({
    opacity: 1 - pastThreshold.value,
  }));

  const navClearance = (navTopY !== null ? screenHeight - navTopY : 116) + NAV_CLEARANCE_EXTRA;

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;

      if (offsetY < TOP_SCROLL_THRESHOLD) {
        nearTopStreakRef.current += 1;
      } else {
        nearTopStreakRef.current = 0;
        return;
      }

      if (
        nearTopStreakRef.current >= REQUIRED_NEAR_TOP_STREAK &&
        hasPrevious &&
        !loadingPrevious &&
        !hasTriggeredPreviousRef.current
      ) {
        hasTriggeredPreviousRef.current = true;
        loadPrevious().finally(() => {
          hasTriggeredPreviousRef.current = false;
          nearTopStreakRef.current = 0;
        });
      }
    },
    [hasPrevious, loadingPrevious, loadPrevious]
  );

  const handleEndReached = useCallback(() => {
    if (hasTriggeredMoreRef.current) return;
    hasTriggeredMoreRef.current = true;

    requestAnimationFrame(() => {
      loadMore().finally(() => {
        hasTriggeredMoreRef.current = false;
      });
    });
  }, [loadMore]);

  const handleMomentumScrollEnd = useCallback(() => {
    flushEviction();
  }, [flushEviction]);

  function renderItem({ item, index }: { item: PlayerDatabaseRowData; index: number }) {
    const isFromLatestBatch = latestBatch !== null && item.batchId === latestBatch.id;
    const reverseEntrance = isFromLatestBatch && latestBatch?.direction === 'backward';

    return (
      <PlayerDatabaseRow
        id={item.id}
        name={item.name}
        isQualifiedBatter={item.is_qualified_batter}
        isQualifiedPitcher={item.is_qualified_pitcher}
        level={deriveLevel(item)}
        isFirst={index === 0}
        indexInBatch={item.indexInBatch}
        animate={isFromLatestBatch}
        reverseEntrance={reverseEntrance}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <BandedScreenBackdrop svgColor={colors.primary} backgroundColor={colors.background} />
      <Animated.View style={[{ flex: 1 }, contentFadeStyle]}>
        <PlayerDatabaseHeader />
        <View style={{ flex: 1, paddingBottom: navClearance, position: 'relative' }}>
          {loading ? (
            <View className="px-4">
              {Array.from({ length: 2 }).map((_, index) => (
                <PlayerDatabaseRowSkeleton key={index} isFirst={index === 0} indexInBatch={index} />
              ))}
            </View>
          ) : (
            <FlatList
              data={players}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerClassName="px-4 pt-2 pb-6"
              onEndReached={handleEndReached}
              onEndReachedThreshold={1}
              onScroll={handleScroll}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              scrollEventThrottle={100}
              removeClippedSubviews={true}
              maxToRenderPerBatch={PAGE_SIZE}
              windowSize={15}
              initialNumToRender={PAGE_SIZE}
              maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
              ListHeaderComponent={
                loadingPrevious ? (
                  <View>
                    {Array.from({ length: 2 }).map((_, index) => (
                      <PlayerDatabaseRowSkeleton key={index} isFirst={index === 0} indexInBatch={index} reverseEntrance />
                    ))}
                  </View>
                ) : null
              }
              ListFooterComponent={
                loadingMore ? (
                  <View>
                    {Array.from({ length: 2 }).map((_, index) => (
                      <PlayerDatabaseRowSkeleton key={index} isFirst={index === 0} indexInBatch={index} />
                    ))}
                  </View>
                ) : null
              }
            />
          )}
          <PlayerDatabaseFadeList backgroundColor={colors.background} bottomInset={navClearance} />
        </View>
      </Animated.View>
    </View>
  );
}