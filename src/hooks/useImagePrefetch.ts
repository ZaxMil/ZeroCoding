import { useEffect, useRef } from 'react';

interface PrefetchOptions {
  enabled: boolean;
  lookahead: number;
}

export const useImagePrefetch = (
  pages: string[], 
  currentPage: number, 
  options: PrefetchOptions = { enabled: true, lookahead: 2 }
) => {
  const abortControllerRef = useRef<AbortController | null>(null);
  const prefetchedUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!options.enabled || pages.length === 0) return;

    // Cancel previous prefetch operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const prefetchImages = () => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          prefetchNext(signal);
        }, { timeout: 1000 });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => prefetchNext(signal), 100);
      }
    };

    const prefetchNext = async (signal: AbortSignal) => {
      const startIndex = currentPage + 1;
      const endIndex = Math.min(startIndex + options.lookahead, pages.length);

      for (let i = startIndex; i < endIndex; i++) {
        if (signal.aborted) break;

        const url = pages[i];
        if (!url || prefetchedUrlsRef.current.has(url)) continue;

        // Skip signed URLs expiring in <60s
        if (url.includes('token=')) {
          try {
            const urlObj = new URL(url);
            const token = urlObj.searchParams.get('token');
            if (token) {
              // Basic JWT expiry check (token format: header.payload.signature)
              const payload = JSON.parse(atob(token.split('.')[1]));
              const expiryTime = payload.exp * 1000; // Convert to milliseconds
              const timeLeft = expiryTime - Date.now();
              if (timeLeft < 60000) { // Less than 60 seconds
                console.log(`Skipping prefetch for soon-to-expire URL: ${i + 1}`);
                continue;
              }
            }
          } catch (e) {
            // If we can't parse the token, skip prefetch to be safe
            console.warn('Could not parse token for prefetch decision:', e);
            continue;
          }
        }

        try {
          // For signed URLs, try cache-only first
          let fetchOptions: RequestInit = {
            signal,
            priority: 'low' as RequestPriority
          };

          if (url.includes('.supabase.co')) {
            fetchOptions = {
              ...fetchOptions,
              cache: 'only-if-cached',
              mode: 'same-origin'
            };
          }

          let response;
          try {
            // Try GET with cache-only for signed URLs
            response = await fetch(url, fetchOptions);
          } catch (cacheError) {
            // Fallback to HEAD request if cache-only fails
            response = await fetch(url, {
              method: 'HEAD',
              signal,
              priority: 'low' as RequestPriority
            });
          }

          if (response.ok) {
            prefetchedUrlsRef.current.add(url);
            console.log(`Prefetched page ${i + 1}`);
          }
        } catch (error) {
          if (!signal.aborted) {
            console.warn(`Failed to prefetch page ${i + 1}:`, error);
          }
        }
      }
    };

    prefetchImages();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [pages, currentPage, options.enabled, options.lookahead]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
};