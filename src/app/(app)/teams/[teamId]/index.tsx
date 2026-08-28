// [teamId]/index.tsx
import { BandedScreenBackdrop } from '@/components/navigation/components/banded-screen-backdrop.component';
import { ScreenDetailBackButton } from '@/components/primitives/screen-detail-back-button.component';
import { TeamDetailHeader } from '@/components/teams/components/team-detail-header.component';
import { MOCK_TEAM_DETAIL } from '@/components/teams/teams.mock';
import { resolveTeamHeaderColors } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TOP_BAND_HEIGHT = 40;

export default function TeamDetailScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const team = MOCK_TEAM_DETAIL;

  const headerTopOffset = insets.top + TOP_BAND_HEIGHT;
  const { background: bandColor, text: bandTextColor } = resolveTeamHeaderColors(
    team.team_theme_color_primary,
    team.team_theme_color_secondary
  );

  return (
    <View style={{ flex: 1 }}>
      <BandedScreenBackdrop
        svgColor={colors.primary}
        backgroundColor={colors.background}
        topBandHeight={TOP_BAND_HEIGHT}
        topBandBackgroundColor={bandColor}
        topBandSvgColor={team.team_theme_color_secondary}
      />
      <View style={{ marginTop: headerTopOffset, backgroundColor: bandColor }} className="gap-3 pb-3">
        <ScreenDetailBackButton flat textColor={bandTextColor} />
        <TeamDetailHeader
          teamName={team.team_name}
          homeFieldName={team.home_field_name}
          textColor={bandTextColor}
          onEditPress={() => router.push(`/teams/${team.id}/edit`)}
          onDeletePress={() => {}}
        />
      </View>
    </View>
  );
}