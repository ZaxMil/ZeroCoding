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
    const body = (await req.json().catch(() => ({}))) as { amount?: number; currency?: string; reference?: string; mode?: 'sandbox'|'live' };

    // Validate inputs
    const amountRaw = Number(body.amount);
    const amount = isFinite(amountRaw) ? amountRaw : NaN;
    if (!(amount >= 0.5 && amount <= 5000)) {
      return new Response(JSON.stringify({ ok: false, error: 'invalid amount (min 0.50, max 5000)' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    let currency = (body.currency || 'USD').toString().trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) currency = 'USD';

    const clientId = Deno.env.get('PAYPAL_CLIENT_ID') || '';
    const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET') || '';
    const base = getBaseUrl(body.mode);

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ ok: false, error: 'missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // OAuth
    const token = await getAccessToken(base, clientId, clientSecret);
    if (!token.ok) {
      return new Response(JSON.stringify({ ok: false, error: `oauth_failed: ${token.error}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Safe return/cancel URLs from Origin + validated relative paths
    const requestOrigin = (req.headers.get('origin') || 'https://example.com').replace(/\/+$/,'');
    const safe = (p: string) => (p && p.startsWith('/')) ? p : '/';
    const return_url = requestOrigin + safe('/payment-success');
    const cancel_url = requestOrigin + safe('/payment-canceled');

    // Generate idempotency key
    const idempotencyKey = body.reference 
      ? `ref:${body.reference}`.slice(0, 64) 
      : reqId;

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
          reference_id: body.reference || undefined,
        },
      ],
      application_context: {
        return_url,
        cancel_url,
        brand_name: 'Checkout',
        user_action: 'PAY_NOW',
      },
    };

    const createRes = await fetch(`${base}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.token}`,
        'PayPal-Request-Id': idempotencyKey,
      },
      body: JSON.stringify(orderPayload),
    });

    const createJson: any = await createRes.json().catch(() => ({}));
    if (!createRes.ok) {
      console.log(JSON.stringify({ at: 'paypal-create-order', reqId, amount, currency, statusCode: createRes.status, error: createJson?.message || 'order_create_failed' }));
      return new Response(JSON.stringify({ ok: false, error: createJson?.message || 'order_create_failed', details: createJson }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const orderId = createJson.id;
    console.log(JSON.stringify({ at: 'paypal-create-order', reqId, amount, currency, orderId, statusCode: createRes.status }));

    return new Response(JSON.stringify({ ok: true, id: orderId, links: createJson.links, reqId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e: any) {
    console.log(JSON.stringify({ at: 'paypal-create-order', reqId, error: e?.message || String(e), statusCode: 500 }));
    return new Response(JSON.stringify({ ok: false, error: e?.message || String(e) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});