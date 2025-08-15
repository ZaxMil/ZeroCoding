// coins-grant (temporary admin utility)
// Input: { userId: string, amount: number, note?: string }
// Output: { ok: true, newBalance: number } or error

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
}

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } }
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response(JSON.stringify({ ok: false, code: 'unauthorized' }), { status: 401, headers: corsHeaders })

    // Require admin
    const { data: isAdmin } = await supabase.rpc('is_admin', { user_id: user.id })
    if (!isAdmin) return new Response(JSON.stringify({ ok: false, code: 'forbidden' }), { status: 403, headers: corsHeaders })

    let body: { userId?: string; amount?: number; note?: string }
    try { body = await req.json() } catch { return new Response(JSON.stringify({ ok: false, code: 'bad_request' }), { status: 400, headers: corsHeaders }) }

    const { userId, amount = 0, note } = body
    if (!userId || !Number.isFinite(amount)) {
      return new Response(JSON.stringify({ ok: false, code: 'missing_params' }), { status: 400, headers: corsHeaders })
    }

    // Ensure wallet exists
    await supabase.rpc('create_coin_wallet', { user_id_param: userId }).catch(() => {})

    // Process credit as admin adjustment
    const { error: txErr } = await supabase.rpc('process_coin_transaction', {
      user_id_param: userId,
      amount_param: Math.abs(Math.trunc(amount)),
      type_param: 'admin_adjustment',
      context_param: 'admin_grant',
      reference_id_param: null,
      description_param: note ?? 'Admin granted coins',
      admin_user_id_param: user.id
    })

    if (txErr) {
      return new Response(JSON.stringify({ ok: false, code: 'tx_error', message: txErr.message }), { status: 500, headers: corsHeaders })
    }

    const { data: newBalance } = await supabase.rpc('get_user_coin_balance', { user_id_param: userId })
    return new Response(JSON.stringify({ ok: true, newBalance: newBalance ?? null }), { status: 200, headers: corsHeaders })
  } catch (e: any) {
    console.error('coins-grant fatal', e)
    return new Response(JSON.stringify({ ok: false, code: 'server_error', message: e?.message || 'Unexpected error' }), { status: 500, headers: corsHeaders })
  }
}

Deno.serve(handler)
