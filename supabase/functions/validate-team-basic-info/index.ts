import { createClient } from '@supabase/supabase-js';
import { containsProfanity } from '../_shared/moderation.ts';

const SUPABASE_SECRET_KEYS = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!);
const SECRET_KEY = SUPABASE_SECRET_KEYS['default'];

const TEAM_NAME_MAX_LENGTH = 30;
const HOME_FIELD_NAME_MAX_LENGTH = 30;

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

    let body: { team_name?: string; home_field_name?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: { code: 'validation_failed', message: 'Request body must be valid JSON.' } }, 400);
    }

    const { team_name, home_field_name } = body;
    if (typeof team_name !== 'string' || typeof home_field_name !== 'string') {
      return jsonResponse(
        { error: { code: 'validation_failed', message: 'team_name and home_field_name are required.' } },
        400
      );
    }

    const trimmedTeamName = team_name.trim();
    const trimmedHomeFieldName = home_field_name.trim();

    const fieldErrors: Record<string, { code: string; message: string }> = {};

    if (trimmedTeamName.length < 1 || trimmedTeamName.length > TEAM_NAME_MAX_LENGTH) {
      fieldErrors.team_name = { code: 'team_name_invalid_length', message: `Team name must be 1-${TEAM_NAME_MAX_LENGTH} characters.` };
    } else if (containsProfanity(trimmedTeamName)) {
      fieldErrors.team_name = { code: 'team_name_flagged', message: 'Team name contains disallowed content.' };
    }

    if (trimmedHomeFieldName.length < 1 || trimmedHomeFieldName.length > HOME_FIELD_NAME_MAX_LENGTH) {
      fieldErrors.home_field_name = { code: 'home_field_name_invalid_length', message: `Home field name must be 1-${HOME_FIELD_NAME_MAX_LENGTH} characters.` };
    } else if (containsProfanity(trimmedHomeFieldName)) {
      fieldErrors.home_field_name = { code: 'home_field_name_flagged', message: 'Home field name contains disallowed content.' };
    }

    if (Object.keys(fieldErrors).length > 0) {
      return jsonResponse({ errors: fieldErrors }, 400);
    }

    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, SECRET_KEY);

    const { data: userData, error: userError } = await adminClient.auth.getUser(jwt);
    if (userError || !userData.user) {
      return jsonResponse({ error: { code: 'unauthenticated', message: 'Invalid or expired session.' } }, 401);
    }

    const { data: existing } = await adminClient
      .from('teams')
      .select('id')
      .eq('owner_id', userData.user.id)
      .ilike('team_name', trimmedTeamName)
      .maybeSingle();

    if (existing) {
      return jsonResponse(
        { errors: { team_name: { code: 'team_name_taken', message: 'You already have a team with this name.' } } },
        409
      );
    }

    return jsonResponse({ valid: true }, 200);
  } catch (err) {
    console.error('validate-team-basic-info unexpected error:', err);
    return jsonResponse({ error: { code: 'unexpected_error', message: 'Something went wrong.' } }, 500);
  }
});