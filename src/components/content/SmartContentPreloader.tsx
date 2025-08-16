import React, { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';

interface PreloadableContent {
  id: string;
  type: 'image' | 'video' | 'data';
  url: string;
  priority: number;
  metadata?: Record<string, any>;
}

interface SmartContentPreloaderProps {
  content: PreloadableContent[];
  maxConcurrent?: number;
  preloadDistance?: number;
  onPreloadComplete?: (contentId: string) => void;
  onPreloadError?: (contentId: string, error: Error) => void;
}

interface PreloaderRef {
  jumpToIndex: (index: number) => void;
  preloadSpecific: (contentId: string) => void;
  isPreloaded: (contentId: string) => boolean;
  isLoading: (contentId: string) => boolean;
  getPreloadedCount: () => number;
  getTotalCount: () => number;
}

export const SmartContentPreloader = forwardRef<PreloaderRef, SmartContentPreloaderProps>(({
  content,
  maxConcurrent = 3,
  preloadDistance = 2,
  onPreloadComplete,
  onPreloadError
}, ref) => {
  const [preloadedContent, setPreloadedContent] = useState<Set<string>>(new Set());
  const [loadingContent, setLoadingContent] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [preloadQueue, setPreloadQueue] = useState<PreloadableContent[]>([]);

  // Smart preloading based on user position and content priority
  const preloadContent = useCallback(async (item: PreloadableContent) => {
    if (preloadedContent.has(item.id) || loadingContent.has(item.id)) {
      return;
    }

    setLoadingContent(prev => new Set([...prev, item.id]));

    try {
      switch (item.type) {
        case 'image':
          await preloadImage(item.url);
          break;
        case 'video':
          await preloadVideo(item.url);
          break;
        case 'data':
          await preloadData(item.url);
          break;
      }
      
      setPreloadedContent(prev => new Set([...prev, item.id]));
      onPreloadComplete?.(item.id);
    } catch (error) {
      console.error(`Failed to preload content ${item.id}:`, error);
      onPreloadError?.(item.id, error as Error);
    } finally {
      setLoadingContent(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  }, [preloadedContent, loadingContent, onPreloadComplete, onPreloadError]);

  const preloadImage = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
  };

  const preloadVideo = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.onloadeddata = () => resolve();
      video.onerror = reject;
      video.preload = 'metadata';
      video.src = url;
    });
  };

  const preloadData = async (url: string): Promise<void> => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    await response.json();
  };

  // Update preload queue based on current position and priorities
  useEffect(() => {
    const startIndex = Math.max(0, currentIndex - 1);
    const endIndex = Math.min(content.length - 1, currentIndex + preloadDistance);
    
    const newQueue = content
      .slice(startIndex, endIndex + 1)
      .sort((a, b) => {
        // Higher priority content loads first
        const priorityDiff = b.priority - a.priority;
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by distance from current position
        const distanceA = Math.abs(content.indexOf(a) - currentIndex);
        const distanceB = Math.abs(content.indexOf(b) - currentIndex);
        return distanceA - distanceB;
      });

    setPreloadQueue(newQueue);
  }, [currentIndex, content, preloadDistance]);

  // Process preload queue with concurrency limit
  useEffect(() => {
    const processQueue = async () => {
      const availableSlots = maxConcurrent - loadingContent.size;
      if (availableSlots <= 0) return;

      const itemsToPreload = preloadQueue
        .filter(item => !preloadedContent.has(item.id) && !loadingContent.has(item.id))
        .slice(0, availableSlots);

      await Promise.all(itemsToPreload.map(preloadContent));
    };

    processQueue();
  }, [preloadQueue, loadingContent.size, maxConcurrent, preloadContent, preloadedContent]);

  // Provide methods for external components to control preloading
  const jumpToIndex = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(content.length - 1, index)));
  }, [content.length]);

  const preloadSpecific = useCallback((contentId: string) => {
    const item = content.find(c => c.id === contentId);
    if (item) {
      preloadContent(item);
    }
  }, [content, preloadContent]);

  const isPreloaded = useCallback((contentId: string) => {
    return preloadedContent.has(contentId);
  }, [preloadedContent]);

  const isLoading = useCallback((contentId: string) => {
    return loadingContent.has(contentId);
  }, [loadingContent]);

  // Expose control methods through context or refs
  useImperativeHandle(ref, () => ({
    jumpToIndex,
    preloadSpecific,
    isPreloaded,
    isLoading,
    getPreloadedCount: () => preloadedContent.size,
    getTotalCount: () => content.length
  }), [jumpToIndex, preloadSpecific, isPreloaded, isLoading, preloadedContent.size, content.length]);

  return null; // This is a utility component that doesn't render anything
});

// Hook for using the preloader
export const useSmartPreloader = (
  content: PreloadableContent[],
  options?: Partial<SmartContentPreloaderProps>
) => {
  const [preloader, setPreloader] = useState<{
    jumpToIndex: (index: number) => void;
    preloadSpecific: (contentId: string) => void;
    isPreloaded: (contentId: string) => boolean;
    isLoading: (contentId: string) => boolean;
    getPreloadedCount: () => number;
    getTotalCount: () => number;
  } | null>(null);

  return {
    SmartContentPreloader: () => (
      <SmartContentPreloader
        content={content}
        ref={(ref: any) => setPreloader(ref)}
        {...options}
      />
    ),
    preloader
  };
};