import { BandedScreenBackdrop } from '@/components/navigation/components/banded-screen-backdrop.component';
import { usePitchState } from '@/components/navigation/pitch-state.context';
import { PROFILE_HEADER_COLLAPSE_DISTANCE, ProfileHeader } from '@/components/profile/components/profile-header.component';
import { ProfileMvpCard } from '@/components/profile/components/profile-mvp-card.component';
import { ProfileOverviewCard } from '@/components/profile/components/profile-overview-card.component';
import { ProfileRecentGamesCard } from '@/components/profile/components/profile-recent-games-card.component';
import { ProfileSkeleton } from '@/components/profile/components/profile-skeleton';
import { useCascadingFadeIn } from '@/components/profile/hooks/use-cascading-fade-in.hook';
import {
  MOCK_MVP_BATTER_STATS,
  MOCK_MVP_PITCHER_STATS,
  MOCK_OVERVIEW_STATS,
  MOCK_RECENT_GAMES,
} from '@/components/profile/profile-dashboard.mock';
import { useCurrentProfile } from '@/hooks/use-current-profile.hook';
import { adjustHslAlpha } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const OVERVIEW_LOADING = false;
const RECENT_GAMES_LOADING = false;
const TOP_BAND_HEIGHT = 40;
const FALLBACK_HEADER_HEIGHT = 190;
const BOTTOM_EDGE_FADE_HEIGHT = 22;

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { profile, refetch } = useCurrentProfile();
  const { pastThreshold } = usePitchState();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const [headerHeight, setHeaderHeight] = useState(0);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

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
    opacity: interpolate(scrollY.value, [0, PROFILE_HEADER_COLLAPSE_DISTANCE], [1, 0], Extrapolation.CLAMP),
  }));

  const recentGamesFadeStyle = useCascadingFadeIn(0);
  const mvpBatterFadeStyle = useCascadingFadeIn(1);
  const mvpPitcherFadeStyle = useCascadingFadeIn(2);

  const hasTeamsAndGames = MOCK_OVERVIEW_STATS.teamCount > 0 && MOCK_OVERVIEW_STATS.wins + MOCK_OVERVIEW_STATS.losses > 0;

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
        <View style={{ flex: 1, position: 'relative' }}>
          <Animated.ScrollView
            className="flex-1"
            style={{ marginTop: headerTopOffset, zIndex: 0 }}
            contentContainerClassName="gap-4 pb-32"
            onScroll={scrollHandler}
            scrollEventThrottle={16}
          >
            <View style={{ height: measuredExpandedHeight }} />

            <Animated.View style={recentGamesFadeStyle}>
              {RECENT_GAMES_LOADING ? (
                <ProfileSkeleton variant="recent-games" />
              ) : (
                <ProfileRecentGamesCard games={MOCK_RECENT_GAMES} />
              )}
            </Animated.View>

            {hasTeamsAndGames && (
              <>
                <Animated.View style={mvpBatterFadeStyle}>
                  <ProfileMvpCard type="batter" stats={MOCK_MVP_BATTER_STATS} />
                </Animated.View>

                <Animated.View style={mvpPitcherFadeStyle}>
                  <ProfileMvpCard type="pitcher" stats={MOCK_MVP_PITCHER_STATS} />
                </Animated.View>
              </>
            )}
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
            <View className="gap-3 pb-3" style={{ backgroundColor: colors.muted, zIndex: 2 }}>
              <ProfileHeader username={profile?.username ?? ''} displayName={profile?.displayName ?? ''} scrollY={scrollY} />
              {OVERVIEW_LOADING ? (
                <ProfileSkeleton variant="overview" />
              ) : (
                <ProfileOverviewCard stats={MOCK_OVERVIEW_STATS} scrollY={scrollY} />
              )}
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
        </View>
      </Animated.View>
    </View>
  );
}