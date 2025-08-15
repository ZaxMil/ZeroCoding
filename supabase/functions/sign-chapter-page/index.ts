// sign-chapter-page: Generate signed URLs for secure image access
// Input: { chapterId: string, index: number, ttlSec?: number }
// Output: { ok: true, signedUrl: string } or error

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { base64urlEncode, hmacSha256Base64Url } from '../_shared/crypto.ts'

const getCorsHeaders = (origin: string | null, allowedOrigin: string) => {
  const isAllowed = origin && (allowedOrigin === '*' || origin === allowedOrigin);
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }
}

export const handler = async (req: Request): Promise<Response> => {
  const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') || '*'
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin, allowedOrigin)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, code: 'method_not_allowed' }), {
      status: 405,
      headers: corsHeaders
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const imagingSecret = Deno.env.get('IMAGE_SIGNING_SECRET')

    if (!imagingSecret) {
      return new Response(JSON.stringify({ ok: false, code: 'server_config_error' }), {
        status: 500,
        headers: corsHeaders
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } }
    })

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ ok: false, code: 'unauthorized' }), {
        status: 401,
        headers: corsHeaders
      })
    }

    // Parse request body
    let body: { chapterId?: string; index?: number; ttlSec?: number }
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ ok: false, code: 'invalid_json' }), {
        status: 400,
        headers: corsHeaders
      })
    }

    const { chapterId, index, ttlSec = 120, format = 'webp' } = body
    
    if (!chapterId || typeof index !== 'number' || !['webp', 'jpeg'].includes(format)) {
      return new Response(JSON.stringify({ ok: false, code: 'missing_params' }), {
        status: 400,
        headers: corsHeaders
      })
    }

    // Validate TTL (clamp 30-120 seconds)
    const actualTtl = Math.min(Math.max(ttlSec, 30), 120)

    // Verify chapter access
    const { data: hasAccess, error: accessError } = await supabase
      .rpc('user_has_chapter_access', { 
        chapter_id_param: chapterId, 
        user_id_param: user.id 
      })

    if (accessError) {
      console.error('Access check error:', accessError)
      return new Response(JSON.stringify({ ok: false, code: 'access_check_failed' }), {
        status: 500,
        headers: corsHeaders
      })
    }

    if (!hasAccess) {
      return new Response(JSON.stringify({ ok: false, code: 'access_denied' }), {
        status: 403,
        headers: corsHeaders
      })
    }

    // Create signed token
    const now = Date.now()
    const exp = now + (actualTtl * 1000)
    
    const payload = {
      uid: user.id,
      cid: chapterId,
      i: index,
      exp: exp
    }

    const tokenData = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)))
    const signature = await hmacSha256Base64Url(imagingSecret, tokenData)

    // Build signed URL
    const origin = req.headers.get('origin') || new URL(req.url).origin
    const signedUrl = `${origin}/functions/v1/get-chapter-page?cid=${chapterId}&i=${index}&exp=${exp}&t=${tokenData}&sig=${signature}&format=${format}`

    console.log(JSON.stringify({
      at: 'sign',
      uid: user.id,
      cid: chapterId,
      i: index,
      ttl: actualTtl,
      fmt: format,
      ok: true
    }))

    return new Response(JSON.stringify({
      ok: true,
      signedUrl
    }), {
      status: 200,
      headers: corsHeaders
    })

  } catch (error: any) {
    console.error('Sign chapter page error:', error)
    return new Response(JSON.stringify({
      ok: false,
      code: 'server_error',
      message: error?.message || 'Unknown error'
    }), {
      status: 500,
      headers: corsHeaders
    })
  }
}

Deno.serve(handler)