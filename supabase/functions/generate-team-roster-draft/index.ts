import { createClient } from '@supabase/supabase-js';
import { generateTeamRoster, type AdditionalFilters } from '../_shared/generate-team-roster.ts';
import { computeRosterValidationErrors, fetchRequirements, type RosterSlotInput } from '../_shared/validate-team-roster.ts';

const SUPABASE_SECRET_KEYS = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!);
const SECRET_KEY = SUPABASE_SECRET_KEYS['default'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_ATTEMPTS = 3;

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
    let body: { format_id?: string; additional_filters?: AdditionalFilters };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: { code: 'validation_failed', message: 'Request body must be valid JSON.' } }, 400);
    }

    const { format_id, additional_filters } = body;
    if (!format_id) {
      return jsonResponse({ error: { code: 'validation_failed', message: 'format_id is required.' } }, 400);
    }

    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, SECRET_KEY);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: { code: 'unauthenticated', message: 'Missing or invalid Authorization header.' } }, 401);
    }
    const jwt = authHeader.slice('Bearer '.length);

    const { data: userData, error: userError } = await adminClient.auth.getUser(jwt);
    if (userError || !userData.user) {
      return jsonResponse({ error: { code: 'unauthenticated', message: 'Invalid or expired session.' } }, 401);
    }

    const { requirements, positionRequirements } = await fetchRequirements(adminClient, format_id);

    let lastFailureMessage = 'Could not generate a roster under the current constraints.';

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const result = await generateTeamRoster(adminClient, format_id, additional_filters);

      if (!result.success) {
        return jsonResponse(result, 200);
      }

      const playerIds = result.roster.map((r) => r.player_id);
      const { data: players, error: playersError } = await adminClient
        .from('players')
        .select('id, name, image_url, eligible_positions, is_qualified_batter, is_qualified_pitcher, batting_rating_level, pitching_rating_level')
        .in('id', playerIds);

      if (playersError) throw playersError;

      const playerMap = new Map((players ?? []).map((p) => [p.id, p]));

      const slots: RosterSlotInput[] = result.roster.map((assignment) => {
        const player = playerMap.get(assignment.player_id);
        return {
          position: assignment.position,
          player: player
            ? {
                eligible_positions: player.eligible_positions,
                is_qualified_batter: player.is_qualified_batter,
                is_qualified_pitcher: player.is_qualified_pitcher,
                batting_rating_level: player.batting_rating_level,
                pitching_rating_level: player.pitching_rating_level,
              }
            : null,
        };
      });

      const validationErrors = computeRosterValidationErrors(slots, requirements, positionRequirements);

      if (validationErrors.length > 0) {
        console.warn(`generate-team-roster-draft: attempt ${attempt + 1} produced an invalid roster:`, validationErrors);
        lastFailureMessage = "We couldn't generate a valid roster for this Format. Please try again.";
        continue;
      }

      const isPitcher = (position: string) => position === 'P';
      const hydratedRoster = result.roster.map((assignment) => {
        const player = playerMap.get(assignment.player_id);
        return {
          position: assignment.position,
          player_id: assignment.player_id,
          player_name: player?.name ?? null,
          player_image_url: player?.image_url ?? null,
          eligible_positions: player?.eligible_positions ?? [],
          level: isPitcher(assignment.position) ? (player?.pitching_rating_level ?? null) : (player?.batting_rating_level ?? null),
        };
      });

      return jsonResponse({ success: true, roster: hydratedRoster }, 200);
    }

    return jsonResponse({ success: false, error: { code: 'GENERATION_INVALID', message: lastFailureMessage } }, 200);
  } catch (err) {
    console.error('generate-team-roster-draft unexpected error:', err);
    return jsonResponse({ error: { code: 'unexpected_error', message: 'Something went wrong generating the roster.' } }, 500);
  }
});