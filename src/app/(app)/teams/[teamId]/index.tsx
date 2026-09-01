import { BandedScreenBackdrop } from '@/components/navigation/components/banded-screen-backdrop.component';
import { useNavLayout } from '@/components/navigation/nav-layout.context';
import { PlayerDatabaseFadeList } from '@/components/player-database/components/player-database-fade-list.component';
import { ScreenDetailBackButton } from '@/components/primitives/screen-detail-back-button.component';
import { TeamDetailHeader } from '@/components/teams/components/team-detail-header.component';
import { TeamDetailPitchersCard } from '@/components/teams/components/team-detail-pitchers-card.component';
import { TeamDetailPositionPlayersCard } from '@/components/teams/components/team-detail-position-players-card.component';
import { TeamDetailRecentGamesCard } from '@/components/teams/components/team-detail-recent-games-card.component';
import { TeamDetailStatsCard } from '@/components/teams/components/team-detail-stats-card.component';
import { type TeamDetailViewMode } from '@/components/teams/components/team-detail-view-toggle.component';
import { MOCK_TEAM_DETAIL } from '@/components/teams/teams.mock';
import { resolveTeamColors } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TOP_BAND_HEIGHT = 40;
const NAV_CLEARANCE_EXTRA = 16;

export default function TeamDetailScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { navTopY } = useNavLayout();
  const { height: screenHeight } = useWindowDimensions();

  const team = MOCK_TEAM_DETAIL;
  const [viewMode, setViewMode] = useState<TeamDetailViewMode>('list');

  const headerTopOffset = insets.top + TOP_BAND_HEIGHT;
  const { backgroundColor: bandColor, textColor: bandTextColor, accentColor: bandAccentColor } = resolveTeamColors(
    team.team_theme_color_primary,
    team.team_theme_color_secondary,
    colors.background
  );
  const navClearance = (navTopY !== null ? screenHeight - navTopY : 116) + NAV_CLEARANCE_EXTRA;

  return (
    <View style={{ flex: 1 }}>
      <BandedScreenBackdrop
        svgColor={colors.primary}
        backgroundColor={colors.background}
        topBandHeight={TOP_BAND_HEIGHT}
        topBandBackgroundColor={bandColor}
        topBandSvgColor={bandAccentColor}
      />

      <View style={{ marginTop: headerTopOffset, backgroundColor: bandColor }} className="gap-3 pb-3">
        <ScreenDetailBackButton flat textColor={bandTextColor} />
        <TeamDetailHeader
          teamName={team.team_name}
          homeFieldName={team.home_field_name}
          formatName={team.format_name}
          textColor={bandTextColor}
          accentColor={bandAccentColor}
          onEditPress={() => router.push(`/teams/${team.id}/edit`)}
          onDeletePress={() => {}}
        />
      </View>

      <View style={{ flex: 1, paddingBottom: navClearance, position: 'relative' }}>
        <ScrollView className="flex-1" contentContainerStyle={{ gap: 16, paddingTop: 32, paddingBottom: 24 }}>
          <TeamDetailPositionPlayersCard
            positionPlayers={team.position_players}
            pitchers={team.pitchers}
            bandColor={bandColor}
            textColor={bandTextColor}
            accentColor={bandAccentColor}
          />
          <TeamDetailPitchersCard pitchers={team.pitchers} bandColor={bandColor} textColor={bandTextColor} accentColor={bandAccentColor} />
          <TeamDetailRecentGamesCard games={team.recent_games} bandColor={bandColor} textColor={bandTextColor} accentColor={bandAccentColor} />
          <TeamDetailStatsCard wins={team.wins} losses={team.losses} gamesPlayed={team.games_played} bandColor={bandColor} textColor={bandTextColor} accentColor={bandAccentColor} />
        </ScrollView>
        <PlayerDatabaseFadeList backgroundColor={colors.background} bottomInset={navClearance} />
      </View>
    </View>
  );
}