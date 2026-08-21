import { BandedScreenBackdrop } from '@/components/navigation/components/banded-screen-backdrop.component';
import { useNavLayout } from '@/components/navigation/nav-layout.context';
import { usePitchState } from '@/components/navigation/pitch-state.context';
import { PlayerDatabaseEmptyState } from '@/components/player-database/components/player-database-empty-state.component';
import { PlayerDatabaseFadeList } from '@/components/player-database/components/player-database-fade-list.component';
import { PlayerDatabaseFilterBar } from '@/components/player-database/components/player-database-filter-bar.component';
import { PlayerDatabaseHeader } from '@/components/player-database/components/player-database-header.component';
import { PlayerDatabaseRowSkeleton } from '@/components/player-database/components/player-database-row-skeleton.component';
import { PlayerDatabaseRow } from '@/components/player-database/components/player-database-row.component';
import { PlayerDatabaseSearchInput } from '@/components/player-database/components/player-database-search-input.component';
import {
  PAGE_SIZE,
  usePlayerDatabaseSearch,
  type PlayerDatabaseRow as PlayerDatabaseRowData,
} from '@/components/player-database/hooks/use-player-database-search.hook';
import { DEFAULT_FILTERS, NEUTRAL_FILTER_COLOR } from '@/components/player-database/player-database.constants';
import type { EffectiveRoles, PlayerDatabaseFilters, PlayerType } from '@/components/player-database/player-database.types';
import { useTheme } from '@/utils/theme-provider';
import { useCallback, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { FlatList, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

const TOP_SCROLL_THRESHOLD = 200;
const NAV_CLEARANCE_EXTRA = 16;
const REQUIRED_NEAR_TOP_STREAK = 3;

function resolveEffectiveRoles(row: PlayerDatabaseRowData): EffectiveRoles {
  const isEffectivePitcher = row.eligible_positions.includes('P') && row.is_qualified_pitcher;
  const isEffectiveBatter =
    row.eligible_positions.some((position) => position !== 'P') && row.is_qualified_batter;

  return {
    isEffectiveBatter,
    isEffectivePitcher,
    isTwoWay: isEffectiveBatter && isEffectivePitcher,
  };
}

function colorForLevel(
  level: number | null,
  colors: ReturnType<typeof useTheme>['colors']
): string {
  if (level === 1) return colors.level1;
  if (level === 2) return colors.level2;
  if (level === 3) return colors.level3;
  return colors.muted;
}

function deriveLevelDisplay(row: PlayerDatabaseRowData, activePlayerType: PlayerType): string {
  const { isEffectiveBatter, isTwoWay } = resolveEffectiveRoles(row);

  if (isTwoWay) {
    if (activePlayerType === 'batter') {
      return row.batting_rating_level != null ? `Lvl. ${row.batting_rating_level}` : '--';
    }
    if (activePlayerType === 'pitcher') {
      return row.pitching_rating_level != null ? `Lvl. ${row.pitching_rating_level}` : '--';
    }
    const battingPart = row.batting_rating_level ?? '--';
    const pitchingPart = row.pitching_rating_level ?? '--';
    return `Lvl. ${battingPart} | ${pitchingPart}`;
  }

  const relevantLevel = isEffectiveBatter ? row.batting_rating_level : row.pitching_rating_level;
  return relevantLevel != null ? `Lvl. ${relevantLevel}` : '--';
}

function deriveLevelColor(
  row: PlayerDatabaseRowData,
  activePlayerType: PlayerType,
  colors: ReturnType<typeof useTheme>['colors'],
  colorScheme: 'light' | 'dark'
): string {
  const { isEffectiveBatter, isTwoWay } = resolveEffectiveRoles(row);

  if (isTwoWay) {
    if (activePlayerType === 'batter') return colorForLevel(row.batting_rating_level, colors);
    if (activePlayerType === 'pitcher') return colorForLevel(row.pitching_rating_level, colors);
    return NEUTRAL_FILTER_COLOR[colorScheme];
  }

  const relevantLevel = isEffectiveBatter ? row.batting_rating_level : row.pitching_rating_level;
  return colorForLevel(relevantLevel, colors);
}

export default function PlayerDatabaseScreen() {
  const { colors, colorScheme } = useTheme();
  const { pastThreshold } = usePitchState();
  const { navTopY } = useNavLayout();
  const { height: screenHeight } = useWindowDimensions();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<PlayerDatabaseFilters>(DEFAULT_FILTERS);
  const {
    players,
    loading,
    loadingMore,
    loadingPrevious,
    hasPrevious,
    latestBatch,
    loadMore,
    loadPrevious,
    flushEviction,
  } = usePlayerDatabaseSearch(searchTerm, filters);

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
    const { isEffectiveBatter, isEffectivePitcher } = resolveEffectiveRoles(item);

    return (
      <PlayerDatabaseRow
        id={item.id}
        name={item.name}
        eligiblePositions={item.eligible_positions}
        isQualifiedBatter={isEffectiveBatter}
        isQualifiedPitcher={isEffectivePitcher}
        levelDisplay={deriveLevelDisplay(item, filters.playerType)}
        levelColor={deriveLevelColor(item, filters.playerType, colors, colorScheme)}
        isFirst={index === 0}
        indexInBatch={item.indexInBatch}
        animate={isFromLatestBatch}
        reverseEntrance={reverseEntrance}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <BandedScreenBackdrop svgColor={colors.primary} backgroundColor={colors.background} topBandHeight={40} />
      <Animated.View style={[{ flex: 1 }, contentFadeStyle]}>
        <PlayerDatabaseHeader />
        <PlayerDatabaseSearchInput onSearchTermChange={setSearchTerm} />
        <PlayerDatabaseFilterBar filters={filters} onFiltersChange={setFilters} />
        <View style={{ flex: 1, paddingBottom: navClearance, position: 'relative' }}>
          {loading ? (
            <View className="px-4">
              {Array.from({ length: 2 }).map((_, index) => (
                <PlayerDatabaseRowSkeleton key={index} isFirst={index === 0} indexInBatch={index} />
              ))}
            </View>
          ) : players.length === 0 ? (
            <PlayerDatabaseEmptyState />
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
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
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