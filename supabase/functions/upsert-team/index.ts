import { createClient } from '@supabase/supabase-js';
import { containsProfanity } from '../_shared/moderation.ts';

const SUPABASE_SECRET_KEYS = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!);
const SECRET_KEY = SUPABASE_SECRET_KEYS['default'];

const TEAM_NAME_MAX_LENGTH = 30;
const HOME_FIELD_NAME_MAX_LENGTH = 30;
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

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
      team_name?: string;
      home_field_name?: string;
      team_theme_color_primary?: string | null;
      team_theme_color_secondary?: string | null;
      format_id?: string | null;
    };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: { code: 'validation_failed', message: 'Request body must be valid JSON.' } }, 400);
    }

    const { team_id, team_name, home_field_name, team_theme_color_primary, team_theme_color_secondary, format_id } = body;

    if (typeof team_name !== 'string' || typeof home_field_name !== 'string') {
      return jsonResponse(
        { error: { code: 'validation_failed', message: 'team_name and home_field_name are required.' } },
        400
      );
    }

    const trimmedTeamName = team_name.trim();
    const trimmedHomeFieldName = home_field_name.trim();

    if (trimmedTeamName.length < 1 || trimmedTeamName.length > TEAM_NAME_MAX_LENGTH) {
      return jsonResponse(
        { error: { code: 'team_name_invalid_length', field: 'team_name', message: `Team name must be 1-${TEAM_NAME_MAX_LENGTH} characters.` } },
        400
      );
    }
    if (trimmedHomeFieldName.length < 1 || trimmedHomeFieldName.length > HOME_FIELD_NAME_MAX_LENGTH) {
      return jsonResponse(
        { error: { code: 'home_field_name_invalid_length', field: 'home_field_name', message: `Home field name must be 1-${HOME_FIELD_NAME_MAX_LENGTH} characters.` } },
        400
      );
    }

    if (containsProfanity(trimmedTeamName)) {
      return jsonResponse(
        { error: { code: 'team_name_flagged', field: 'team_name', message: 'Team name contains disallowed content.' } },
        400
      );
    }
    if (containsProfanity(trimmedHomeFieldName)) {
      return jsonResponse(
        { error: { code: 'home_field_name_flagged', field: 'home_field_name', message: 'Home field name contains disallowed content.' } },
        400
      );
    }

    for (const [field, value] of [
      ['team_theme_color_primary', team_theme_color_primary],
      ['team_theme_color_secondary', team_theme_color_secondary],
    ] as const) {
      if (value != null && !HEX_COLOR_PATTERN.test(value)) {
        return jsonResponse(
          { error: { code: 'invalid_hex_color', field, message: `${field} must be a valid 6-digit hex code.` } },
          400
        );
      }
    }
    if (
      team_theme_color_primary &&
      team_theme_color_secondary &&
      team_theme_color_primary.toLowerCase() === team_theme_color_secondary.toLowerCase()
    ) {
      return jsonResponse(
        { error: { code: 'duplicate_theme_colors', message: 'Primary and secondary colors must be different.' } },
        400
      );
    }

    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, SECRET_KEY);

    const { data: userData, error: userError } = await adminClient.auth.getUser(jwt);
    if (userError || !userData.user) {
      return jsonResponse({ error: { code: 'unauthenticated', message: 'Invalid or expired session.' } }, 401);
    }

    const payload = {
      owner_id: userData.user.id,
      team_name: trimmedTeamName,
      home_field_name: trimmedHomeFieldName,
      team_theme_color_primary: team_theme_color_primary ?? null,
      team_theme_color_secondary: team_theme_color_secondary ?? null,
      format_id: format_id ?? null,
    };

    let result;
    if (team_id) {
      result = await adminClient
        .from('teams')
        .update(payload)
        .eq('id', team_id)
        .eq('owner_id', userData.user.id)
        .select('id, team_name, home_field_name, team_theme_color_primary, team_theme_color_secondary')
        .single();
    } else {
      result = await adminClient
        .from('teams')
        .insert(payload)
        .select('id, team_name, home_field_name, team_theme_color_primary, team_theme_color_secondary')
        .single();
    }

    if (result.error) {
      if (result.error.code === '23505') {
        return jsonResponse(
          { error: { code: 'team_name_taken', field: 'team_name', message: 'You already have a team with this name.' } },
          409
        );
      }
      console.error('upsert-team write error:', result.error);
      return jsonResponse({ error: { code: 'update_failed', message: 'Could not save team.' } }, 500);
    }

    return jsonResponse({ team: result.data }, 200);
  } catch (err) {
    console.error('upsert-team unexpected error:', err);
    return jsonResponse({ error: { code: 'unexpected_error', message: 'Something went wrong.' } }, 500);
  }
});