import { createClient } from '@supabase/supabase-js';
import { validateTeamRosterDraft, type ValidationError } from '../_shared/validate-team-roster.ts';

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

function bucketErrors(errors: ValidationError[]): { position: string[]; pitcher: string[] } {
  const position: string[] = [];
  const pitcher: string[] = [];

  for (const error of errors) {
    if (error.player_type === 'pitcher') {
      pitcher.push(error.message);
    } else {
      position.push(error.message);
    }
  }

  return { position, pitcher };
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
      format_id?: string;
      position_slots?: { position: string; player_id: string | null }[];
      pitcher_slots?: { player_id: string | null }[];
    };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: { code: 'validation_failed', message: 'Request body must be valid JSON.' } }, 400);
    }

    const { format_id, position_slots, pitcher_slots } = body;

    if (!format_id || !Array.isArray(position_slots) || !Array.isArray(pitcher_slots)) {
      return jsonResponse(
        { error: { code: 'validation_failed', message: 'format_id, position_slots, and pitcher_slots are required.' } },
        400
      );
    }

    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, SECRET_KEY);

    const { data: userData, error: userError } = await adminClient.auth.getUser(jwt);
    if (userError || !userData.user) {
      return jsonResponse({ error: { code: 'unauthenticated', message: 'Invalid or expired session.' } }, 401);
    }

    const errors = await validateTeamRosterDraft(adminClient, position_slots, pitcher_slots, format_id);

    if (errors.length > 0) {
      return jsonResponse({ errors: bucketErrors(errors) }, 400);
    }

    return jsonResponse({ valid: true }, 200);
  } catch (err) {
    console.error('validate-team-roster-draft unexpected error:', err);
    return jsonResponse({ error: { code: 'unexpected_error', message: 'Something went wrong validating the roster.' } }, 500);
  }
});