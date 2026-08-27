import { createClient } from '@supabase/supabase-js';
import { containsProfanity } from '../_shared/moderation.ts';

const SUPABASE_SECRET_KEYS = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!);
const SECRET_KEY = SUPABASE_SECRET_KEYS['default'];

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

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
    let body: { email?: string; password?: string; username?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: { code: 'validation_failed', message: 'Request body must be valid JSON.' } }, 400);
    }

    const { email, password, username } = body;

    if (!email || !password || !username) {
      return jsonResponse(
        { error: { code: 'validation_failed', message: 'email, password, and username are required.' } },
        400
      );
    }

    if (!USERNAME_PATTERN.test(username)) {
      return jsonResponse(
        {
          error: {
            code: 'username_invalid_format',
            field: 'username',
            message: 'Username must be 3-20 characters (letters, numbers, underscores only).',
          },
        },
        400
      );
    }

    if (containsProfanity(username)) {
      return jsonResponse(
        { error: { code: 'username_flagged', field: 'username', message: 'That username is not allowed.' } },
        400
      );
    }

    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, SECRET_KEY);

    const { data: existing } = await adminClient
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existing) {
      return jsonResponse(
        { error: { code: 'username_taken', field: 'username', message: 'That username is already taken.' } },
        409
      );
    }

    const anonClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);

    const { error: signUpError } = await anonClient.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (signUpError) {
      return jsonResponse(
        {
          error: {
            code: signUpError.code ?? 'signup_failed',
            message: signUpError.message,
          },
        },
        signUpError.status ?? 400
      );
    }

    return jsonResponse({ email }, 200);
  } catch (err) {
    console.error('signup unexpected error:', err);
    return jsonResponse({ error: { code: 'unexpected_error', message: 'Something went wrong.' } }, 500);
  }
});