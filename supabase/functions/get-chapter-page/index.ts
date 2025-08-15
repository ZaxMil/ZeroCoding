// get-chapter-page: Serve watermarked images via signed GET URLs
// Input: GET params: cid, i, exp, t, sig
// Behavior: Validate signature, fetch image, apply watermark + micro-fingerprint

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Image, Font, RGBA } from "https://deno.land/x/imagescript@1.3.0/mod.ts"
import { base64urlDecode, hmacSha256Base64Url, generatePixelCoords } from '../_shared/crypto.ts'
import { strictHeaders, generateETag, getClientIP, supportsWebP } from '../_shared/headers.ts'

// Simple in-memory rate limit per IP (best-effort)
const hits: Record<string, { c: number; t: number }> = {}
const WINDOW_MS = 60_000
const MAX_REQ = 60

function checkRate(req: Request): { ok: boolean; retry?: number } {
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const now = Date.now()
  const rec = hits[ip]
  if (!rec || now > rec.t) {
    hits[ip] = { c: 1, t: now + WINDOW_MS }
    return { ok: true }
  }
  if (rec.c >= MAX_REQ) {
    return { ok: false, retry: Math.ceil((rec.t - now) / 1000) }
  }
  rec.c++
  return { ok: true }
}

export const handler = async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') || '*'
  const origin = req.headers.get('origin')
  const headers = strictHeaders(origin, allowedOrigin)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers })
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ ok: false, code: 'method_not_allowed' }), {
      status: 405,
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
  }

  // Check CORS origin strictly
  if (allowedOrigin !== '*' && origin !== allowedOrigin) {
    return new Response(JSON.stringify({ ok: false, code: 'forbidden_origin' }), {
      status: 403,
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
  }

  const rl = checkRate(req)
  if (!rl.ok) {
    return new Response(JSON.stringify({ ok: false, code: 'rate_limited', retryAfter: rl.retry }), { 
      status: 429, 
      headers: { ...headers, 'Content-Type': 'application/json', 'Retry-After': String(rl.retry!) } 
    })
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!)

  // Validate signed URL parameters
  const url = new URL(req.url)
  const cid = url.searchParams.get('cid')
  const i = url.searchParams.get('i')
  const exp = url.searchParams.get('exp')
  const t = url.searchParams.get('t')
  const sig = url.searchParams.get('sig')
  const format = url.searchParams.get('format') || 'webp'

  if (!cid || !i || !exp || !t || !sig) {
    return new Response(JSON.stringify({ ok: false, code: 'missing_signature_params' }), { 
      status: 400, 
      headers: { ...headers, 'Content-Type': 'application/json' } 
    })
  }

  // Check expiration
  const now = Date.now()
  const expTime = parseInt(exp)
  if (now > expTime) {
    return new Response(JSON.stringify({ ok: false, code: 'signature_expired' }), { 
      status: 403, 
      headers: { ...headers, 'Content-Type': 'application/json' } 
    })
  }

  // Verify signature
  const imagingSecret = Deno.env.get('IMAGE_SIGNING_SECRET')
  if (!imagingSecret) {
    return new Response(JSON.stringify({ ok: false, code: 'server_config_error' }), { 
      status: 500, 
      headers: { ...headers, 'Content-Type': 'application/json' } 
    })
  }

  // Recompute signature
  const expectedSig = await hmacSha256Base64Url(imagingSecret, t)
  if (sig !== expectedSig) {
    return new Response(JSON.stringify({ ok: false, code: 'invalid_signature' }), { 
      status: 403, 
      headers: { ...headers, 'Content-Type': 'application/json' } 
    })
  }

  // Decode token to get user info
  let tokenPayload
  try {
    const tokenBytes = base64urlDecode(t)
    tokenPayload = JSON.parse(new TextDecoder().decode(tokenBytes))
  } catch {
    return new Response(JSON.stringify({ ok: false, code: 'invalid_token' }), { 
      status: 403, 
      headers: { ...headers, 'Content-Type': 'application/json' } 
    })
  }

  // Verify token matches URL params
  if (tokenPayload.cid !== cid || tokenPayload.i !== parseInt(i)) {
    return new Response(JSON.stringify({ ok: false, code: 'token_mismatch' }), { 
      status: 403, 
      headers: { ...headers, 'Content-Type': 'application/json' } 
    })
  }

  // Content negotiation
  const acceptHeader = req.headers.get('Accept') || ''
  const preferWebP = supportsWebP(acceptHeader) && format === 'webp'
  let watermarkSuccess = false

  try {
    // Fetch image from storage
    const imagePath = `chapters/${cid}/${i}.jpg`
    const { data: imageData, error: storageError } = await supabase.storage
      .from('chapter-pages')
      .download(imagePath)

    let finalImageData = imageData
    let originalContentType = 'image/jpeg'

    if (storageError || !imageData) {
      // Try alternative paths
      const altPath = `chapters/${cid}/${i}.png`
      const { data: altImageData, error: altError } = await supabase.storage
        .from('chapter-pages')
        .download(altPath)
      
      if (altError || !altImageData) {
        return new Response(JSON.stringify({ ok: false, code: 'image_not_found' }), { 
          status: 404, 
          headers: { ...headers, 'Content-Type': 'application/json' } 
        })
      }
      
      finalImageData = altImageData
      originalContentType = 'image/png'
    }

    // Process image with watermarking and micro-fingerprinting
    const imageBuffer = await finalImageData!.arrayBuffer()
    let processedBuffer: Uint8Array
    let responseContentType: string

    try {
      const img = await Image.decode(new Uint8Array(imageBuffer))
      
      // Visible watermark (diagonal)
      const siteName = Deno.env.get('SITE_NAME') ?? 'Reader'
      const timestamp = new Date().toISOString()
      const userShort = tokenPayload.uid.slice(0, 8)
      const watermarkText = `${siteName} · user:${userShort} · ts:${timestamp}`
      
      // Draw diagonal watermark (semi-transparent, repeated)
      const width = img.width
      const height = img.height
      const font = Font.DEFAULT
      const textColor = new RGBA(255, 255, 255, 56) // ~22% opacity
      
      // Draw watermark diagonally across the image
      const step = 200 // spacing between watermarks
      for (let y = -width; y < height + width; y += step) {
        for (let x = -height; x < width + height; x += step) {
          img.drawText(font, watermarkText, x, y, textColor)
        }
      }
      
      // Micro-fingerprint: tweak specific pixels
      const coords = await generatePixelCoords(tokenPayload.uid, cid, parseInt(i), width, height)
      coords.forEach(({ x, y }) => {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const pixel = img.getPixel(x, y)
          // Bump red channel by +1 (clamp to 255)
          const newPixel = new RGBA(
            Math.min(pixel.r + 1, 255),
            pixel.g,
            pixel.b,
            pixel.a
          )
          img.setPixel(x, y, newPixel)
        }
      })
      
      // Encode based on preference and browser support
      if (preferWebP) {
        processedBuffer = await img.encodeWEBP(80)
        responseContentType = 'image/webp'
      } else {
        processedBuffer = await img.encodeJPEG(85)
        responseContentType = 'image/jpeg'
      }
      
      watermarkSuccess = true
      
    } catch (error) {
      console.warn('Watermarking failed, returning original:', error)
      // Fallback: return original bytes
      processedBuffer = new Uint8Array(imageBuffer)
      responseContentType = originalContentType
      watermarkSuccess = false
    }
    
    const renderTime = Date.now() - startTime
    const etag = await generateETag(cid, i, exp, sig)
    
    // Determine logged format based on actual response
    const fmtLogged = responseContentType === 'image/webp' ? 'webp' : 'jpg'
    
    // Log access (non-blocking)
    logImageAccess(tokenPayload.uid, cid, parseInt(i), getClientIP(req), req.headers.get('user-agent') || '', fmtLogged, watermarkSuccess, crypto.randomUUID())
    
    console.log(JSON.stringify({ 
      at: 'get',
      uid: tokenPayload.uid, 
      cid, 
      i: parseInt(i), 
      fmt: fmtLogged,
      wm: watermarkSuccess,
      ms: renderTime
    }))

    return new Response(processedBuffer, {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': responseContentType,
        'ETag': etag,
        'Cache-Control': 'private, max-age=120',
        ...(watermarkSuccess ? {} : { 'X-Watermark': 'fail' })
      }
    })

  } catch (error: any) {
    const renderTime = Date.now() - startTime
    console.error('Image processing error:', error)
    
    // Log failed access
    logImageAccess(tokenPayload.uid, cid, parseInt(i), getClientIP(req), req.headers.get('user-agent') || '', format, false, crypto.randomUUID())
    
    return new Response(JSON.stringify({ ok: false, code: 'image_processing_error', message: error.message }), { 
      status: 500, 
      headers: { ...headers, 'Content-Type': 'application/json' } 
    })
  }
}

// Non-blocking logging function
async function logImageAccess(uid: string, cid: string, i: number, ip: string, ua: string, fmt: string, wm: boolean, reqId: string) {
  try {
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!serviceRoleKey) return
    
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL')!,
      serviceRoleKey
    )
    
    await supabaseService
      .from('image_page_access')
      .insert({
        uid,
        cid,
        i,
        ip,
        ua,
        fmt,
        wm,
        req_id: reqId
      })
  } catch (error) {
    console.warn('Failed to log image access:', error)
  }
}

Deno.serve(handler)
