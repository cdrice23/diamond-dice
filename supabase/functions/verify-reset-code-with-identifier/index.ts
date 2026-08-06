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

function invalidCodeResponse() {
  return jsonResponse({ error: { code: 'invalid_reset_code', message: 'Invalid or expired code.' } }, 400);
}

async function resolveEmail(identifier: string, adminClient: ReturnType<typeof createClient>): Promise<string | null> {
  if (EMAIL_PATTERN.test(identifier)) {
    return identifier;
  }
  const { data: profile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('username', identifier)
    .maybeSingle();

  if (!profile) return null;

  const { data: userData } = await adminClient.auth.admin.getUserById(profile.id);
  return userData.user?.email ?? null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let body: { identifier?: string; code?: string };
    try {
      body = await req.json();
    } catch {
      return invalidCodeResponse();
    }
    const { identifier, code } = body;

    if (!identifier || !code) {
      return invalidCodeResponse();
    }

    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, SECRET_KEY);
    const resolvedEmail = await resolveEmail(identifier, adminClient);

    if (!resolvedEmail) {
      return invalidCodeResponse();
    }

    const authClient = createClient(Deno.env.get('SUPABASE_URL')!, SECRET_KEY);

    const { data: sessionData, error: verifyError } = await authClient.auth.verifyOtp({
      email: resolvedEmail,
      token: code,
      type: 'recovery',
    });

    if (verifyError || !sessionData.session) {
      return invalidCodeResponse();
    }

    return jsonResponse({ session: sessionData.session }, 200);
  } catch (err) {
    console.error('verify-reset-code-with-identifier unexpected error:', err);
    return invalidCodeResponse();
  }
});