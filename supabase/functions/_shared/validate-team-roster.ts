import { SupabaseClient } from '@supabase/supabase-js';

export type ValidationError = {
  code: 'ROSTER_COUNT_MISMATCH' | 'INELIGIBLE_POSITION' | 'UNQUALIFIED_PLAYER' | 'POSITION_COVERAGE_MISMATCH';
  player_type?: 'batter' | 'pitcher';
  level?: number | null;
  roster_slot_id?: string;
  message: string;
};

type PlayerFields = {
  eligible_positions: string[] | null;
  is_qualified_batter: boolean;
  is_qualified_pitcher: boolean;
  batting_rating_level: number | null;
  pitching_rating_level: number | null;
};

export type RosterSlotInput = {
  id?: string;
  position: string;
  player: PlayerFields | null;
};

type RequirementRow = {
  player_type: 'batter' | 'pitcher';
  level_id: string | null;
  min_count: number;
  max_count: number | null;
  levels?: { level: number } | null;
};

type PositionRequirementRow = { slot_position: string; requires_eligibility: boolean; min_count: number; max_count: number };

export function computeRosterValidationErrors(
  slots: RosterSlotInput[],
  requirements: RequirementRow[],
  positionRequirements: PositionRequirementRow[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const positionReqMap = new Map(positionRequirements.map((r) => [r.slot_position, r]));

  for (const slot of slots) {
    const player = slot.player;
    if (!player) continue;

    const position = slot.position;
    const requirement = positionReqMap.get(position);
    const isPitcherSlot = position === 'P';
    const playerType = isPitcherSlot ? 'pitcher' : 'batter';

    if (requirement?.requires_eligibility && !player.eligible_positions?.includes(position)) {
      errors.push({
        code: 'INELIGIBLE_POSITION',
        player_type: playerType,
        roster_slot_id: slot.id,
        message: `Player is not eligible for position ${position}.`,
      });
    }

    const qualified = isPitcherSlot ? player.is_qualified_pitcher : player.is_qualified_batter;

    if (!qualified) {
      errors.push({
        code: 'UNQUALIFIED_PLAYER',
        player_type: playerType,
        roster_slot_id: slot.id,
        message: `Player does not meet the qualification standard for ${isPitcherSlot ? 'pitching' : 'batting'}.`,
      });
    }
  }

  const positionCounts = new Map<string, number>();
  for (const slot of slots) {
    positionCounts.set(slot.position, (positionCounts.get(slot.position) ?? 0) + 1);
  }

  for (const [slotPosition, requirement] of positionReqMap) {
    const actual = positionCounts.get(slotPosition) ?? 0;
    if (actual < requirement.min_count || actual > requirement.max_count) {
      const range =
        requirement.max_count !== requirement.min_count ? `${requirement.min_count}-${requirement.max_count}` : `${requirement.min_count}`;
      errors.push({
        code: 'POSITION_COVERAGE_MISMATCH',
        player_type: 'batter',
        message: `Format requires ${range} ${slotPosition}, has ${actual}`,
      });
    }
  }

  const counts = new Map<string, number>();
  for (const slot of slots) {
    const player = slot.player;
    if (!player) continue;
    const playerType = slot.position === 'P' ? 'pitcher' : 'batter';
    const level = playerType === 'pitcher' ? player.pitching_rating_level : player.batting_rating_level;
    counts.set(`${playerType}:${level}`, (counts.get(`${playerType}:${level}`) ?? 0) + 1);
    counts.set(`${playerType}:agg`, (counts.get(`${playerType}:agg`) ?? 0) + 1);
  }

  for (const req of requirements) {
    const key = req.level_id ? `${req.player_type}:${req.levels?.level}` : `${req.player_type}:agg`;
    const actual = counts.get(key) ?? 0;

    if (actual < req.min_count || (req.max_count != null && actual > req.max_count)) {
      const range =
        req.max_count != null && req.max_count !== req.min_count ? `${req.min_count}-${req.max_count}` : `${req.min_count}`;
      errors.push({
        code: 'ROSTER_COUNT_MISMATCH',
        player_type: req.player_type,
        level: req.level_id ? (req.levels?.level ?? null) : null,
        message: req.level_id
          ? `Format requires ${range} Level ${req.levels?.level} ${req.player_type}(s), has ${actual}.`
          : `Format requires ${range} total ${req.player_type}(s), has ${actual}.`,
      });
    }
  }

  return errors;
}

async function fetchRequirements(adminClient: SupabaseClient, formatId: string) {
  const { data: requirements, error: reqError } = await adminClient
    .from('format_roster_requirements')
    .select('player_type, level_id, min_count, max_count, levels(level)')
    .eq('format_id', formatId);
  if (reqError) throw reqError;

  const { data: positionRequirements, error: posReqError } = await adminClient
    .from('position_requirements')
    .select('slot_position, requires_eligibility, min_count, max_count');
  if (posReqError) throw posReqError;

  return { requirements: requirements ?? [], positionRequirements: positionRequirements ?? [] };
}

export async function validateTeamRoster(adminClient: SupabaseClient, teamId: string, formatId: string): Promise<ValidationError[]> {
  const { data: rosterSlots, error: rosterError } = await adminClient
    .from('roster_slots')
    .select(
      `id, current_position, default_position, players ( id, eligible_positions, is_qualified_batter, is_qualified_pitcher, batting_rating_level, pitching_rating_level )`
    )
    .eq('team_id', teamId);
  if (rosterError) throw rosterError;

  const { requirements, positionRequirements } = await fetchRequirements(adminClient, formatId);

  const slots: RosterSlotInput[] = (rosterSlots ?? []).map((slot) => ({
    id: slot.id,
    position: slot.current_position ?? slot.default_position,
    player: slot.players,
  }));

  return computeRosterValidationErrors(slots, requirements, positionRequirements);
}

export async function validateTeamRosterDraft(
  adminClient: SupabaseClient,
  positionSlots: { position: string; player_id: string | null }[],
  pitcherSlots: { player_id: string | null }[],
  formatId: string
): Promise<ValidationError[]> {
  const playerIds = [...positionSlots.map((s) => s.player_id), ...pitcherSlots.map((s) => s.player_id)].filter(
    (id): id is string => id !== null
  );

  const { data: players, error: playersError } = await adminClient
    .from('players')
    .select('id, eligible_positions, is_qualified_batter, is_qualified_pitcher, batting_rating_level, pitching_rating_level')
    .in('id', playerIds);
  if (playersError) throw playersError;

  const playerMap = new Map((players ?? []).map((p) => [p.id, p]));
  const { requirements, positionRequirements } = await fetchRequirements(adminClient, formatId);

  const slots: RosterSlotInput[] = [
    ...positionSlots.map((s) => ({ position: s.position, player: s.player_id ? (playerMap.get(s.player_id) ?? null) : null })),
    ...pitcherSlots.map((s) => ({ position: 'P', player: s.player_id ? (playerMap.get(s.player_id) ?? null) : null })),
  ];

  return computeRosterValidationErrors(slots, requirements, positionRequirements);
}