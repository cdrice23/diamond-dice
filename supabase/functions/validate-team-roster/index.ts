import { createClient } from '@supabase/supabase-js';

const SUPABASE_SECRET_KEYS = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!);
const SECRET_KEY = SUPABASE_SECRET_KEYS['default'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ValidationError = {
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

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let body: { team_id?: string; format_id?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: { code: 'validation_failed', message: 'Request body must be valid JSON.' } }, 400);
    }
    const { team_id, format_id } = body;

    if (!team_id || !format_id) {
      return jsonResponse({ error: { code: 'validation_failed', message: 'team_id and format_id are required.' } }, 400);
    }

    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, SECRET_KEY);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: { code: 'unauthenticated', message: 'Missing Authorization header.' } }, 401);
    }
    const {
      data: { user },
      error: authError,
    } = await adminClient.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return jsonResponse({ error: { code: 'unauthenticated', message: 'Invalid or expired session.' } }, 401);
    }

    const { data: team } = await adminClient
      .from('teams')
      .select('id, owner_id')
      .eq('id', team_id)
      .maybeSingle();

    if (!team || team.owner_id !== user.id) {
      return jsonResponse({ error: { code: 'not_found', message: 'Team not found.' } }, 404);
    }

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
      .eq('team_id', team_id);

    if (rosterError) throw rosterError;

    const { data: requirements, error: reqError } = await adminClient
      .from('format_roster_requirements')
      .select('player_type, level_id, min_count, max_count, levels(level)')
      .eq('format_id', format_id);

    if (reqError) throw reqError;

    const { data: positionRequirements, error: posReqError } = await adminClient
      .from('position_requirements')
      .select('slot_position, requires_eligibility, min_count, max_count');

    if (posReqError) throw posReqError;

    const positionReqMap = new Map(
      (positionRequirements ?? []).map((r) => [r.slot_position, r])
    );

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
          message: `Player does not meet the qualification standard for ${
            isPitcherSlot ? 'pitching' : 'batting'
          }.`,
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
        errors.push({
          code: 'POSITION_COVERAGE_MISMATCH',
          message: `Requires ${range} ${slotPosition}, has ${actual}.`,
        });
      }
    }

    const counts = new Map<string, number>();

    for (const slot of rosterSlots ?? []) {
      const player = slot.players;
      if (!player) continue;
      const position = slot.current_position ?? slot.default_position;
      const playerType = position === 'P' ? 'pitcher' : 'batter';
      const level =
        playerType === 'pitcher' ? player.pitching_rating_level : player.batting_rating_level;

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

    return jsonResponse({ valid: errors.length === 0, errors }, 200);
  } catch (err) {
    console.error('validate-team-roster unexpected error:', err);
    return jsonResponse({ error: { code: 'unexpected_error', message: 'Something went wrong validating the roster.' } }, 500);
  }
});