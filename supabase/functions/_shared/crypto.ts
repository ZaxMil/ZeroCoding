// Shared crypto utilities for edge functions
const encoder = new TextEncoder();

/**
 * Base64URL encode a Uint8Array (no padding, URL-safe)
 */
export function base64urlEncode(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64URL decode to Uint8Array
 */
export function base64urlDecode(str: string): Uint8Array {
  // Add padding if needed
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  return new Uint8Array(decoded.split('').map(c => c.charCodeAt(0)));
}

/**
 * HMAC-SHA256 with base64url encoding
 */
export async function hmacSha256Base64Url(secret: string, data: string | Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const dataBytes = typeof data === 'string' ? encoder.encode(data) : data;
  const signature = await crypto.subtle.sign('HMAC', key, dataBytes);
  
  return base64urlEncode(new Uint8Array(signature));
}

/**
 * Generate deterministic pixel coordinates for micro-fingerprinting
 */
export async function generatePixelCoords(uid: string, cid: string, index: number, width: number, height: number): Promise<Array<{x: number, y: number}>> {
  const data = `${uid}|${cid}|${index}`;
  const hash = await hmacSha256Base64Url('pixel-coords', data);
  const coords: Array<{x: number, y: number}> = [];
  
  // Generate 4 pseudo-random coordinates from hash
  for (let i = 0; i < 4; i++) {
    const hashSlice = hash.slice(i * 8, (i + 1) * 8);
    const x = parseInt(hashSlice.slice(0, 4), 36) % width;
    const y = parseInt(hashSlice.slice(4, 8), 36) % height;
    coords.push({ x, y });
  }
  
  return coords;
}