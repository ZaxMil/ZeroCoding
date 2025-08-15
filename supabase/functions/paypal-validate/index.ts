// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const getCorsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

type Mode = 'sandbox' | 'live';

function b64(input: string) {
  return btoa(input);
}

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const allowed = (Deno.env.get('ALLOWED_ORIGIN') || '').split(',').map(s=>s.trim()).filter(Boolean);
  const corsHeaders = allowed.length > 0 && allowed.includes(origin) ? getCorsHeaders(origin) : getCorsHeaders('*');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // CORS check for non-OPTIONS requests
  if (allowed.length > 0 && origin && !allowed.includes(origin)) {
    return new Response(JSON.stringify({ ok: false, error: 'forbidden_origin' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 403,
    });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { mode?: Mode; clientId?: string };
    const mode = body.mode || 'sandbox';
    const clientId = body.clientId || '';

    const base = Deno.env.get('PAYPAL_BASE_URL') || (mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com');
    const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET') || '';
    const webhookId = Deno.env.get('PAYPAL_WEBHOOK_ID');

    if (!clientSecret || !clientId) {
      return new Response(JSON.stringify({ ok: false, tokenOk: false, webhookOk: undefined, reason: 'missing credentials' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    // Get access token
    const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${b64(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    });

    const tokenOk = tokenRes.ok;
    let webhookOk: boolean | undefined = undefined;

    if (tokenOk) {
      const tokenJson = await tokenRes.json();
      const accessToken = tokenJson.access_token as string;
      if (webhookId) {
        const whRes = await fetch(`${base}/v1/notifications/webhooks/${webhookId}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        webhookOk = whRes.ok;
      }
    }

    const ok = tokenOk && (webhookId ? webhookOk === true : true);

    return new Response(JSON.stringify({ ok, tokenOk, webhookOk }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e:any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || String(e) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});