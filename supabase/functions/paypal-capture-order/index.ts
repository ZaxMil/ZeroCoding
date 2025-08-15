// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const getCorsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

function b64(input: string) {
  return btoa(input);
}

function getBaseUrl(mode?: 'sandbox' | 'live') {
  const envBase = Deno.env.get('PAYPAL_BASE_URL');
  if (envBase) return envBase;
  return mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

async function getAccessToken(base: string, clientId: string, clientSecret: string) {
  const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${b64(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  });
  if (!tokenRes.ok) return { ok: false as const, error: `token ${tokenRes.status}` };
  const tokenJson = await tokenRes.json();
  return { ok: true as const, token: tokenJson.access_token as string };
}

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const allowed = (Deno.env.get('ALLOWED_ORIGIN') || '').split(',').map(s=>s.trim()).filter(Boolean);
  const corsHeaders = allowed.length > 0 && allowed.includes(origin) ? getCorsHeaders(origin) : getCorsHeaders('*');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // CORS check for non-OPTIONS requests
  if (allowed.length > 0 && origin && !allowed.includes(origin)) {
    return new Response(JSON.stringify({ ok: false, error: 'forbidden_origin' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 403,
    });
  }

  const reqId = crypto.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`;

  try {
    const body = (await req.json().catch(() => ({}))) as { orderId?: string; mode?: 'sandbox'|'live' };
    const orderId = (body.orderId || '').trim();

    if (!orderId) {
      return new Response(JSON.stringify({ ok: false, error: 'orderId required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const clientId = Deno.env.get('PAYPAL_CLIENT_ID') || '';
    const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET') || '';
    const base = getBaseUrl(body.mode);

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ ok: false, error: 'missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const token = await getAccessToken(base, clientId, clientSecret);
    if (!token.ok) {
      return new Response(JSON.stringify({ ok: false, error: `oauth_failed: ${token.error}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const capRes = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.token}`,
        'PayPal-Request-Id': reqId,
      },
    });

    const capJson: any = await capRes.json().catch(() => ({}));
    if (!capRes.ok) {
      console.log(JSON.stringify({ at: 'paypal-capture-order', reqId, orderId, statusCode: capRes.status, error: capJson?.message || 'capture_failed' }));
      return new Response(JSON.stringify({ ok: false, error: capJson?.message || 'capture_failed', details: capJson }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const captureUnit = capJson?.purchase_units?.[0];
    const payments = captureUnit?.payments;
    const capture = payments?.captures?.[0];
    const captureId = capture?.id;

    console.log(JSON.stringify({ at: 'paypal-capture-order', reqId, orderId, captureId, statusCode: capRes.status }));

    return new Response(JSON.stringify({
      ok: true,
      status: capJson?.status,
      captureId,
      payer: capJson?.payer ? { email_address: capJson.payer.email_address, payer_id: capJson.payer.payer_id } : undefined,
      purchaseUnits: capJson?.purchase_units?.map((u: any) => ({ reference_id: u.reference_id, amount: u.amount })),
      reqId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e: any) {
    console.log(JSON.stringify({ at: 'paypal-capture-order', reqId, error: e?.message || String(e), statusCode: 500 }));
    return new Response(JSON.stringify({ ok: false, error: e?.message || String(e) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});