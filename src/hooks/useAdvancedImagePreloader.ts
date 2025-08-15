import { useEffect, useRef, useCallback, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface PreloadStrategy {
  aggressive: { lookahead: 5; priority: 'high' };
  conservative: { lookahead: 2; priority: 'low' };
  disabled: { lookahead: 0; priority: 'low' };
}

interface PreloadOptions {
  strategy: keyof PreloadStrategy;
  mode: 'webtoon' | 'paged';
  enabled: boolean;
  maxMemoryMB?: number;
}

interface PerformanceMetrics {
  preloadedCount: number;
  failedCount: number;
  avgLoadTime: number;
  memoryUsage: number;
}

export const useAdvancedImagePreloader = (
  pages: string[],
  currentPage: number,
  options: PreloadOptions = { strategy: 'conservative', mode: 'webtoon', enabled: true }
) => {
  const abortControllerRef = useRef<AbortController | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const preloadedUrlsRef = useRef<Set<string>>(new Set());
  const preloadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const loadTimeMapRef = useRef<Map<string, number>>(new Map());
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    preloadedCount: 0,
    failedCount: 0,
    avgLoadTime: 0,
    memoryUsage: 0
  });

  const [preloadSettings] = useLocalStorage('image-preload-settings', {
    strategy: 'conservative' as keyof PreloadStrategy,
    maxMemoryMB: 50
  });

  const strategies: PreloadStrategy = {
    aggressive: { lookahead: 5, priority: 'high' },
    conservative: { lookahead: 2, priority: 'low' },
    disabled: { lookahead: 0, priority: 'low' }
  };

  const currentStrategy = strategies[options.strategy || preloadSettings.strategy];
  const maxMemoryBytes = (options.maxMemoryMB || preloadSettings.maxMemoryMB) * 1024 * 1024;

  // Add preload hint to document head
  const addPreloadHint = useCallback((url: string, priority: 'high' | 'low' = 'low') => {
    if (document.querySelector(`link[href="${url}"]`)) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    link.setAttribute('fetchpriority', priority);
    document.head.appendChild(link);

    // Clean up after 30 seconds
    setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    }, 30000);
  }, []);

  // Estimate memory usage
  const estimateMemoryUsage = useCallback(() => {
    let totalSize = 0;
    preloadedImagesRef.current.forEach((img) => {
      // Rough estimate: width * height * 4 bytes (RGBA)
      totalSize += img.naturalWidth * img.naturalHeight * 4;
    });
    return totalSize;
  }, []);

  // Clean up old preloaded images if memory limit exceeded
  const cleanupMemory = useCallback(() => {
    const currentMemory = estimateMemoryUsage();
    if (currentMemory > maxMemoryBytes) {
      // Remove oldest preloaded images
      const sortedEntries = Array.from(preloadedImagesRef.current.entries())
        .sort(([, a], [, b]) => {
          const aTime = loadTimeMapRef.current.get(a.src) || 0;
          const bTime = loadTimeMapRef.current.get(b.src) || 0;
          return aTime - bTime;
        });

      const toRemove = Math.ceil(sortedEntries.length * 0.3); // Remove 30%
      for (let i = 0; i < toRemove; i++) {
        const [url, img] = sortedEntries[i];
        preloadedImagesRef.current.delete(url);
        preloadedUrlsRef.current.delete(url);
        loadTimeMapRef.current.delete(url);
        img.src = '';
      }
    }
  }, [maxMemoryBytes, estimateMemoryUsage]);

  // Preload image with performance tracking
  const preloadImage = useCallback(async (
    url: string, 
    priority: 'high' | 'low' = 'low',
    signal?: AbortSignal
  ): Promise<boolean> => {
    if (preloadedUrlsRef.current.has(url) || !url) return true;

    const startTime = performance.now();
    
    try {
      // Add preload hint first
      addPreloadHint(url, priority === 'high' ? 'high' : 'low');

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.loading = 'eager';
      
      return new Promise((resolve) => {
        const cleanup = () => {
          img.onload = null;
          img.onerror = null;
        };

        img.onload = () => {
          if (signal?.aborted) {
            cleanup();
            resolve(false);
            return;
          }

          const loadTime = performance.now() - startTime;
          preloadedUrlsRef.current.add(url);
          preloadedImagesRef.current.set(url, img);
          loadTimeMapRef.current.set(url, Date.now());
          
          setMetrics(prev => ({
            ...prev,
            preloadedCount: prev.preloadedCount + 1,
            avgLoadTime: (prev.avgLoadTime + loadTime) / 2,
            memoryUsage: estimateMemoryUsage()
          }));

          cleanup();
          resolve(true);
        };

        img.onerror = () => {
          setMetrics(prev => ({
            ...prev,
            failedCount: prev.failedCount + 1
          }));
          cleanup();
          resolve(false);
        };

        img.src = url;
      });
    } catch (error) {
      console.warn('Preload failed:', error);
      return false;
    }
  }, [addPreloadHint, estimateMemoryUsage]);

  // Setup intersection observer for near-future preloading
  const setupIntersectionObserver = useCallback(() => {
    if (!options.enabled || currentStrategy.lookahead === 0) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageIndex = parseInt(entry.target.getAttribute('data-page-index') || '0');
            const isNearCurrent = Math.abs(pageIndex - currentPage) <= 1;
            
            if (isNearCurrent) {
              // Preload next pages with appropriate priority
              const startIndex = pageIndex + 1;
              const endIndex = Math.min(startIndex + currentStrategy.lookahead, pages.length);
              
              for (let i = startIndex; i < endIndex; i++) {
                const url = pages[i];
                if (url && !preloadedUrlsRef.current.has(url)) {
                  const distance = i - currentPage;
                  const priority = distance <= 2 ? currentStrategy.priority : 'low';
                  preloadImage(url, priority, abortControllerRef.current?.signal);
                }
              }
            }
          }
        });
      },
      {
        rootMargin: options.mode === 'webtoon' ? '100px 0px 300px 0px' : '50px',
        threshold: 0.1
      }
    );

    // Observe all page elements
    const pageElements = document.querySelectorAll('[data-page-index]');
    pageElements.forEach((el) => {
      observerRef.current?.observe(el);
    });
  }, [options.enabled, options.mode, currentStrategy, currentPage, pages, preloadImage]);

  // Main preloading effect
  useEffect(() => {
    if (!options.enabled || pages.length === 0) return;

    // Cancel previous operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const preloadNext = async () => {
      // Always preload current page with high priority
      const currentUrl = pages[currentPage];
      if (currentUrl && !preloadedUrlsRef.current.has(currentUrl)) {
        await preloadImage(currentUrl, 'high', signal);
      }

      // Preload lookahead pages
      const startIndex = currentPage + 1;
      const endIndex = Math.min(startIndex + currentStrategy.lookahead, pages.length);
      
      for (let i = startIndex; i < endIndex; i++) {
        if (signal.aborted) break;
        
        const url = pages[i];
        if (url && !preloadedUrlsRef.current.has(url)) {
          const distance = i - currentPage;
          const priority = distance <= 2 ? currentStrategy.priority : 'low';
          await preloadImage(url, priority, signal);
        }
      }

      // Memory cleanup
      cleanupMemory();
    };

    // Use requestIdleCallback for non-blocking preload
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(preloadNext, { timeout: 1000 });
    } else {
      setTimeout(preloadNext, 100);
    }

    // Setup intersection observer
    setupIntersectionObserver();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [pages, currentPage, options.enabled, currentStrategy, preloadImage, cleanupMemory, setupIntersectionObserver]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      // Clear all preloaded images
      preloadedImagesRef.current.clear();
      preloadedUrlsRef.current.clear();
      loadTimeMapRef.current.clear();
    };
  }, []);

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(prev => ({
        ...prev,
        memoryUsage: estimateMemoryUsage()
      }));
    };

    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, [estimateMemoryUsage]);

  return {
    metrics,
    isPreloaded: (url: string) => preloadedUrlsRef.current.has(url),
    preloadedCount: preloadedUrlsRef.current.size,
    cleanup: cleanupMemory
  };
};