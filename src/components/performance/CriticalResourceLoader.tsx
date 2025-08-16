import React, { useEffect, useRef, useState } from 'react';

interface ResourceConfig {
  url: string;
  type: 'script' | 'style' | 'font' | 'image';
  priority: 'high' | 'medium' | 'low';
  crossOrigin?: 'anonymous' | 'use-credentials';
  integrity?: string;
  media?: string;
  defer?: boolean;
  async?: boolean;
}

interface CriticalResourceLoaderProps {
  resources: ResourceConfig[];
  onResourceLoad?: (resource: ResourceConfig) => void;
  onResourceError?: (resource: ResourceConfig, error: Error) => void;
  onAllResourcesLoaded?: () => void;
}

export const CriticalResourceLoader: React.FC<CriticalResourceLoaderProps> = ({
  resources,
  onResourceLoad,
  onResourceError,
  onAllResourcesLoaded
}) => {
  const [loadedResources, setLoadedResources] = useState<Set<string>>(new Set());
  const loadingRef = useRef<Map<string, Promise<void>>>(new Map());

  const loadResource = async (resource: ResourceConfig): Promise<void> => {
    const { url, type, priority, crossOrigin, integrity, media, defer, async } = resource;
    
    // Check if resource is already loading or loaded
    if (loadingRef.current.has(url) || loadedResources.has(url)) {
      return loadingRef.current.get(url) || Promise.resolve();
    }

    const loadPromise = new Promise<void>((resolve, reject) => {
      let element: HTMLElement;

      switch (type) {
        case 'script':
          element = document.createElement('script');
          const script = element as HTMLScriptElement;
          script.src = url;
          script.defer = defer || false;
          script.async = async || false;
          if (crossOrigin) script.crossOrigin = crossOrigin;
          if (integrity) script.integrity = integrity;
          break;

        case 'style':
          element = document.createElement('link');
          const link = element as HTMLLinkElement;
          link.rel = 'stylesheet';
          link.href = url;
          if (crossOrigin) link.crossOrigin = crossOrigin;
          if (integrity) link.integrity = integrity;
          if (media) link.media = media;
          break;

        case 'font':
          element = document.createElement('link');
          const fontLink = element as HTMLLinkElement;
          fontLink.rel = 'preload';
          fontLink.as = 'font';
          fontLink.href = url;
          fontLink.crossOrigin = 'anonymous';
          if (integrity) fontLink.integrity = integrity;
          break;

        case 'image':
          element = document.createElement('link');
          const imgLink = element as HTMLLinkElement;
          imgLink.rel = 'preload';
          imgLink.as = 'image';
          imgLink.href = url;
          if (crossOrigin) imgLink.crossOrigin = crossOrigin;
          break;

        default:
          reject(new Error(`Unsupported resource type: ${type}`));
          return;
      }

      // Set loading priority
      if ('fetchPriority' in element) {
        (element as any).fetchPriority = priority;
      }

      element.onload = () => {
        setLoadedResources(prev => new Set([...prev, url]));
        onResourceLoad?.(resource);
        resolve();
      };

      element.onerror = () => {
        const error = new Error(`Failed to load resource: ${url}`);
        onResourceError?.(resource, error);
        reject(error);
      };

      // Add to document head
      document.head.appendChild(element);
    });

    loadingRef.current.set(url, loadPromise);
    return loadPromise;
  };

  const loadResourcesByPriority = async () => {
    // Group resources by priority
    const highPriority = resources.filter(r => r.priority === 'high');
    const mediumPriority = resources.filter(r => r.priority === 'medium');
    const lowPriority = resources.filter(r => r.priority === 'low');

    try {
      // Load high priority resources first (in parallel)
      await Promise.all(highPriority.map(loadResource));

      // Then medium priority (in parallel)
      await Promise.all(mediumPriority.map(loadResource));

      // Finally low priority (can be deferred)
      setTimeout(() => {
        Promise.all(lowPriority.map(loadResource)).catch(console.error);
      }, 100);

      onAllResourcesLoaded?.();
    } catch (error) {
      console.error('Critical resource loading failed:', error);
    }
  };

  useEffect(() => {
    loadResourcesByPriority();
  }, [resources]);

  // Don't render anything - this component only manages resource loading
  return null;
};

// Predefined resource configurations for common use cases
export const createFontResources = (fonts: string[]): ResourceConfig[] => {
  return fonts.map(url => ({
    url,
    type: 'font' as const,
    priority: 'high' as const,
    crossOrigin: 'anonymous' as const
  }));
};

export const createCriticalStyleResources = (styles: string[]): ResourceConfig[] => {
  return styles.map(url => ({
    url,
    type: 'style' as const,
    priority: 'high' as const
  }));
};

export const createDeferredScriptResources = (scripts: string[]): ResourceConfig[] => {
  return scripts.map(url => ({
    url,
    type: 'script' as const,
    priority: 'low' as const,
    defer: true
  }));
};

// Hook for managing critical resources
export const useCriticalResources = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const handleResourceLoad = () => {
    setLoadedCount(prev => prev + 1);
  };

  const handleAllResourcesLoaded = () => {
    setIsLoading(false);
  };

  const loadResources = (resources: ResourceConfig[]) => {
    setTotalCount(resources.length);
    setLoadedCount(0);
    setIsLoading(true);
  };

  const loadingProgress = totalCount > 0 ? (loadedCount / totalCount) * 100 : 0;

  return {
    isLoading,
    loadingProgress,
    loadedCount,
    totalCount,
    handleResourceLoad,
    handleAllResourcesLoaded,
    loadResources
  };
};