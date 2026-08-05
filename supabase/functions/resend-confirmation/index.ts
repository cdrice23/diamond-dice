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

function genericResponse() {
  return jsonResponse(
    { message: 'If that account exists and needs confirmation, a new email has been sent.' },
    200
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let body: { identifier?: string };
    try {
      body = await req.json();
    } catch {
      return genericResponse();
    }
    const { identifier } = body;

    if (!identifier) {
      return genericResponse();
    }

    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, SECRET_KEY);

    let resolvedEmail: string | null = null;

    if (EMAIL_PATTERN.test(identifier)) {
      resolvedEmail = identifier;
    } else {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('username', identifier)
        .maybeSingle();

      if (profile) {
        const { data: userData } = await adminClient.auth.admin.getUserById(profile.id);
        resolvedEmail = userData.user?.email ?? null;
      }
    }

    if (resolvedEmail) {
      await adminClient.auth.resend({ type: 'signup', email: resolvedEmail });
    }

    return genericResponse();
  } catch (err) {
    console.error('resend-confirmation unexpected error:', err);
    return genericResponse();
  }
});