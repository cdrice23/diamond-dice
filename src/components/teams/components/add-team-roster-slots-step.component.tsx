import type { PlayerDatabaseRow as PlayerDatabaseRowData } from '@/components/player-database/hooks/use-player-database-search.hook';
import type { Position } from '@/components/player-database/player-database.types';
import { Card } from '@/components/primitives/card.component';
import { Text } from '@/components/primitives/text.component';
import { AddPlayerModal, type AddPlayerModalSlotType } from '@/components/teams/components/add-player-modal.component';
import { RosterPitcherRow } from '@/components/teams/components/roster-pitcher-row.component';
import { RosterPositionRow } from '@/components/teams/components/roster-position-row.component';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { WizardPitcherSlot, WizardPositionSlot } from '../teams.types';

type AddTeamRosterSlotsStepProps = {
  positionSlots: WizardPositionSlot[];
  pitcherSlots: WizardPitcherSlot[];
  onAssignPositionPlayer: (slotIndex: number, player: Omit<WizardPositionSlot, 'position'>) => void;
  onAssignPitcherPlayer: (slotIndex: number, player: WizardPitcherSlot) => void;
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

export function AddTeamRosterSlotsStep({
  positionSlots,
  pitcherSlots,
  onAssignPositionPlayer,
  onAssignPitcherPlayer,
}: AddTeamRosterSlotsStepProps) {
  const [openSlot, setOpenSlot] = useState<OpenSlot | null>(null);

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
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <Card>
          <Text className="text-foreground mb-3 text-xl font-bold">Position Players</Text>
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
          <Text className="text-foreground mb-3 text-xl font-bold">Pitchers</Text>
          <View className="gap-4">
            {pitcherSlots.map((slot, index) => (
              <RosterPitcherRow key={index} slot={slot} onPress={() => setOpenSlot({ slotType: 'pitcher', slotIndex: index })} />
            ))}
          </View>
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