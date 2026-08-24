import { LoadingSpinner } from '@/components/branding/components/loading-spinner.component';
import { BandedScreenBackdrop } from '@/components/navigation/components/banded-screen-backdrop.component';
import { useNavLayout } from '@/components/navigation/nav-layout.context';
import { usePitchState } from '@/components/navigation/pitch-state.context';
import { PlayerDatabaseFadeList } from '@/components/player-database/components/player-database-fade-list.component';
import { PlayerDetailAwardsCard } from '@/components/player-database/components/player-detail-awards-card.component';
import { PlayerDetailBackButton } from '@/components/player-database/components/player-detail-back-button.component';
import { PlayerDetailBattingStatsCard } from '@/components/player-database/components/player-detail-batting-stats-card.component';
import { PlayerDetailBioCard } from '@/components/player-database/components/player-detail-bio-card.component';
import { PlayerDetailHeader } from '@/components/player-database/components/player-detail-header.component';
import { PlayerDetailPitchingStatsCard } from '@/components/player-database/components/player-detail-pitching-stats-card.component';
import { PlayerDetailTeamHistoryCard } from '@/components/player-database/components/player-detail-team-history-card.component';
import { usePlayerDetail } from '@/components/player-database/hooks/use-player-detail.hook';
import { useTheme } from '@/utils/theme-provider';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

const NAV_CLEARANCE_EXTRA = 16;

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
  const { player, teamHistory, awardSummaries, loading, error } = usePlayerDetail(playerId);

  const contentFadeStyle = useAnimatedStyle(() => ({
    opacity: 1 - pastThreshold.value,
  }));

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
      <BandedScreenBackdrop svgColor={colors.primary} backgroundColor={colors.background} topBandHeight={40} />
      <Animated.View style={[{ flex: 1 }, contentFadeStyle]}>
        <View style={{ flex: 1, paddingBottom: navClearance, position: 'relative' }}>
          <ScrollView className="flex-1" contentContainerClassName="gap-4 pt-16 pb-6">
            <PlayerDetailBackButton />
            <PlayerDetailHeader player={player} teamHistory={teamHistory} awardSummaries={awardSummaries} />
            <PlayerDetailBioCard player={player} />
            {isEffectiveBatter && <PlayerDetailBattingStatsCard player={player} />}
            {isEffectivePitcher && <PlayerDetailPitchingStatsCard player={player} />}
            <PlayerDetailTeamHistoryCard teamHistory={teamHistory} />
            <PlayerDetailAwardsCard awardSummaries={awardSummaries} />
          </ScrollView>
          <PlayerDatabaseFadeList backgroundColor={colors.background} bottomInset={navClearance} />
        </View>
      </Animated.View>
    </View>
  );
}