import { createClient } from '@supabase/supabase-js';
import { generateTeamRoster, type AdditionalFilters } from '../_shared/generate-team-roster.ts';

const SUPABASE_SECRET_KEYS = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!);
const SECRET_KEY = SUPABASE_SECRET_KEYS['default'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const result = await generateTeamRoster(adminClient, format_id, additional_filters);

    if (!result.success) {
      return jsonResponse(result, 200);
    }

    const playerIds = result.roster.map((r) => r.player_id);
    const { data: players, error: playersError } = await adminClient
      .from('players')
      .select('id, name, image_url, eligible_positions, batting_rating_level, pitching_rating_level')
      .in('id', playerIds);

    if (playersError) throw playersError;

    const playerMap = new Map((players ?? []).map((p) => [p.id, p]));

    const hydratedRoster = result.roster.map((assignment) => {
      const player = playerMap.get(assignment.player_id);
      const isPitcher = assignment.position === 'P';
      return {
        position: assignment.position,
        player_id: assignment.player_id,
        player_name: player?.name ?? null,
        player_image_url: player?.image_url ?? null,
        eligible_positions: player?.eligible_positions ?? [],
        level: isPitcher ? (player?.pitching_rating_level ?? null) : (player?.batting_rating_level ?? null),
      };
    });

    return jsonResponse({ success: true, roster: hydratedRoster }, 200);
  } catch (err) {
    console.error('generate-team-roster-draft unexpected error:', err);
    return jsonResponse({ error: { code: 'unexpected_error', message: 'Something went wrong generating the roster.' } }, 500);
  }
});