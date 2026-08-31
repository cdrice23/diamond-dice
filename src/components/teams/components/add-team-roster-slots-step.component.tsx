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
  onClearAllPositionPlayers: () => void;
  onClearAllPitchers: (baseCount: number) => void;
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

function ErrorBanner({ errors }: { errors: string[] }) {
  const { colors } = useTheme();

  if (errors.length === 0) return null;

  return (
    <View
      className="mb-3 flex-row gap-2.5 rounded-md p-3"
      style={{ backgroundColor: adjustHslAlpha(colors.destructive, 0.1), borderWidth: 1, borderColor: colors.destructive }}
    >
      <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.destructive} />
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

function ClearAllButton({ onPress, disabled }: { onPress: () => void; disabled: boolean }) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="mt-4 items-center rounded-md py-2.5 active:opacity-70"
      style={{ backgroundColor: colors.muted, opacity: disabled ? 0.4 : 1 }}
    >
      <Text style={{ color: colors.destructive }} className="text-sm font-semibold">
        Clear All
      </Text>
    </Pressable>
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
  onClearAllPositionPlayers,
  onClearAllPitchers,
}: AddTeamRosterSlotsStepProps) {
  const [openSlot, setOpenSlot] = useState<OpenSlot | null>(null);
  const { requirements } = useFormatRosterRequirements(formatId);
  const pitcherRange = computePitcherSlotRange(requirements);

  const hasAnyPositionPlayer = positionSlots.some((slot) => slot.playerId !== null);
  const hasAnyPitcher = pitcherSlots.some((slot) => slot.playerId !== null);

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
      const willFillAllVisibleSlots = pitcherSlots.every((slot, i) => i === openSlot.slotIndex || slot.playerId !== null);
      const canGrow = pitcherRange.max === null || pitcherSlots.length < pitcherRange.max;

      onAssignPitcherPlayer(openSlot.slotIndex, {
        playerId: player.id,
        playerName: player.name,
        playerImageUrl: player.image_url,
        eligiblePositions: player.eligible_positions,
        level: player.pitching_rating_level,
      });

      if (willFillAllVisibleSlots && canGrow) {
        onAddPitcherSlot();
      }
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
          <ClearAllButton onPress={onClearAllPositionPlayers} disabled={!hasAnyPositionPlayer} />
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
          <ClearAllButton onPress={() => onClearAllPitchers(pitcherRange.min)} disabled={!hasAnyPitcher} />
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