import { SupabaseClient } from '@supabase/supabase-js';

export type ValidationError = {
  code:
    | 'ROSTER_COUNT_MISMATCH'
    | 'INELIGIBLE_POSITION'
    | 'UNQUALIFIED_PLAYER'
    | 'POSITION_COVERAGE_MISMATCH';
  player_type?: 'batter' | 'pitcher';
  level?: number | null;
  roster_slot_id?: string;
  message: string;
};

export async function validateTeamRoster(
  adminClient: SupabaseClient,
  teamId: string,
  formatId: string
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  const { data: rosterSlots, error: rosterError } = await adminClient
    .from('roster_slots')
    .select(`
      id,
      current_position,
      default_position,
      players (
        id,
        eligible_positions,
        is_qualified_batter,
        is_qualified_pitcher,
        batting_rating_level,
        pitching_rating_level
      )
    `)
    .eq('team_id', teamId);

  if (rosterError) throw rosterError;

  const { data: requirements, error: reqError } = await adminClient
    .from('format_roster_requirements')
    .select('player_type, level_id, min_count, max_count, levels(level)')
    .eq('format_id', formatId);

  if (reqError) throw reqError;

  const { data: positionRequirements, error: posReqError } = await adminClient
    .from('position_requirements')
    .select('slot_position, requires_eligibility, min_count, max_count');

  if (posReqError) throw posReqError;

  const positionReqMap = new Map((positionRequirements ?? []).map((r) => [r.slot_position, r]));

  for (const slot of rosterSlots ?? []) {
    const player = slot.players;
    if (!player) continue;

    const position = slot.current_position ?? slot.default_position;
    const requirement = position ? positionReqMap.get(position) : undefined;

    if (requirement?.requires_eligibility && !player.eligible_positions?.includes(position)) {
      errors.push({
        code: 'INELIGIBLE_POSITION',
        roster_slot_id: slot.id,
        message: `Player is not eligible for position ${position}.`,
      });
    }

    const isPitcherSlot = position === 'P';
    const qualified = isPitcherSlot ? player.is_qualified_pitcher : player.is_qualified_batter;

    if (!qualified) {
      errors.push({
        code: 'UNQUALIFIED_PLAYER',
        roster_slot_id: slot.id,
        message: `Player does not meet the qualification standard for ${isPitcherSlot ? 'pitching' : 'batting'}.`,
      });
    }
  }

  const positionCounts = new Map<string, number>();
  for (const slot of rosterSlots ?? []) {
    const position = slot.current_position ?? slot.default_position;
    if (!position) continue;
    positionCounts.set(position, (positionCounts.get(position) ?? 0) + 1);
  }

  for (const [slotPosition, requirement] of positionReqMap) {
    const actual = positionCounts.get(slotPosition) ?? 0;
    if (actual < requirement.min_count || actual > requirement.max_count) {
      const range =
        requirement.max_count !== requirement.min_count
          ? `${requirement.min_count}-${requirement.max_count}`
          : `${requirement.min_count}`;
      errors.push({ code: 'POSITION_COVERAGE_MISMATCH', message: `Requires ${range} ${slotPosition}, has ${actual}.` });
    }
  }

  const counts = new Map<string, number>();
  for (const slot of rosterSlots ?? []) {
    const player = slot.players;
    if (!player) continue;
    const position = slot.current_position ?? slot.default_position;
    const playerType = position === 'P' ? 'pitcher' : 'batter';
    const level = playerType === 'pitcher' ? player.pitching_rating_level : player.batting_rating_level;

    counts.set(`${playerType}:${level}`, (counts.get(`${playerType}:${level}`) ?? 0) + 1);
    counts.set(`${playerType}:agg`, (counts.get(`${playerType}:agg`) ?? 0) + 1);
  }

  for (const req of requirements ?? []) {
    const key = req.level_id ? `${req.player_type}:${req.levels?.level}` : `${req.player_type}:agg`;
    const actual = counts.get(key) ?? 0;

    if (actual < req.min_count || (req.max_count != null && actual > req.max_count)) {
      const range =
        req.max_count != null && req.max_count !== req.min_count
          ? `${req.min_count}-${req.max_count}`
          : `${req.min_count}`;
      errors.push({
        code: 'ROSTER_COUNT_MISMATCH',
        player_type: req.player_type,
        level: req.level_id ? req.levels?.level : null,
        message: req.level_id
          ? `Requires ${range} Level ${req.levels?.level} ${req.player_type}(s), has ${actual}.`
          : `Requires ${range} total ${req.player_type}(s), has ${actual}.`,
      });
    }
  }

  return errors;
}