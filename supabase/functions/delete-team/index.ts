import { createClient } from '@supabase/supabase-js';

const SUPABASE_SECRET_KEYS = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!);
const SECRET_KEY = SUPABASE_SECRET_KEYS['default'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TERMINAL_GAME_STATUSES = ['completed', 'forfeited', 'abandoned'];

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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: { code: 'unauthenticated', message: 'Missing or invalid Authorization header.' } }, 401);
    }
    const jwt = authHeader.slice('Bearer '.length);

    let body: { team_id?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: { code: 'validation_failed', message: 'Request body must be valid JSON.' } }, 400);
    }

    const { team_id } = body;
    if (!team_id) {
      return jsonResponse({ error: { code: 'validation_failed', message: 'team_id is required.' } }, 400);
    }

    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, SECRET_KEY);

    const { data: userData, error: userError } = await adminClient.auth.getUser(jwt);
    if (userError || !userData.user) {
      return jsonResponse({ error: { code: 'unauthenticated', message: 'Invalid or expired session.' } }, 401);
    }

    const { data: team } = await adminClient.from('teams').select('id, owner_id').eq('id', team_id).maybeSingle();
    if (!team || team.owner_id !== userData.user.id) {
      return jsonResponse({ error: { code: 'not_found', message: 'Team not found.' } }, 404);
    }

    const { data: activeGames, error: gamesError } = await adminClient
      .from('games')
      .select('id')
      .or(`home_team_id.eq.${team_id},away_team_id.eq.${team_id}`)
      .not('status', 'in', `(${TERMINAL_GAME_STATUSES.join(',')})`);

    if (gamesError) {
      console.error('delete-team games check error:', gamesError);
      return jsonResponse({ error: { code: 'update_failed', message: 'Could not verify team is safe to delete.' } }, 500);
    }

    if (activeGames && activeGames.length > 0) {
      return jsonResponse(
        {
          error: {
            code: 'team_in_active_game',
            message: 'This team is part of an in-progress game and cannot be deleted until that game ends.',
          },
        },
        409
      );
    }

    const { error: rosterDeleteError } = await adminClient.from('roster_slots').delete().eq('team_id', team_id);
    if (rosterDeleteError) {
      console.error('delete-team roster delete error:', rosterDeleteError);
      return jsonResponse({ error: { code: 'update_failed', message: 'Could not delete team.' } }, 500);
    }

    const { error: teamDeleteError } = await adminClient.from('teams').delete().eq('id', team_id);
    if (teamDeleteError) {
      console.error('delete-team team delete error:', teamDeleteError);
      return jsonResponse({ error: { code: 'update_failed', message: 'Could not delete team.' } }, 500);
    }

    return jsonResponse({ success: true }, 200);
  } catch (err) {
    console.error('delete-team unexpected error:', err);
    return jsonResponse({ error: { code: 'unexpected_error', message: 'Something went wrong deleting the team.' } }, 500);
  }
});