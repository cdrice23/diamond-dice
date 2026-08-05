import { createClient } from '@supabase/supabase-js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function invalidCredentialsResponse() {
  return jsonResponse({ error: { code: 'invalid_credentials', message: 'Invalid credentials.' } }, 400);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let body: { identifier?: string; password?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: { code: 'validation_failed', message: 'Request body must be valid JSON.' } }, 400);
    }
    const { identifier, password } = body;

    if (!identifier || !password) {
      return jsonResponse({ error: { code: 'validation_failed', message: 'Missing identifier or password.' } }, 400);
    }

    const forwardedFor = req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? '';

    let resolvedEmail: string;

    if (EMAIL_PATTERN.test(identifier)) {
      resolvedEmail = identifier;
    } else {
      const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, SECRET_KEY);

      const { data: profile, error: profileError } = await adminClient
        .from('profiles')
        .select('id')
        .eq('username', identifier)
        .maybeSingle();

      if (profileError || !profile) {
        return invalidCredentialsResponse();
      }

      const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(profile.id);

      if (userError || !userData.user?.email) {
        return invalidCredentialsResponse();
      }

      resolvedEmail = userData.user.email;
    }

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      SECRET_KEY,
      { global: { headers: { 'Sb-Forwarded-For': forwardedFor } } }
    );

    const { data: sessionData, error: signInError } = await authClient.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    });

    if (signInError) {
      let code = signInError.code ?? 'invalid_credentials';
      if (code === 'email_not_confirmed' && !EMAIL_PATTERN.test(identifier)) {
        code = 'email_not_confirmed_for_username';
      }
      return jsonResponse({ error: { code, message: signInError.message } }, 400);
    }

    return jsonResponse({ session: sessionData.session }, 200);
  } catch (err) {
    console.error('login-with-identifier unexpected error:', err);
    return jsonResponse({ error: { code: 'unexpected_error', message: 'Something went wrong.' } }, 500);
  }
});