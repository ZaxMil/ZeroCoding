// coins-unlock Edge Function
// Input: { chapterId: string, reference?: string }
// Output on success: { ok: true, access: true, newBalance: number }
// Output on error: { ok: false, code: string, message?: string }

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-idempotency-key',
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      return new Response(JSON.stringify({ ok: false, code: 'auth_error', message: authError.message }), { status: 401, headers: corsHeaders })
    }
    if (!user) {
      return new Response(JSON.stringify({ ok: false, code: 'unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const reqId = req.headers.get('x-idempotency-key') || crypto.randomUUID()

    let payload: { chapterId?: string; reference?: string }
    try {
      payload = await req.json()
    } catch {
      return new Response(JSON.stringify({ ok: false, code: 'bad_request', message: 'Invalid JSON body' }), { status: 400, headers: corsHeaders })
    }

    const chapterId = payload.chapterId
    if (!chapterId) {
      return new Response(JSON.stringify({ ok: false, code: 'missing_chapter_id' }), { status: 400, headers: corsHeaders })
    }

    // Idempotency: rely on DB function to be idempotent if access already exists
    // Ensure wallet exists (best-effort)
    await supabase.rpc('create_coin_wallet', { user_id_param: user.id }).catch(() => {})

    // Attempt unlock
    const { data: unlockResult, error: unlockErr } = await supabase.rpc('unlock_chapter_with_coins', {
      chapter_id_param: chapterId,
      user_id_param: user.id
    })

    if (unlockErr) {
      // Map common errors
      const code = unlockErr.code === 'PGRST116' ? 'rpc_missing' : 'rpc_error'
      console.log(JSON.stringify({ at: 'coins-unlock', userId: user.id, chapterId, resultCode: code, reqId, error: unlockErr.message }))
      return new Response(JSON.stringify({ ok: false, code, message: unlockErr.message }), { status: 500, headers: corsHeaders })
    }

    if (unlockResult !== true) {
      console.log(JSON.stringify({ at: 'coins-unlock', userId: user.id, chapterId, resultCode: 'insufficient_funds', reqId }))
      return new Response(JSON.stringify({ ok: false, code: 'insufficient_funds' }), { status: 402, headers: corsHeaders })
    }

    // Get new balance
    const { data: newBalance } = await supabase.rpc('get_user_coin_balance', { user_id_param: user.id })

    console.log(JSON.stringify({ at: 'coins-unlock', userId: user.id, chapterId, resultCode: 'success', reqId }))
    return new Response(JSON.stringify({ ok: true, access: true, newBalance: newBalance ?? null }), { status: 200, headers: corsHeaders })
  } catch (e: any) {
    console.error('coins-unlock fatal', e)
    return new Response(JSON.stringify({ ok: false, code: 'server_error', message: e?.message || 'Unexpected error' }), { status: 500, headers: corsHeaders })
  }
}

// Deno entrypoint
Deno.serve(handler)
