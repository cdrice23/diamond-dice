import { LoadingSpinner } from '@/components/branding/components/loading-spinner.component';
import { BandedScreenBackdrop } from '@/components/navigation/components/banded-screen-backdrop.component';
import { useNavLayout } from '@/components/navigation/nav-layout.context';
import { usePitchState } from '@/components/navigation/pitch-state.context';
import { PlayerDatabaseFadeList } from '@/components/player-database/components/player-database-fade-list.component';
import { PlayerDetailAwardsCard } from '@/components/player-database/components/player-detail-awards-card.component';
import { PlayerDetailBackButton } from '@/components/player-database/components/player-detail-back-button.component';
import { PlayerDetailBattingStatsCard } from '@/components/player-database/components/player-detail-batting-stats-card.component';
import { PlayerDetailBioCard } from '@/components/player-database/components/player-detail-bio-card.component';
import { HEIGHT_COLLAPSE_DISTANCE, PlayerDetailHeader } from '@/components/player-database/components/player-detail-header.component';
import { PlayerDetailPitchingStatsCard } from '@/components/player-database/components/player-detail-pitching-stats-card.component';
import { PlayerDetailTeamHistoryCard } from '@/components/player-database/components/player-detail-team-history-card.component';
import { usePlayerDetail } from '@/components/player-database/hooks/use-player-detail.hook';
import { useCascadingFadeIn } from '@/components/profile/hooks/use-cascading-fade-in.hook';
import { adjustHslAlpha } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NAV_CLEARANCE_EXTRA = 16;
const TOP_BAND_HEIGHT = 40;
const FALLBACK_HEADER_HEIGHT = 260;
const BOTTOM_EDGE_FADE_HEIGHT = 22;

function resolveEffectiveRoles(player: { eligible_positions: string[]; is_qualified_batter: boolean; is_qualified_pitcher: boolean }) {
  const isEffectivePitcher = player.eligible_positions.includes('P') && player.is_qualified_pitcher;
  const isEffectiveBatter =
    player.eligible_positions.some((position) => position !== 'P') && player.is_qualified_batter;
  return { isEffectiveBatter, isEffectivePitcher };
}

export default function PlayerDetailScreen() {
  const { playerId } = useLocalSearchParams<{ playerId: string }>();
  const { colors } = useTheme();
  const { pastThreshold } = usePitchState();
  const { navTopY } = useNavLayout();
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { player, teamHistory, awardSummaries, loading, error } = usePlayerDetail(playerId);
  const scrollY = useSharedValue(0);
  const [headerHeight, setHeaderHeight] = useState(0);

  const headerTopOffset = insets.top + TOP_BAND_HEIGHT;
  const measuredExpandedHeight = headerHeight || FALLBACK_HEADER_HEIGHT;

  const bottomFadeStops: [string, string, string] = [
    adjustHslAlpha(colors.muted, 1),
    adjustHslAlpha(colors.muted, 0.5),
    adjustHslAlpha(colors.muted, 0),
  ];

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const contentFadeStyle = useAnimatedStyle(() => ({
    opacity: 1 - pastThreshold.value,
  }));

  const bottomFadeSolidStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HEIGHT_COLLAPSE_DISTANCE], [1, 0], Extrapolation.CLAMP),
  }));

  const bioFadeStyle = useCascadingFadeIn(0, { enabled: !loading });
  const battingFadeStyle = useCascadingFadeIn(1, { enabled: !loading });
  const pitchingFadeStyle = useCascadingFadeIn(2, { enabled: !loading });
  const teamHistoryFadeStyle = useCascadingFadeIn(3, { enabled: !loading });
  const awardsFadeStyle = useCascadingFadeIn(4, { enabled: !loading });

  const navClearance = (navTopY !== null ? screenHeight - navTopY : 116) + NAV_CLEARANCE_EXTRA;

  if (loading) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <LoadingSpinner size={80} />
      </View>
    );
  }

  if (error || !player) {
    return (
      <View className="bg-background flex-1 items-center justify-center gap-4 px-8">
        <Text className="text-foreground text-center text-xl font-semibold">Player not found</Text>
        <PlayerDetailBackButton />
      </View>
    );
  }

  const { isEffectiveBatter, isEffectivePitcher } = resolveEffectiveRoles(player);

  return (
    <View style={{ flex: 1 }}>
      <BandedScreenBackdrop
        svgColor={colors.primary}
        backgroundColor={colors.background}
        topBandHeight={TOP_BAND_HEIGHT}
        topBandBackgroundColor={colors.muted}
        topBandSvgColor={colors.level2}
      />
      <Animated.View style={[{ flex: 1 }, contentFadeStyle]}>
        <View style={{ flex: 1, paddingBottom: navClearance, position: 'relative' }}>
          <Animated.ScrollView
            className="flex-1"
            style={{ marginTop: headerTopOffset, zIndex: 0 }}
            contentContainerStyle={{ gap: 16, paddingBottom: 24 }}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
          >
            <View style={{ height: measuredExpandedHeight }} />
            <Animated.View style={bioFadeStyle}>
              <PlayerDetailBioCard player={player} />
            </Animated.View>
            {isEffectiveBatter && (
              <Animated.View style={battingFadeStyle}>
                <PlayerDetailBattingStatsCard player={player} />
              </Animated.View>
            )}
            {isEffectivePitcher && (
              <Animated.View style={pitchingFadeStyle}>
                <PlayerDetailPitchingStatsCard player={player} />
              </Animated.View>
            )}
            <Animated.View style={teamHistoryFadeStyle}>
              <PlayerDetailTeamHistoryCard teamHistory={teamHistory} />
            </Animated.View>
            <Animated.View style={awardsFadeStyle}>
              <PlayerDetailAwardsCard awardSummaries={awardSummaries} />
            </Animated.View>
          </Animated.ScrollView>

          <View
            onLayout={(event) => {
              if (headerHeight === 0) {
                setHeaderHeight(event.nativeEvent.layout.height);
              }
            }}
            className="absolute left-0 right-0"
            style={{ top: headerTopOffset, zIndex: 10 }}
          >
            <View className="gap-3" style={{ backgroundColor: colors.muted, zIndex: 2 }}>
              <PlayerDetailBackButton />
              <PlayerDetailHeader player={player} scrollY={scrollY} />
            </View>

            <View pointerEvents="none" style={{ height: BOTTOM_EDGE_FADE_HEIGHT, zIndex: 1 }}>
              <LinearGradient
                colors={bottomFadeStops}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Animated.View
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, { backgroundColor: colors.muted }, bottomFadeSolidStyle]}
              />
            </View>
          </View>

          <PlayerDatabaseFadeList backgroundColor={colors.background} bottomInset={navClearance} />
        </View>
      </Animated.View>
    </View>
  );
}