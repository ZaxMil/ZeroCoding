/**
 * Strict security headers for edge functions
 */
export function strictHeaders(origin: string | null, allowedOrigin: string = '*') {
  const isAllowed = origin && (allowedOrigin === '*' || origin === allowedOrigin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    'Cache-Control': 'private, max-age=120'
  };
}

/**
 * Generate ETag for image response
 */
export async function generateETag(cid: string, i: string, exp: string, sig: string): Promise<string> {
  const data = `${cid}|${i}|${exp}|${sig}`;
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .slice(0, 16);
}

/**
 * Get client IP address from request
 */
export function getClientIP(req: Request): string {
  return req.headers.get('cf-connecting-ip') || 
         req.headers.get('x-forwarded-for')?.split(',')[0] || 
         'unknown';
}

/**
 * Detect WebP support from Accept header
 */
export function supportsWebP(acceptHeader: string | null): boolean {
  return acceptHeader?.includes('image/webp') ?? false;
}