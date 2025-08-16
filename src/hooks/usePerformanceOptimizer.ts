import { useEffect, useCallback, useRef } from 'react';

interface PerformanceConfig {
  enablePrefetch?: boolean;
  enableImageOptimization?: boolean;
  enableCriticalResourceHints?: boolean;
  enableServiceWorker?: boolean;
  cacheStrategy?: 'stale-while-revalidate' | 'cache-first' | 'network-first';
}

interface PerformanceMetrics {
  FCP: number; // First Contentful Paint
  LCP: number; // Largest Contentful Paint
  FID: number; // First Input Delay
  CLS: number; // Cumulative Layout Shift
  TTFB: number; // Time to First Byte
}

export const usePerformanceOptimizer = (config: PerformanceConfig = {}) => {
  const metricsRef = useRef<Partial<PerformanceMetrics>>({});
  const observerRef = useRef<PerformanceObserver | null>(null);

  // Default configuration
  const {
    enablePrefetch = true,
    enableImageOptimization = true,
    enableCriticalResourceHints = true,
    enableServiceWorker = true,
    cacheStrategy = 'stale-while-revalidate'
  } = config;

  // Measure Core Web Vitals
  const measureWebVitals = useCallback(() => {
    if (!('PerformanceObserver' in window)) return;

    // Measure LCP
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      metricsRef.current.LCP = lastEntry.startTime;
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // Measure FID
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        metricsRef.current.FID = entry.processingStart - entry.startTime;
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Measure CLS
    const clsObserver = new PerformanceObserver((entryList) => {
      let clsValue = 0;
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      metricsRef.current.CLS = clsValue;
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    // Measure FCP and TTFB
    const navigationObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        metricsRef.current.TTFB = entry.responseStart - entry.requestStart;
      });
    });
    navigationObserver.observe({ entryTypes: ['navigation'] });

    const paintObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        if (entry.name === 'first-contentful-paint') {
          metricsRef.current.FCP = entry.startTime;
        }
      });
    });
    paintObserver.observe({ entryTypes: ['paint'] });

    return () => {
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
      navigationObserver.disconnect();
      paintObserver.disconnect();
    };
  }, []);

  // Prefetch critical resources
  const prefetchCriticalResources = useCallback(() => {
    if (!enablePrefetch) return;

    const criticalUrls = [
      '/api/manga/popular',
      '/api/user/preferences',
      '/api/chapters/recent'
    ];

    criticalUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }, [enablePrefetch]);

  // Add resource hints
  const addResourceHints = useCallback(() => {
    if (!enableCriticalResourceHints) return;

    // DNS prefetch for external domains
    const dnsHints = [
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'cdn.jsdelivr.net'
    ];

    dnsHints.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });

    // Preconnect to critical domains
    const preconnectHints = [
      'https://fonts.googleapis.com',
      'https://api.manga-reader.com'
    ];

    preconnectHints.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }, [enableCriticalResourceHints]);

  // Optimize images
  const optimizeImages = useCallback(() => {
    if (!enableImageOptimization) return;

    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));

      return () => imageObserver.disconnect();
    }
  }, [enableImageOptimization]);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (!enableServiceWorker || !('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      
      // Update cache strategy based on config
      if (registration.active) {
        registration.active.postMessage({
          type: 'CACHE_STRATEGY',
          strategy: cacheStrategy
        });
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }, [enableServiceWorker, cacheStrategy]);

  // Preload critical CSS
  const preloadCriticalCSS = useCallback(() => {
    const criticalStyles = [
      '/assets/critical.css',
      '/assets/fonts.css'
    ];

    criticalStyles.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = href;
      document.head.appendChild(link);
    });
  }, []);

  // Defer non-critical JavaScript
  const deferNonCriticalJS = useCallback(() => {
    const scripts = document.querySelectorAll('script[data-defer]');
    
    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    // Load deferred scripts after page load
    window.addEventListener('load', () => {
      scripts.forEach(async (script) => {
        const src = script.getAttribute('data-src');
        if (src) {
          try {
            await loadScript(src);
            script.remove();
          } catch (error) {
            console.error('Failed to load deferred script:', src, error);
          }
        }
      });
    });
  }, []);

  // Get current performance metrics
  const getMetrics = useCallback(() => {
    return { ...metricsRef.current };
  }, []);

  // Report metrics to analytics
  const reportMetrics = useCallback((analyticsEndpoint?: string) => {
    const metrics = getMetrics();
    
    if (analyticsEndpoint) {
      fetch(analyticsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: window.location.href,
          metrics,
          timestamp: Date.now(),
          userAgent: navigator.userAgent
        })
      }).catch(error => {
        console.error('Failed to report metrics:', error);
      });
    }

    return metrics;
  }, [getMetrics]);

  // Initialize performance optimizations
  useEffect(() => {
    const cleanup = measureWebVitals();
    prefetchCriticalResources();
    addResourceHints();
    const imageCleanup = optimizeImages();
    registerServiceWorker();
    preloadCriticalCSS();
    deferNonCriticalJS();

    // Report metrics after 5 seconds
    const reportTimer = setTimeout(() => {
      reportMetrics();
    }, 5000);

    return () => {
      cleanup?.();
      imageCleanup?.();
      clearTimeout(reportTimer);
    };
  }, [
    measureWebVitals,
    prefetchCriticalResources,
    addResourceHints,
    optimizeImages,
    registerServiceWorker,
    preloadCriticalCSS,
    deferNonCriticalJS,
    reportMetrics
  ]);

  return {
    getMetrics,
    reportMetrics,
    optimizeImages,
    prefetchCriticalResources
  };
};