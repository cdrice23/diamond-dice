import { BandedScreenBackdrop } from '@/components/navigation/components/banded-screen-backdrop.component';
import { useNavLayout } from '@/components/navigation/nav-layout.context';
import { usePitchState } from '@/components/navigation/pitch-state.context';
import { PlayerDatabaseFadeList } from '@/components/player-database/components/player-database-fade-list.component';
import { PlayerDatabaseHeader } from '@/components/player-database/components/player-database-header.component';
import { PlayerDatabaseRowSkeleton } from '@/components/player-database/components/player-database-row-skeleton.component';
import { PlayerDatabaseRow } from '@/components/player-database/components/player-database-row.component';
import {
  usePlayerDatabaseSearch,
  type PlayerDatabaseRow as PlayerDatabaseRowData,
} from '@/components/player-database/hooks/use-player-database-search.hook';
import { useTheme } from '@/utils/theme-provider';
import { FlatList, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

const PAGE_SIZE = 20;

function deriveLevel(row: PlayerDatabaseRowData): 1 | 2 | 3 {
  const relevantLevel = row.is_qualified_batter ? row.batting_rating_level : row.pitching_rating_level;
  return (relevantLevel ?? 1) as 1 | 2 | 3;
}

export default function PlayerDatabaseScreen() {
  const { colors } = useTheme();
  const { pastThreshold } = usePitchState();
  const { navTopY } = useNavLayout();
  const { height: screenHeight } = useWindowDimensions();
  const { players, loading, loadingMore, loadMore } = usePlayerDatabaseSearch();

  const contentFadeStyle = useAnimatedStyle(() => ({
    opacity: 1 - pastThreshold.value,
  }));

  const navClearance = navTopY !== null ? screenHeight - navTopY : 116;

  function renderItem({ item, index }: { item: PlayerDatabaseRowData; index: number }) {
    return (
      <PlayerDatabaseRow
        id={item.id}
        name={item.name}
        isQualifiedBatter={item.is_qualified_batter}
        isQualifiedPitcher={item.is_qualified_pitcher}
        level={deriveLevel(item)}
        isFirst={index === 0}
        indexInBatch={item.indexInBatch}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <BandedScreenBackdrop svgColor={colors.primary} backgroundColor={colors.background} />
      <Animated.View style={[{ flex: 1 }, contentFadeStyle]}>
        <PlayerDatabaseHeader />
        <View style={{ flex: 1, paddingBottom: navClearance }}>
          {loading ? (
            <View className="px-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <PlayerDatabaseRowSkeleton key={index} isFirst={index === 0} />
              ))}
            </View>
          ) : (
            <FlatList
              data={players}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerClassName="px-4"
              onEndReached={loadMore}
              onEndReachedThreshold={0.4}
              removeClippedSubviews={true}
              maxToRenderPerBatch={PAGE_SIZE}
              windowSize={7}
              initialNumToRender={PAGE_SIZE}
              ListFooterComponent={
                loadingMore ? (
                  <View className="mt-1">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <PlayerDatabaseRowSkeleton key={index} isFirst={index === 0} />
                    ))}
                  </View>
                ) : null
              }
            />
          )}
          <PlayerDatabaseFadeList backgroundColor={colors.background} />
        </View>
      </Animated.View>
    </View>
  );
}