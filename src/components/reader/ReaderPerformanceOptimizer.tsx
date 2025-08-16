import { useEffect, useCallback, useRef } from 'react';

interface ReaderPerformanceOptimizerProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const ReaderPerformanceOptimizer = ({
  currentPage,
  totalPages,
  onPageChange
}: ReaderPerformanceOptimizerProps) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pageElementsRef = useRef<Map<number, HTMLElement>>(new Map());

  // Register page element for intersection observation
  const registerPageElement = useCallback((pageIndex: number, element: HTMLElement | null) => {
    if (element) {
      pageElementsRef.current.set(pageIndex, element);
    } else {
      pageElementsRef.current.delete(pageIndex);
    }
  }, []);

  // Setup intersection observer for automatic page detection
  useEffect(() => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          let mostVisiblePage = currentPage;
          let maxVisibility = 0;

          entries.forEach((entry) => {
            const pageIndex = parseInt(entry.target.getAttribute('data-page-index') || '0');
            const visibility = entry.intersectionRatio;

            if (visibility > maxVisibility && visibility > 0.5) {
              maxVisibility = visibility;
              mostVisiblePage = pageIndex;
            }
          });

          if (mostVisiblePage !== currentPage && maxVisibility > 0.5) {
            onPageChange(mostVisiblePage);
          }
        },
        {
          threshold: [0.1, 0.3, 0.5, 0.7, 0.9],
          rootMargin: '-10% 0px -10% 0px'
        }
      );
    }

    // Observe all registered page elements
    pageElementsRef.current.forEach((element, pageIndex) => {
      element.setAttribute('data-page-index', pageIndex.toString());
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [currentPage, onPageChange]);

  // Preload next pages for smooth scrolling
  useEffect(() => {
    const preloadImages = () => {
      const preloadRange = 2; // Preload 2 pages ahead
      
      for (let i = 1; i <= preloadRange; i++) {
        const nextPageIndex = currentPage + i;
        if (nextPageIndex < totalPages) {
          const pageElement = pageElementsRef.current.get(nextPageIndex);
          if (pageElement) {
            const img = pageElement.querySelector('img');
            if (img && !img.complete) {
              // Create a hidden image to trigger loading
              const preloadImg = new Image();
              preloadImg.src = img.src;
            }
          }
        }
      }
    };

    const timeoutId = setTimeout(preloadImages, 100);
    return () => clearTimeout(timeoutId);
  }, [currentPage, totalPages]);

  // Smooth scroll optimization
  useEffect(() => {
    let ticking = false;

    const optimizeScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Add scroll momentum and reduce scroll resistance
          document.documentElement.style.scrollBehavior = 'smooth';
          ticking = false;
        });
        ticking = true;
      }
    };

    const handleScroll = () => {
      optimizeScroll();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  // Memory management - cleanup images outside viewport
  useEffect(() => {
    const cleanupImages = () => {
      const viewportRange = 5; // Keep images within 5 pages of current
      
      pageElementsRef.current.forEach((element, pageIndex) => {
        const distance = Math.abs(pageIndex - currentPage);
        
        if (distance > viewportRange) {
          const img = element.querySelector('img') as HTMLImageElement;
          if (img && img.src && img.src !== '/placeholder.svg') {
            // Store original src in data attribute
            img.setAttribute('data-original-src', img.src);
            img.src = '/placeholder.svg';
            img.loading = 'lazy';
          }
        } else {
          // Restore original src if needed
          const img = element.querySelector('img') as HTMLImageElement;
          if (img && img.hasAttribute('data-original-src')) {
            const originalSrc = img.getAttribute('data-original-src');
            if (originalSrc && img.src === '/placeholder.svg') {
              img.src = originalSrc;
              img.removeAttribute('data-original-src');
            }
          }
        }
      });
    };

    const timeoutId = setTimeout(cleanupImages, 1000);
    return () => clearTimeout(timeoutId);
  }, [currentPage]);

  return {
    registerPageElement
  };
};