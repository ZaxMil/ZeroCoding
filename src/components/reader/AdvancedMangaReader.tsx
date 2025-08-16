import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Maximize, Minimize, Bookmark, BookmarkCheck, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { EnhancedPreloadableImage } from './EnhancedPreloadableImage';
import { ReaderSettingsPanel } from './ReaderSettingsPanel';
import { useReaderSettings } from '@/hooks/useReaderSettings';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { useGestureControls } from '@/hooks/useGestureControls';
// import { useImageCache } from '@/hooks/useImageCache';
import { cn } from '@/lib/utils';

interface Chapter {
  id: string;
  title: string;
  pages: string[];
  mangaId: string;
  chapterNumber: number;
}

export const AdvancedMangaReader = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings, updateSetting } = useReaderSettings();
  const { progress, updateProgress } = useReadingProgress(chapterId || '');
  // const { getCachedImageUrl, preloadImages } = useImageCache();
  
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showFloatingGear, setShowFloatingGear] = useState(false);
  const [shortkeysEnabled, setShortkeysEnabled] = useState(true);
  const [shortKeyStatus, setShortKeyStatus] = useState<'enabled' | 'disabled'>('enabled');
  
  const readerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const floatingGearTimeoutRef = useRef<NodeJS.Timeout>();

  // Mock chapter data - replace with actual API call
  useEffect(() => {
    const loadChapter = async () => {
      if (!chapterId) return;
      
      setIsLoading(true);
      try {
        // Mock data - replace with actual API call
        const mockChapter: Chapter = {
          id: chapterId,
          title: 'Chapter 1: The Beginning',
          pages: Array.from({ length: 20 }, (_, i) => `/placeholder.svg?page=${i + 1}`),
          mangaId: 'manga-1',
          chapterNumber: 1
        };
        
        setChapter(mockChapter);
        
        // Start from saved progress or beginning
        if (progress?.currentPage) {
          setCurrentPage(progress.currentPage - 1);
        }
        
        // Preload first few pages would go here
        // const pagesToPreload = mockChapter.pages.slice(0, settings.preloadPages);
        // await preloadImages(pagesToPreload);
        
      } catch (error) {
        console.error('Failed to load chapter:', error);
        toast({
          title: 'Error',
          description: 'Failed to load chapter',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadChapter();
  }, [chapterId, progress, settings.preloadPages, toast]);

  // Navigation functions (defined first to be used in effects)
  const goToNextPage = useCallback(() => {
    if (!chapter) return;
    
    const nextPage = settings.readingDirection === 'rtl' 
      ? currentPage - 1 
      : currentPage + 1;
      
    if (nextPage >= 0 && nextPage < chapter.pages.length) {
      setCurrentPage(nextPage);
      updateProgress(nextPage + 1, chapter.pages.length);
    }
  }, [chapter, currentPage, settings.readingDirection, updateProgress]);

  const goToPreviousPage = useCallback(() => {
    if (!chapter) return;
    
    const prevPage = settings.readingDirection === 'rtl' 
      ? currentPage + 1 
      : currentPage - 1;
      
    if (prevPage >= 0 && prevPage < chapter.pages.length) {
      setCurrentPage(prevPage);
      updateProgress(prevPage + 1, chapter.pages.length);
    }
  }, [chapter, currentPage, settings.readingDirection, updateProgress]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      readerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    updateSetting('zoom', Math.min(settings.zoom + 10, 200));
  }, [settings.zoom, updateSetting]);

  const handleZoomOut = useCallback(() => {
    updateSetting('zoom', Math.max(settings.zoom - 10, 50));
  }, [settings.zoom, updateSetting]);

  // Auto-hide controls and floating gear logic
  useEffect(() => {
    const resetTimeout = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      setShowControls(true);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    const handleMouseMove = () => resetTimeout();
    const handleTouchStart = () => resetTimeout();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchstart', handleTouchStart);
    resetTimeout();

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchstart', handleTouchStart);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Floating gear visibility logic for continuous reading mode
  useEffect(() => {
    if (settings.readingMode !== 'continuous') {
      setShowFloatingGear(false);
      return;
    }

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const shouldShowFloating = scrollTop > 200; // Show when scrolled past navbar
      
      if (shouldShowFloating !== showFloatingGear) {
        setShowFloatingGear(shouldShowFloating);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [settings.readingMode, showFloatingGear]);

  // Shortkey toggle system - Ctrl+Shift+K to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      const activeElement = document.activeElement;
      const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.hasAttribute('contenteditable')
      );

      // Toggle shortkeys with Ctrl+Shift+K
      if (e.ctrlKey && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        setShortkeysEnabled(!shortkeysEnabled);
        setShortKeyStatus(shortkeysEnabled ? 'disabled' : 'enabled');
        
        // Show status briefly
        if (floatingGearTimeoutRef.current) {
          clearTimeout(floatingGearTimeoutRef.current);
        }
        floatingGearTimeoutRef.current = setTimeout(() => {
          setShortKeyStatus(shortkeysEnabled ? 'disabled' : 'enabled');
        }, 2000);
        
        return;
      }

      // Don't process other shortcuts if disabled or typing
      if (!shortkeysEnabled || isTyping) return;

      // Existing keyboard controls
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          goToPreviousPage();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
        case ' ':
          e.preventDefault();
          goToNextPage();
          break;
        case '=':
        case '+':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case 'f':
        case 'F':
        case 'F11':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortkeysEnabled, goToPreviousPage, goToNextPage, handleZoomIn, handleZoomOut, toggleFullscreen]);

  // Gesture controls - only when shortcuts are enabled
  useGestureControls({
    onNextPage: goToNextPage,
    onPreviousPage: goToPreviousPage,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onToggleFullscreen: toggleFullscreen,
    enabled: settings.gesturesEnabled && shortkeysEnabled
  });

  // Apply brightness filter
  useEffect(() => {
    if (readerRef.current) {
      readerRef.current.style.filter = `brightness(${settings.brightness}%)`;
    }
  }, [settings.brightness]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Chapter not found</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const progressPercentage = ((currentPage + 1) / chapter.pages.length) * 100;

  return (
    <div 
      ref={readerRef}
      className="relative min-h-screen bg-background overflow-hidden"
      style={{ zoom: `${settings.zoom}%` }}
    >
      {/* Header Controls */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-semibold">{chapter.title}</h1>
              <p className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {chapter.pages.length}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsBookmarked(!isBookmarked)}
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
            <ReaderSettingsPanel />
          </div>
        </div>
        
        <div className="px-4 pb-4">
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Floating Gear Icon - Only in continuous mode and when away from navbar */}
      {showFloatingGear && settings.readingMode === 'continuous' && !showControls && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <ReaderSettingsPanel 
            trigger={
              <Button
                variant="outline"
                size="icon"
                className="shadow-lg bg-background/80 backdrop-blur-sm hover:bg-background/90"
              >
                <Settings className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      )}

      {/* Shortkey Status Indicator */}
      {shortKeyStatus && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <Badge 
            variant={shortkeysEnabled ? "default" : "destructive"}
            className="shadow-lg bg-background/90 backdrop-blur-sm"
          >
            Shortcuts: {shortkeysEnabled ? 'Enabled' : 'Disabled'} (Ctrl+Shift+K)
          </Badge>
        </div>
      )}

      {/* Reader Content */}
      <div className="pt-24 pb-16">
        {settings.readingMode === 'single' && (
          <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
            <EnhancedPreloadableImage
              src={chapter.pages[currentPage]}
              alt={`Page ${currentPage + 1}`}
              priority="high"
              pageIndex={currentPage}
              className={cn(
                "max-w-full max-h-[calc(100vh-6rem)] object-contain",
                settings.fitMode === 'width' && "w-full h-auto",
                settings.fitMode === 'height' && "h-full w-auto",
                settings.pageTransition && "transition-all duration-300"
              )}
            />
          </div>
        )}

        {settings.readingMode === 'continuous' && (
          <div className="space-y-2">
            {chapter.pages.map((page, index) => (
              <div key={index} className="flex justify-center">
                <EnhancedPreloadableImage
                  src={page}
                  alt={`Page ${index + 1}`}
                  priority={index <= currentPage + settings.preloadPages ? "high" : "low"}
                  pageIndex={index}
                  className={cn(
                    "max-w-full object-contain",
                    settings.fitMode === 'width' && "w-full h-auto",
                    settings.fitMode === 'height' && "max-h-screen w-auto"
                  )}
                />
              </div>
            ))}
          </div>
        )}

        {settings.readingMode === 'double' && (
          <div className="flex items-center justify-center min-h-[calc(100vh-6rem)] gap-2">
            {currentPage < chapter.pages.length && (
              <EnhancedPreloadableImage
                src={chapter.pages[currentPage]}
                alt={`Page ${currentPage + 1}`}
                priority="high"
                pageIndex={currentPage}
                className="max-w-[50%] max-h-[calc(100vh-6rem)] object-contain"
              />
            )}
            {currentPage + 1 < chapter.pages.length && (
              <EnhancedPreloadableImage
                src={chapter.pages[currentPage + 1]}
                alt={`Page ${currentPage + 2}`}
                priority="high"
                pageIndex={currentPage + 1}
                className="max-w-[50%] max-h-[calc(100vh-6rem)] object-contain"
              />
            )}
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      {settings.readingMode === 'single' && (
        <div className={cn(
          "fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <div className="flex items-center justify-between p-4">
            <Button
              variant="outline"
              onClick={goToPreviousPage}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            {settings.showPageNumbers && (
              <span className="text-sm text-muted-foreground">
                {currentPage + 1} / {chapter.pages.length}
              </span>
            )}
            
            <Button
              variant="outline"
              onClick={goToNextPage}
              disabled={currentPage === chapter.pages.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};