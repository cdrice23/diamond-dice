import { createClient } from '@supabase/supabase-js';
import { Profanease } from 'profanease';

const SUPABASE_SECRET_KEYS = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!);
const SECRET_KEY = SUPABASE_SECRET_KEYS['default'];

const DISPLAY_NAME_MIN_LENGTH = 1;
const DISPLAY_NAME_MAX_LENGTH = 30;

const profanityFilter = new Profanease({ languages: [en] });

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

    let body: { display_name?: string; auto_roll_enabled?: boolean };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: { code: 'validation_failed', message: 'Request body must be valid JSON.' } }, 400);
    }

    const { display_name, auto_roll_enabled } = body;

    if (typeof display_name !== 'string') {
      return jsonResponse(
        { error: { code: 'validation_failed', field: 'display_name', message: 'Display name is required.' } },
        400
      );
    }
    if (typeof auto_roll_enabled !== 'boolean') {
      return jsonResponse(
        { error: { code: 'validation_failed', field: 'auto_roll_enabled', message: 'auto_roll_enabled must be a boolean.' } },
        400
      );
    }

    const trimmedDisplayName = display_name.trim();
    if (trimmedDisplayName.length < DISPLAY_NAME_MIN_LENGTH || trimmedDisplayName.length > DISPLAY_NAME_MAX_LENGTH) {
      return jsonResponse(
        {
          error: {
            code: 'display_name_invalid_length',
            field: 'display_name',
            message: `Display name must be between ${DISPLAY_NAME_MIN_LENGTH} and ${DISPLAY_NAME_MAX_LENGTH} characters.`,
          },
        },
        400
      );
    }

    if (profanityFilter.check(trimmedDisplayName)) {
      return jsonResponse(
        {
          error: {
            code: 'display_name_flagged',
            field: 'display_name',
            message: 'Display name contains disallowed content.',
          },
        },
        400
      );
    }

    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, SECRET_KEY);

    const { data: userData, error: userError } = await adminClient.auth.getUser(jwt);
    if (userError || !userData.user) {
      return jsonResponse({ error: { code: 'unauthenticated', message: 'Invalid or expired session.' } }, 401);
    }

    const { data: updatedProfile, error: updateError } = await adminClient
      .from('profiles')
      .update({ display_name: trimmedDisplayName, auto_roll_enabled })
      .eq('id', userData.user.id)
      .select('id, username, display_name, auto_roll_enabled')
      .single();

    if (updateError || !updatedProfile) {
      console.error('update-profile write error:', updateError);
      return jsonResponse({ error: { code: 'update_failed', message: 'Could not save profile changes.' } }, 500);
    }

    return jsonResponse({ profile: updatedProfile }, 200);
  } catch (err) {
    console.error('update-profile unexpected error:', err);
    return jsonResponse({ error: { code: 'unexpected_error', message: 'Something went wrong.' } }, 500);
  }
});