import { createClient } from '@supabase/supabase-js';
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

    const errors = await validateTeamRoster(adminClient, team_id, format_id);

    return jsonResponse({ valid: errors.length === 0, errors }, 200);
  } catch (err) {
    console.error('validate-team-roster unexpected error:', err);
    return jsonResponse({ error: { code: 'unexpected_error', message: 'Something went wrong validating the roster.' } }, 500);
  }
});