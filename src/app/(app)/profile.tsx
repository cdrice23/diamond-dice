import { BandedScreenBackdrop } from '@/components/navigation/components/banded-screen-backdrop.component';
import { ProfileHeader } from '@/components/profile/components/profile-header.component';
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
import { useTheme } from '@/utils/theme-provider';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';

const OVERVIEW_LOADING = false;
const RECENT_GAMES_LOADING = false;

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { profile, refetch } = useCurrentProfile();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const overviewFadeStyle = useCascadingFadeIn(0);
  const recentGamesFadeStyle = useCascadingFadeIn(1);
  const mvpBatterFadeStyle = useCascadingFadeIn(2);
  const mvpPitcherFadeStyle = useCascadingFadeIn(3);

  const hasTeamsAndGames = MOCK_OVERVIEW_STATS.teamCount > 0 && MOCK_OVERVIEW_STATS.wins + MOCK_OVERVIEW_STATS.losses > 0;

  return (
    <View style={{ flex: 1 }}>
      <BandedScreenBackdrop svgColor={colors.primary} backgroundColor={colors.background} />
      <ScrollView className="flex-1" contentContainerClassName="gap-4 pb-32 pt-28">
        <ProfileHeader username={profile?.username ?? ''} displayName={profile?.displayName ?? ''} />

        <Animated.View style={overviewFadeStyle}>
          {OVERVIEW_LOADING ? <ProfileSkeleton variant="overview" /> : <ProfileOverviewCard stats={MOCK_OVERVIEW_STATS} />}
        </Animated.View>

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
      </ScrollView>
    </View>
  );
}