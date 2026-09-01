import { SupabaseClient } from '@supabase/supabase-js';

export type AdditionalFilters = {
  mlb_team_ids?: string[];
  debut_year_min?: number;
  debut_year_max?: number;
  award_type_ids?: string[];
};

type Candidate = {
  id: string;
  eligible_positions: string[];
  batting_rating_level: number | null;
  pitching_rating_level: number | null;
};

export type GeneratedRosterAssignment = { position: string; player_id: string };

export type GenerateRosterResult =
  | { success: true; roster: GeneratedRosterAssignment[] }
  | { success: false; error: { code: string; requirement?: string; message: string } };

const POSITION_FILL_ORDER = ['C', '1B', '2B', '3B', 'SS', 'OF', 'OF', 'OF', 'DH'];

function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

function removeById(pool: Candidate[], id: string) {
  const idx = pool.findIndex((c) => c.id === id);
  if (idx !== -1) pool.splice(idx, 1);
}

export async function generateTeamRoster(
  adminClient: SupabaseClient,
  formatId: string,
  additionalFilters?: AdditionalFilters
): Promise<GenerateRosterResult> {
  const { data: formatReqs } = await adminClient
    .from('format_roster_requirements')
    .select('player_type, level_id, min_count, max_count, levels(level)')
    .eq('format_id', formatId);

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

    if (additionalFilters?.debut_year_min) {
      query = query.gte('mlb_debut_date', `${additionalFilters.debut_year_min}-01-01`);
    }
    if (additionalFilters?.debut_year_max) {
      query = query.lte('mlb_debut_date', `${additionalFilters.debut_year_max}-12-31`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const filteredIds = additionalFilters ? await resolveFilteredPlayerIds(additionalFilters) : null;
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

  const roster: GeneratedRosterAssignment[] = [];

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
      return {
        success: false,
        error: {
          code: 'POOL_EXHAUSTED',
          requirement: position,
          message: `Could not find an eligible batter for ${position} under the current constraints.`,
        },
      };
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
          return {
            success: false,
            error: {
              code: 'POOL_EXHAUSTED',
              requirement: `Level ${level} pitcher`,
              message: `Could not find enough Level ${level} pitchers under the current constraints.`,
            },
          };
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
        return {
          success: false,
          error: { code: 'POOL_EXHAUSTED', requirement: 'pitcher', message: 'Could not find enough pitchers under the current constraints.' },
        };
      }
      roster.push({ position: 'P', player_id: chosen.id });
      removeById(pitcherPool, chosen.id);
    }
  }

  return { success: true, roster };
}