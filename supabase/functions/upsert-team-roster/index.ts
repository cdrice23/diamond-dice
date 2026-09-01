import { createClient } from '@supabase/supabase-js';
import { validateTeamRosterDraft } from '../_shared/validate-team-roster.ts';

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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: { code: 'unauthenticated', message: 'Missing or invalid Authorization header.' } }, 401);
    }
    const jwt = authHeader.slice('Bearer '.length);

    let body: {
      team_id?: string;
      format_id?: string;
      position_slots?: { position: string; player_id: string | null }[];
      pitcher_slots?: { player_id: string | null }[];
      batting_order?: string[];
    };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: { code: 'validation_failed', message: 'Request body must be valid JSON.' } }, 400);
    }

    const { team_id, format_id, position_slots, pitcher_slots, batting_order } = body;

    if (!team_id || !format_id || !Array.isArray(position_slots) || !Array.isArray(pitcher_slots) || !Array.isArray(batting_order)) {
      return jsonResponse(
        { error: { code: 'validation_failed', message: 'team_id, format_id, position_slots, pitcher_slots, and batting_order are required.' } },
        400
      );
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

    const errors = await validateTeamRosterDraft(adminClient, position_slots, pitcher_slots, format_id);
    if (errors.length > 0) {
      return jsonResponse({ errors: errors.map((e) => e.message) }, 400);
    }

    const orderByPlayerId = new Map(batting_order.map((id, index) => [id, index + 1]));

    const positionRows = position_slots
      .filter((slot) => slot.player_id !== null)
      .map((slot) => ({
        team_id,
        player_id: slot.player_id,
        default_position: slot.position,
        current_position: slot.position,
        default_batting_order: orderByPlayerId.get(slot.player_id!) ?? null,
        current_batting_order: orderByPlayerId.get(slot.player_id!) ?? null,
      }));

    const pitcherRows = pitcher_slots
      .filter((slot) => slot.player_id !== null)
      .map((slot) => ({
        team_id,
        player_id: slot.player_id,
        default_position: 'P',
        current_position: 'P',
        default_batting_order: null,
        current_batting_order: null,
      }));

    const { error: deleteError } = await adminClient.from('roster_slots').delete().eq('team_id', team_id);
    if (deleteError) {
      console.error('upsert-team-roster delete error:', deleteError);
      return jsonResponse({ error: { code: 'update_failed', message: 'Could not save roster.' } }, 500);
    }

    const { error: insertError } = await adminClient.from('roster_slots').insert([...positionRows, ...pitcherRows]);
    if (insertError) {
      console.error('upsert-team-roster insert error:', insertError);
      return jsonResponse({ error: { code: 'update_failed', message: 'Could not save roster.' } }, 500);
    }

    return jsonResponse({ success: true }, 200);
  } catch (err) {
    console.error('upsert-team-roster unexpected error:', err);
    return jsonResponse({ error: { code: 'unexpected_error', message: 'Something went wrong saving the roster.' } }, 500);
  }
});