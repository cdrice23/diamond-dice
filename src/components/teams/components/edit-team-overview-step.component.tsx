import { BandedScreenBackdrop } from '@/components/navigation/components/banded-screen-backdrop.component';
import { Card } from '@/components/primitives/card.component';
import { Text } from '@/components/primitives/text.component';
import { AddTeamBasicInfoStep } from '@/components/teams/components/add-team-basic-info-step.component';
import { EditTeamPlayersCard } from '@/components/teams/components/edit-team-players-card.component';
import { TeamDetailCardHeader } from '@/components/teams/components/team-detail-card-header.component';
import { resolveTeamColors } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import MaterialCommunityIcons from '@expo/vector-icons/build/MaterialCommunityIcons';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TeamWizardState } from '../teams.types';
import { wizardSlotsToTeamDetailSlots } from '../utils/team-slot-map';
import { TeamsListCardFormatChip } from './teams-list-format-chip.component';

const TOP_BAND_HEIGHT = 40;
const FALLBACK_HEX = '#6B7280';

type EditTeamOverviewStepProps = {
  state: TeamWizardState;
  fieldErrors: { team_name?: string; home_field_name?: string };
  rosterErrorMessage: string | null;
  onTeamNameChange: (value: string) => void;
  onHomeFieldNameChange: (value: string) => void;
  onPrimaryColorChange: (value: string) => void;
  onSecondaryColorChange: (value: string) => void;
  onAddCustomSwatch: (hex: string) => void;
  onUpdateCustomSwatch: (index: number, hex: string) => void;
  onChangeFormat: () => void;
  onEditPlayers: () => void;
  onEditBattingOrder: () => void;
};

export function EditTeamOverviewStep({
  state,
  fieldErrors,
  rosterErrorMessage,
  onTeamNameChange,
  onHomeFieldNameChange,
  onPrimaryColorChange,
  onSecondaryColorChange,
  onAddCustomSwatch,
  onUpdateCustomSwatch,
  onChangeFormat,
  onEditPlayers,
  onEditBattingOrder,
}: EditTeamOverviewStepProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const primaryHex = state.primaryColor ?? FALLBACK_HEX;
  const secondaryHex = state.secondaryColor ?? FALLBACK_HEX;
  const { backgroundColor: bandColor, textColor: bandTextColor, accentColor: bandAccentColor } = resolveTeamColors(
    primaryHex,
    secondaryHex,
    colors.background
  );
  const headerTopOffset = insets.top + TOP_BAND_HEIGHT;
  const { positionPlayers, pitchers } = wizardSlotsToTeamDetailSlots(state.positionSlots, state.pitcherSlots, state.battingOrder);

  return (
    <View style={{ flex: 1 }}>
      <BandedScreenBackdrop
        svgColor={colors.primary}
        backgroundColor={colors.background}
        topBandHeight={TOP_BAND_HEIGHT}
        topBandBackgroundColor={bandColor}
        topBandSvgColor={bandAccentColor}
      />

      <View style={{ marginTop: headerTopOffset, backgroundColor: bandColor }} className="px-4 pb-3">
        <View className="flex-row items-center gap-2">
          <MaterialCommunityIcons name="tools" size={22} color={bandTextColor} />
          <Text style={{ color: bandTextColor }} className="text-2xl font-bold">
            Edit Team
          </Text>
          {rosterErrorMessage && (
            <View
              className="ml-1 flex-row items-center gap-1 self-center rounded-md px-2 py-1"
              style={{ borderWidth: 1, borderColor: bandTextColor }}
            >
              <MaterialCommunityIcons name="alert-outline" size={14} color={bandTextColor} />
              <Text style={{ color: bandTextColor }} className="text-xs font-semibold">
                See Errors
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ gap: 16, paddingTop: 12, paddingBottom: 24 }}>
        <AddTeamBasicInfoStep
          teamName={state.teamName}
          homeFieldName={state.homeFieldName}
          primaryColor={state.primaryColor}
          secondaryColor={state.secondaryColor}
          customColorSwatches={state.customColorSwatches}
          fieldErrors={fieldErrors}
          onTeamNameChange={onTeamNameChange}
          onHomeFieldNameChange={onHomeFieldNameChange}
          onPrimaryColorChange={onPrimaryColorChange}
          onSecondaryColorChange={onSecondaryColorChange}
          onAddCustomSwatch={onAddCustomSwatch}
          onUpdateCustomSwatch={onUpdateCustomSwatch}
          cardTheme={{ bandColor, textColor: bandTextColor, accentColor: bandAccentColor }}
        />

        <Card className="mx-4 gap-3 py-5">
          <TeamDetailCardHeader label="Format" bandColor={bandColor} textColor={bandTextColor} accentColor={bandAccentColor} />
          <View className="flex-row items-center justify-between">
            {state.formatName && <TeamsListCardFormatChip formatName={state.formatName} size="lg" />}
            <Pressable onPress={onChangeFormat} className="rounded-md px-3 py-2 active:opacity-70" style={{ backgroundColor: colors.muted }}>
              <Text style={{ color: colors.mutedForeground }} className="text-sm font-semibold">
                Change Format
              </Text>
            </Pressable>
          </View>
        </Card>

        <EditTeamPlayersCard
          positionPlayers={positionPlayers}
          pitchers={pitchers}
          bandColor={bandColor}
          textColor={bandTextColor}
          accentColor={bandAccentColor}
          rosterErrorMessage={rosterErrorMessage}
          onEditPlayers={onEditPlayers}
          onEditBattingOrder={onEditBattingOrder}
        />
      </ScrollView>
    </View>
  );
}