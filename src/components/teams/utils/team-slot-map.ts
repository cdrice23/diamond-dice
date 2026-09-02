import type {
  TeamDetailPitcherSlot,
  TeamDetailPositionSlot,
  WizardPitcherSlot,
  WizardPositionSlot,
} from '../teams.types';

const POSITION_SLOT_ORDER = ['C', '1B', '2B', '3B', 'SS', 'OF', 'OF', 'OF', 'DH'];

export function wizardSlotsToTeamDetailSlots(
  positionSlots: WizardPositionSlot[],
  pitcherSlots: WizardPitcherSlot[],
  battingOrder: string[]
): { positionPlayers: TeamDetailPositionSlot[]; pitchers: TeamDetailPitcherSlot[] } {
  const orderByPlayerId = new Map(battingOrder.map((id, index) => [id, index + 1]));

  const positionPlayers = positionSlots
    .filter((slot): slot is WizardPositionSlot & { playerId: string; playerName: string } => slot.playerId !== null && slot.playerName !== null)
    .map((slot) => ({
      position: slot.position,
      battingOrder: orderByPlayerId.get(slot.playerId) ?? null,
      player: { id: slot.playerId, name: slot.playerName, image_url: slot.playerImageUrl },
      eligiblePositions: slot.eligiblePositions,
      level: slot.level,
    }));

  const pitchers = pitcherSlots
    .filter((slot): slot is WizardPitcherSlot & { playerId: string; playerName: string } => slot.playerId !== null && slot.playerName !== null)
    .map((slot) => ({
      player: { id: slot.playerId, name: slot.playerName, image_url: slot.playerImageUrl },
      eligiblePositions: slot.eligiblePositions,
      level: slot.level,
    }));

  return { positionPlayers, pitchers };
}

export function teamDetailToWizardSlots(
  positionPlayers: TeamDetailPositionSlot[],
  pitchers: TeamDetailPitcherSlot[]
): { positionSlots: WizardPositionSlot[]; pitcherSlots: WizardPitcherSlot[]; battingOrder: string[] } {
  const remaining = [...positionPlayers];

  const positionSlots: WizardPositionSlot[] = POSITION_SLOT_ORDER.map((position) => {
    const idx = remaining.findIndex((p) => p.position === position);
    if (idx === -1) {
      return { position, playerId: null, playerName: null, playerImageUrl: null, eligiblePositions: [], level: null };
    }
    const [entry] = remaining.splice(idx, 1);
    return {
      position,
      playerId: entry.player.id,
      playerName: entry.player.name,
      playerImageUrl: entry.player.image_url,
      eligiblePositions: entry.eligiblePositions,
      level: entry.level,
    };
  });

  const pitcherSlots: WizardPitcherSlot[] = pitchers.map((slot) => ({
    playerId: slot.player.id,
    playerName: slot.player.name,
    playerImageUrl: slot.player.image_url,
    eligiblePositions: slot.eligiblePositions,
    level: slot.level,
  }));

  const battingOrder = [...positionPlayers]
    .filter((slot) => slot.battingOrder !== null)
    .sort((a, b) => (a.battingOrder ?? 0) - (b.battingOrder ?? 0))
    .map((slot) => slot.player.id);

  return { positionSlots, pitcherSlots, battingOrder };
}