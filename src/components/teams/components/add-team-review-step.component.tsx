import { BandedScreenBackdrop } from '@/components/navigation/components/banded-screen-backdrop.component';
import { Text } from '@/components/primitives/text.component';
import { TeamDetailHeader } from '@/components/teams/components/team-detail-header.component';
import { TeamDetailPitchersCard } from '@/components/teams/components/team-detail-pitchers-card.component';
import { TeamDetailPositionPlayersCard } from '@/components/teams/components/team-detail-position-players-card.component';
import { resolveTeamColors } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { WizardPitcherSlot, WizardPositionSlot } from '../teams.types';
import { wizardSlotsToTeamDetailSlots } from '../utils/team-slot-map';

const TOP_BAND_HEIGHT = 40;
const FALLBACK_HEX = '#6B7280';

type AddTeamReviewStepProps = {
  teamName: string;
  homeFieldName: string;
  formatName: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  positionSlots: WizardPositionSlot[];
  pitcherSlots: WizardPitcherSlot[];
  battingOrder: string[];
};

export function AddTeamReviewStep({
  teamName,
  homeFieldName,
  formatName,
  primaryColor,
  secondaryColor,
  positionSlots,
  pitcherSlots,
  battingOrder,
}: AddTeamReviewStepProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const primaryHex = primaryColor ?? FALLBACK_HEX;
  const secondaryHex = secondaryColor ?? FALLBACK_HEX;
  const { backgroundColor: bandColor, textColor: bandTextColor, accentColor: bandAccentColor } = resolveTeamColors(
    primaryHex,
    secondaryHex,
    colors.background
  );
  const headerTopOffset = insets.top + TOP_BAND_HEIGHT;

  const { positionPlayers: teamPositionSlots, pitchers: teamPitcherSlots } = wizardSlotsToTeamDetailSlots(positionSlots, pitcherSlots, battingOrder)

  return (
    <View style={{ flex: 1 }}>
      <BandedScreenBackdrop
        svgColor={colors.primary}
        backgroundColor={colors.background}
        topBandHeight={TOP_BAND_HEIGHT}
        topBandBackgroundColor={bandColor}
        topBandSvgColor={bandAccentColor}
      />

      <View style={{ marginTop: headerTopOffset, backgroundColor: bandColor }} className="gap-2 px-4 pb-3">
        <Text style={{ color: bandTextColor }} className="text-2xl font-bold">
          Review New Team
        </Text>
        <TeamDetailHeader
          teamName={teamName}
          homeFieldName={homeFieldName}
          formatName={formatName}
          textColor={bandTextColor}
          accentColor={bandAccentColor}
          showMenu={false}
        />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ gap: 16, paddingTop: 32, paddingBottom: 24 }}>
        <TeamDetailPositionPlayersCard
          positionPlayers={teamPositionSlots}
          pitchers={teamPitcherSlots}
          bandColor={bandColor}
          textColor={bandTextColor}
          accentColor={bandAccentColor}
          hideViewToggle
        />
        <TeamDetailPitchersCard
          pitchers={teamPitcherSlots}
          bandColor={bandColor}
          textColor={bandTextColor}
          accentColor={bandAccentColor}
        />
      </ScrollView>
    </View>
  );
}