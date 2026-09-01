import { BandedScreenBackdrop } from '@/components/navigation/components/banded-screen-backdrop.component';
import { Text } from '@/components/primitives/text.component';
import { TeamDetailHeader } from '@/components/teams/components/team-detail-header.component';
import { TeamDetailPitchersCard } from '@/components/teams/components/team-detail-pitchers-card.component';
import { TeamDetailPositionPlayersCard } from '@/components/teams/components/team-detail-position-players-card.component';
import { resolveTeamHeaderColors } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TeamDetailPitcherSlot, TeamDetailPositionSlot, WizardPitcherSlot, WizardPositionSlot } from '../teams.types';

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

function toTeamDetailPositionSlots(positionSlots: WizardPositionSlot[], battingOrder: string[]): TeamDetailPositionSlot[] {
  const orderByPlayerId = new Map(battingOrder.map((id, index) => [id, index + 1]));
  return positionSlots
    .filter((slot): slot is WizardPositionSlot & { playerId: string; playerName: string } => slot.playerId !== null && slot.playerName !== null)
    .map((slot) => ({
      position: slot.position,
      battingOrder: orderByPlayerId.get(slot.playerId) ?? null,
      player: { id: slot.playerId, name: slot.playerName, image_url: slot.playerImageUrl },
      eligiblePositions: slot.eligiblePositions,
      level: slot.level,
    }));
}

function toTeamDetailPitcherSlots(pitcherSlots: WizardPitcherSlot[]): TeamDetailPitcherSlot[] {
  return pitcherSlots
    .filter((slot): slot is WizardPitcherSlot & { playerId: string; playerName: string } => slot.playerId !== null && slot.playerName !== null)
    .map((slot) => ({
      player: { id: slot.playerId, name: slot.playerName, image_url: slot.playerImageUrl },
      eligiblePositions: slot.eligiblePositions,
      level: slot.level,
    }));
}

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
  const { background: bandColor, text: bandTextColor } = resolveTeamHeaderColors(primaryHex, secondaryHex);
  const headerTopOffset = insets.top + TOP_BAND_HEIGHT;

  const teamPositionSlots = toTeamDetailPositionSlots(positionSlots, battingOrder);
  const teamPitcherSlots = toTeamDetailPitcherSlots(pitcherSlots);

  return (
    <View style={{ flex: 1 }}>
      <BandedScreenBackdrop
        svgColor={colors.primary}
        backgroundColor={colors.background}
        topBandHeight={TOP_BAND_HEIGHT}
        topBandBackgroundColor={bandColor}
        topBandSvgColor={secondaryHex}
      />

      <View style={{ marginTop: headerTopOffset, backgroundColor: bandColor }} className="gap-2 px-4 pb-3">
        <Text style={{ color: bandTextColor }} className="text-2xl font-bold">
          Review New Team
        </Text>
        <TeamDetailHeader teamName={teamName} homeFieldName={homeFieldName} formatName={formatName} textColor={bandTextColor} showMenu={false} />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ gap: 16, paddingTop: 32, paddingBottom: 24 }}>
        <TeamDetailPositionPlayersCard
          positionPlayers={teamPositionSlots}
          pitchers={teamPitcherSlots}
          bandColor={bandColor}
          textColor={bandTextColor}
          hideViewToggle
        />
        <TeamDetailPitchersCard pitchers={teamPitcherSlots} bandColor={bandColor} textColor={bandTextColor} />
      </ScrollView>
    </View>
  );
}