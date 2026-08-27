import { createClient } from '@supabase/supabase-js';
import { validateTeamRoster } from '../_shared/validate-team-roster.ts';

const SUPABASE_SECRET_KEYS = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!);
const SECRET_KEY = SUPABASE_SECRET_KEYS['default'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const POSITION_FILL_ORDER = ['C', '1B', '2B', '3B', 'SS', 'OF', 'OF', 'OF', 'DH'];

type Candidate = {
  id: string;
  eligible_positions: string[];
  batting_rating_level: number | null;
  pitching_rating_level: number | null;
};

type AdditionalFilters = {
  mlb_team_ids?: string[];
  debut_year_min?: number;
  debut_year_max?: number;
  award_type_ids?: string[];
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

function removeById(pool: Candidate[], id: string) {
  const idx = pool.findIndex((c) => c.id === id);
  if (idx !== -1) pool.splice(idx, 1);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let body: {
      team_id?: string;
      format_id?: string;
      dry_run?: boolean;
      additional_filters?: AdditionalFilters;
    };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: { code: 'validation_failed', message: 'Request body must be valid JSON.' } }, 400);
    }

    const { team_id, format_id, dry_run = false, additional_filters } = body;
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

    const { data: team } = await adminClient.from('teams').select('id, owner_id').eq('id', team_id).maybeSingle();
    if (!team || team.owner_id !== user.id) {
      return jsonResponse({ error: { code: 'not_found', message: 'Team not found.' } }, 404);
    }

    const { data: formatReqs } = await adminClient
      .from('format_roster_requirements')
      .select('player_type, level_id, min_count, max_count, levels(level)')
      .eq('format_id', format_id);

    const { data: positionReqs } = await adminClient
      .from('position_requirements')
      .select('slot_position, requires_eligibility, min_count, max_count');

    const positionReqMap = new Map((positionReqs ?? []).map((r) => [r.slot_position, r]));

    async function resolveFilteredPlayerIds(filters: AdditionalFilters): Promise<Set<string> | null> {
      const idSets: Set<string>[] = [];

      if (filters.mlb_team_ids?.length) {
        const { data, error } = await adminClient
          .from('player_mlb_team_history')
          .select('player_id')
          .in('mlb_team_id', filters.mlb_team_ids);
        if (error) throw error;
        idSets.push(new Set((data ?? []).map((r) => r.player_id)));
      }

      if (filters.award_type_ids?.length) {
        const { data, error } = await adminClient
          .from('player_awards')
          .select('player_id')
          .in('award_type_id', filters.award_type_ids);
        if (error) throw error;
        idSets.push(new Set((data ?? []).map((r) => r.player_id)));
      }

      if (idSets.length === 0) return null;
      return idSets.reduce((acc, set) => new Set([...acc].filter((id) => set.has(id))));
    }

    async function loadCandidates(playerType: 'batter' | 'pitcher'): Promise<Candidate[]> {
      let query = adminClient
        .from('players')
        .select('id, eligible_positions, batting_rating_level, pitching_rating_level, mlb_debut_date')
        .eq(playerType === 'batter' ? 'is_qualified_batter' : 'is_qualified_pitcher', true);

      if (additional_filters?.debut_year_min) {
        query = query.gte('mlb_debut_date', `${additional_filters.debut_year_min}-01-01`);
      }
      if (additional_filters?.debut_year_max) {
        query = query.lte('mlb_debut_date', `${additional_filters.debut_year_max}-12-31`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const filteredIds = additional_filters ? await resolveFilteredPlayerIds(additional_filters) : null;
      const rows = data ?? [];
      return filteredIds ? rows.filter((r) => filteredIds.has(r.id)) : rows;
    }

    const batterPool = await loadCandidates('batter');
    const pitcherPool = await loadCandidates('pitcher');

    function buildLevelNeed(playerType: 'batter' | 'pitcher') {
      const perLevel = (formatReqs ?? []).filter((r) => r.player_type === playerType && r.level_id);
      const need = new Map<number, { remaining: number; max: number }>();
      for (const r of perLevel) {
        const level = r.levels?.level;
        if (level != null) need.set(level, { remaining: r.min_count, max: r.max_count ?? Infinity });
      }
      return need;
    }

    const batterLevelNeed = buildLevelNeed('batter');
    const pitcherLevelNeed = buildLevelNeed('pitcher');

    const roster: { position: string; player_id: string }[] = [];

    for (const position of POSITION_FILL_ORDER) {
      const req = positionReqMap.get(position);
      const eligiblePool = req?.requires_eligibility
        ? batterPool.filter((c) => c.eligible_positions?.includes(position))
        : batterPool;

      let chosen: Candidate | undefined;
      const openLevels = [...batterLevelNeed.entries()].filter(([, v]) => v.remaining > 0);

      if (openLevels.length > 0) {
        const scored = openLevels
          .map(([level]) => ({ level, pool: eligiblePool.filter((c) => c.batting_rating_level === level) }))
          .filter((s) => s.pool.length > 0)
          .sort((a, b) => a.pool.length - b.pool.length);

        if (scored.length > 0) {
          chosen = pickRandom(scored[0].pool);
          if (chosen) batterLevelNeed.get(scored[0].level)!.remaining--;
        }
      }

      if (!chosen) chosen = pickRandom(eligiblePool);

      if (!chosen) {
        return jsonResponse(
          {
            success: false,
            error: {
              code: 'POOL_EXHAUSTED',
              requirement: position,
              message: `Could not find an eligible batter for ${position} under the current constraints.`,
            },
          },
          200
        );
      }

      roster.push({ position, player_id: chosen.id });
      removeById(batterPool, chosen.id);
    }

    const openPitcherLevels = [...pitcherLevelNeed.entries()].filter(([, v]) => v.remaining > 0);

    if (openPitcherLevels.length > 0) {
      const sorted = openPitcherLevels.sort((a, b) => {
        const poolA = pitcherPool.filter((c) => c.pitching_rating_level === a[0]).length;
        const poolB = pitcherPool.filter((c) => c.pitching_rating_level === b[0]).length;
        return poolA - poolB;
      });

      for (const [level, need] of sorted) {
        for (let i = 0; i < need.remaining; i++) {
          const levelPool = pitcherPool.filter((c) => c.pitching_rating_level === level);
          const chosen = pickRandom(levelPool);
          if (!chosen) {
            return jsonResponse(
              {
                success: false,
                error: {
                  code: 'POOL_EXHAUSTED',
                  requirement: `Level ${level} pitcher`,
                  message: `Could not find enough Level ${level} pitchers under the current constraints.`,
                },
              },
              200
            );
          }
          roster.push({ position: 'P', player_id: chosen.id });
          removeById(pitcherPool, chosen.id);
        }
      }
    } else {
      const aggReq = (formatReqs ?? []).find((r) => r.player_type === 'pitcher' && !r.level_id);
      const count = aggReq?.min_count ?? 0;
      for (let i = 0; i < count; i++) {
        const chosen = pickRandom(pitcherPool);
        if (!chosen) {
          return jsonResponse(
            {
              success: false,
              error: {
                code: 'POOL_EXHAUSTED',
                requirement: 'pitcher',
                message: 'Could not find enough pitchers under the current constraints.',
              },
            },
            200
          );
        }
        roster.push({ position: 'P', player_id: chosen.id });
        removeById(pitcherPool, chosen.id);
      }
    }

    if (dry_run) {
      return jsonResponse({ success: true, roster }, 200);
    }

    await adminClient.from('roster_slots').delete().eq('team_id', team_id);
    const { error: insertError } = await adminClient.from('roster_slots').insert(
      roster.map((r) => ({ team_id, player_id: r.player_id, default_position: r.position }))
    );
    if (insertError) throw insertError;

    const safetyNetErrors = await validateTeamRoster(adminClient, team_id, format_id);
    if (safetyNetErrors.length > 0) {
      console.error('generate-team-roster produced an invalid roster:', safetyNetErrors);
      return jsonResponse(
        { success: false, error: { code: 'GENERATION_INVALID', message: 'Generated roster failed validation.' } },
        500
      );
    }

    return jsonResponse({ success: true, roster }, 200);
  } catch (err) {
    console.error('generate-team-roster unexpected error:', err);
    return jsonResponse({ error: { code: 'unexpected_error', message: 'Something went wrong generating the roster.' } }, 500);
  }
});