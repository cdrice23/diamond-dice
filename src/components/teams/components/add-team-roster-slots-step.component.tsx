import type { PlayerDatabaseRow as PlayerDatabaseRowData } from '@/components/player-database/hooks/use-player-database-search.hook';
import type { Position } from '@/components/player-database/player-database.types';
import { CardSectionHeader } from '@/components/primitives/card-section-header.component';
import { Card } from '@/components/primitives/card.component';
import { Text } from '@/components/primitives/text.component';
import { AddPlayerModal, type AddPlayerModalSlotType } from '@/components/teams/components/add-player-modal.component';
import { RosterPitcherRow } from '@/components/teams/components/roster-pitcher-row.component';
import { RosterPositionRow } from '@/components/teams/components/roster-position-row.component';
import { RosterSlotsFormatBadge } from '@/components/teams/components/roster-slots-format-badge.component';
import { computePitcherSlotRange } from '@/components/teams/utils/roster-level-counts';
import { adjustHslAlpha } from '@/utils/color';
import { useTheme } from '@/utils/theme-provider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useFormatRosterRequirements } from '../hooks/use-format-roster-requirements.hook';
import type { WizardPitcherSlot, WizardPositionSlot } from '../teams.types';

type AddTeamRosterSlotsStepProps = {
  formatId: string | null;
  formatName: string | null;
  positionSlots: WizardPositionSlot[];
  pitcherSlots: WizardPitcherSlot[];
  positionErrors?: string[];
  pitcherErrors?: string[];
  onAssignPositionPlayer: (slotIndex: number, player: Omit<WizardPositionSlot, 'position'>) => void;
  onAssignPitcherPlayer: (slotIndex: number, player: WizardPitcherSlot) => void;
  onAddPitcherSlot: () => void;
  onRemovePitcherSlot: (slotIndex: number) => void;
};

type OpenSlot = { slotType: 'position'; slotIndex: number; position: Position } | { slotType: 'pitcher'; slotIndex: number };

function getExcludedPlayerIds(
  openSlot: OpenSlot | null,
  positionSlots: WizardPositionSlot[],
  pitcherSlots: WizardPitcherSlot[]
): string[] {
  if (!openSlot) return [];
  const slots = openSlot.slotType === 'position' ? positionSlots : pitcherSlots;
  return slots
    .filter((_, index) => index !== openSlot.slotIndex)
    .map((slot) => slot.playerId)
    .filter((id): id is string => id !== null);
}

const ERROR_BANNER_BACKGROUND_ALPHA = 0.1;
const ERROR_ICON_SIZE = 20;

function ErrorBanner({ errors }: { errors: string[] }) {
  const { colors } = useTheme();

  if (errors.length === 0) return null;

  return (
    <View
      className="mb-3 flex-row gap-2.5 rounded-md p-3"
      style={{ backgroundColor: adjustHslAlpha(colors.destructive, ERROR_BANNER_BACKGROUND_ALPHA), borderWidth: 1, borderColor: colors.destructive }}
    >
      <MaterialCommunityIcons name="alert-circle-outline" size={ERROR_ICON_SIZE} color={colors.destructive} />
      <View className="flex-1 gap-1">
        {errors.map((error, index) => (
          <Text key={index} style={{ color: colors.destructive }} className="text-sm font-medium">
            {error}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function AddTeamRosterSlotsStep({
  formatId,
  formatName,
  positionSlots,
  pitcherSlots,
  positionErrors = [],
  pitcherErrors = [],
  onAssignPositionPlayer,
  onAssignPitcherPlayer,
  onAddPitcherSlot,
  onRemovePitcherSlot,
}: AddTeamRosterSlotsStepProps) {
  const { colors } = useTheme();
  const [openSlot, setOpenSlot] = useState<OpenSlot | null>(null);
  const { requirements } = useFormatRosterRequirements(formatId);

  const pitcherRange = computePitcherSlotRange(requirements);
  const canAddPitcherSlot = pitcherRange.max === null || pitcherSlots.length < pitcherRange.max;

  function handleSelectPlayer(player: PlayerDatabaseRowData) {
    if (!openSlot) return;

    if (openSlot.slotType === 'position') {
      onAssignPositionPlayer(openSlot.slotIndex, {
        playerId: player.id,
        playerName: player.name,
        playerImageUrl: player.image_url,
        eligiblePositions: player.eligible_positions,
        level: player.batting_rating_level,
      });
    } else {
      onAssignPitcherPlayer(openSlot.slotIndex, {
        playerId: player.id,
        playerName: player.name,
        playerImageUrl: player.image_url,
        eligiblePositions: player.eligible_positions,
        level: player.pitching_rating_level,
      });
    }

    setOpenSlot(null);
  }

  return (
    <>
      {formatName && (
        <View className="px-4 pb-3">
          <RosterSlotsFormatBadge formatName={formatName} />
        </View>
      )}

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <Card>
          <CardSectionHeader label="Position Players" />
          <ErrorBanner errors={positionErrors} />
          <View className="gap-4">
            {positionSlots.map((slot, index) => (
              <RosterPositionRow
                key={`${slot.position}-${index}`}
                slot={slot}
                onPress={() => setOpenSlot({ slotType: 'position', slotIndex: index, position: slot.position as Position })}
              />
            ))}
          </View>
        </Card>

        <Card>
          <CardSectionHeader label="Pitchers" />
          <ErrorBanner errors={pitcherErrors} />
          <View className="gap-4">
            {pitcherSlots.map((slot, index) => (
              <RosterPitcherRow
                key={index}
                slot={slot}
                onPress={() => setOpenSlot({ slotType: 'pitcher', slotIndex: index })}
                onRemove={index >= pitcherRange.min ? () => onRemovePitcherSlot(index) : undefined}
              />
            ))}
          </View>

          {canAddPitcherSlot && (
            <Pressable
              onPress={onAddPitcherSlot}
              className="border-border mt-4 flex-row items-center justify-center gap-1.5 rounded-md border border-dashed py-3 active:opacity-70"
            >
              <MaterialCommunityIcons name="plus" size={18} color={colors.mutedForeground} />
              <Text variant="muted" className="text-base font-semibold">
                Add Pitcher Slot
              </Text>
            </Pressable>
          )}
        </Card>
      </ScrollView>

      <AddPlayerModal
        key={openSlot ? `${openSlot.slotType}-${openSlot.slotIndex}` : 'closed'}
        visible={openSlot !== null}
        slotType={(openSlot?.slotType ?? 'position') as AddPlayerModalSlotType}
        position={openSlot?.slotType === 'position' ? openSlot.position : undefined}
        excludePlayerIds={getExcludedPlayerIds(openSlot, positionSlots, pitcherSlots)}
        onDismiss={() => setOpenSlot(null)}
        onSelectPlayer={handleSelectPlayer}
      />
    </>
  );
}