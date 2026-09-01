import { createClient } from '@supabase/supabase-js';
import { generateTeamRoster, type AdditionalFilters } from '../_shared/generate-team-roster.ts';
import { validateTeamRoster } from '../_shared/validate-team-roster.ts';

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

    const result = await generateTeamRoster(adminClient, format_id, additional_filters);

    if (!result.success) {
      return jsonResponse(result, 200);
    }

    if (dry_run) {
      return jsonResponse(result, 200);
    }

    await adminClient.from('roster_slots').delete().eq('team_id', team_id);
    const { error: insertError } = await adminClient
      .from('roster_slots')
      .insert(result.roster.map((r) => ({ team_id, player_id: r.player_id, default_position: r.position })));
    if (insertError) throw insertError;

    const safetyNetErrors = await validateTeamRoster(adminClient, team_id, format_id);
    if (safetyNetErrors.length > 0) {
      console.error('generate-team-roster produced an invalid roster:', safetyNetErrors);
      return jsonResponse({ success: false, error: { code: 'GENERATION_INVALID', message: 'Generated roster failed validation.' } }, 500);
    }

    return jsonResponse(result, 200);
  } catch (err) {
    console.error('generate-team-roster unexpected error:', err);
    return jsonResponse({ error: { code: 'unexpected_error', message: 'Something went wrong generating the roster.' } }, 500);
  }
});