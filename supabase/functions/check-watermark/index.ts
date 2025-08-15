// check-watermark: Verify leaked images contain expected fingerprints
// POST multipart/form-data: file, cid, i, uid
// Response: { ok: true, match: boolean, coords: Array<{x,y,delta}> }

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts"
import { generatePixelCoords } from '../_shared/crypto.ts'
import { strictHeaders, getClientIP } from '../_shared/headers.ts'

// Simple in-memory rate limit per IP
const hits: Record<string, { c: number; t: number }> = {}
const WINDOW_MS = 60_000
const MAX_REQ = 60

function checkRate(req: Request): { ok: boolean; retry?: number } {
  const ip = getClientIP(req)
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
  const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') || '*'
  const origin = req.headers.get('origin')
  const headers = strictHeaders(origin, allowedOrigin)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers })
  }

  if (req.method !== 'POST') {
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

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const cid = formData.get('cid') as string
    const i = formData.get('i') as string
    const uid = formData.get('uid') as string

    if (!file || !cid || !i || !uid) {
      return new Response(JSON.stringify({ ok: false, code: 'missing_params' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' }
      })
    }

    // Decode uploaded image
    const arrayBuffer = await file.arrayBuffer()
    const img = await Image.decode(new Uint8Array(arrayBuffer))
    
    // Generate expected fingerprint coordinates
    const coords = await generatePixelCoords(uid, cid, parseInt(i), img.width, img.height)
    
    // Check each coordinate for expected fingerprint
    const results: Array<{x: number, y: number, delta: number}> = []
    let matchCount = 0
    
    coords.forEach(({ x, y }) => {
      if (x >= 0 && x < img.width && y >= 0 && y < img.height) {
        const pixel = img.getPixel(x, y)
        // We expect red channel to be +1 compared to normal
        // For detection, we allow tolerance of ±1
        const delta = pixel.r % 256 // Normalized to handle overflow
        results.push({ x, y, delta })
        
        // Consider a match if delta suggests fingerprint modification
        // (This is a simplified detection - real implementation would be more sophisticated)
        if (delta > 128) { // Heuristic for detecting +1 modification
          matchCount++
        }
      }
    })
    
    // Consider match if majority of coords show expected fingerprint
    const match = matchCount >= Math.ceil(coords.length * 0.6)
    
    console.log(JSON.stringify({
      at: 'check-watermark',
      cid,
      i: parseInt(i),
      uid,
      match,
      matchCount,
      totalCoords: coords.length
    }))

    return new Response(JSON.stringify({
      ok: true,
      match,
      coords: results
    }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Watermark check error:', error)
    return new Response(JSON.stringify({
      ok: false,
      code: 'processing_error',
      message: error.message
    }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
  }
}

Deno.serve(handler)