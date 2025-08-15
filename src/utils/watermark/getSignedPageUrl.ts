import { supabase } from '@/integrations/supabase/client';

/**
 * Get a signed URL for accessing a chapter page image
 * The URL will be valid for the specified TTL (30-120 seconds)
 */
export async function getSignedPageUrl(
  chapterId: string, 
  index: number, 
  ttlSec: number = 120,
  format: 'webp' | 'jpeg' = 'webp'
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('sign-chapter-page', {
      body: {
        chapterId,
        index,
        ttlSec,
        format
      }
    });

    if (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }

    if (!data?.ok) {
      console.error('Failed to get signed URL:', data?.code, data?.message);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Exception getting signed URL:', error);
    return null;
  }
}

/**
 * Preload multiple signed URLs for efficient reader performance
 */
export async function preloadSignedUrls(
  chapterId: string, 
  startIndex: number, 
  count: number = 3,
  format: 'webp' | 'jpeg' = 'webp'
): Promise<string[]> {
  const promises = [];
  
  for (let i = 0; i < count; i++) {
    promises.push(getSignedPageUrl(chapterId, startIndex + i, 120, format));
  }

  const results = await Promise.allSettled(promises);
  
  return results
    .filter((result): result is PromiseFulfilledResult<string> => 
      result.status === 'fulfilled' && result.value !== null
    )
    .map(result => result.value);
}

/**
 * Retry mechanism for expired signed URLs
 */
export async function getImageWithRetry(
  chapterId: string,
  index: number,
  maxRetries: number = 2,
  format: 'webp' | 'jpeg' = 'webp'
): Promise<string | null> {
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    const signedUrl = await getSignedPageUrl(chapterId, index, 120, format);
    
    if (!signedUrl) {
      attempt++;
      continue;
    }

    try {
      const response = await fetch(signedUrl);
      
      if (response.ok) {
        return signedUrl;
      }
      
      // If 403/401, the URL expired, retry
      if (response.status === 403 || response.status === 401) {
        console.log(`Signed URL expired, retrying... (attempt ${attempt + 1})`);
        attempt++;
        continue;
      }
      
      // Other errors, fail immediately
      console.error('Image fetch failed:', response.status, response.statusText);
      return null;
      
    } catch (error) {
      console.error('Network error fetching image:', error);
      attempt++;
    }
  }
  
  console.error(`Failed to get image after ${maxRetries + 1} attempts`);
  return null;
}
