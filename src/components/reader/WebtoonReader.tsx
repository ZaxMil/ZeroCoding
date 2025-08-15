import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Home, List, Settings, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ChapterSettings } from './ChapterSettings';
import { useChapterLayout } from '@/hooks/useChapterLayout';
import { useAdvancedImagePreloader } from '@/hooks/useAdvancedImagePreloader';
import { useAdvancedReadingProgress } from '@/hooks/useAdvancedReadingProgress';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useKeyboardSettings } from '@/hooks/useKeyboardSettings';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { PreloadableImage } from './PreloadableImage';
import { ResumeIndicator } from '@/components/reading/ResumeIndicator';
import { ChapterProgressBar } from '@/components/reading/ChapterProgressBar';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { KeyboardVisualFeedback } from './KeyboardVisualFeedback';
import { EnhancedUnifiedCommentSystem } from '@/components/comments/EnhancedUnifiedCommentSystem';
import { CircularProgress } from './CircularProgress';
import { hasPremiumAccess } from '@/lib/access';
import { getSignedPageUrl, preloadSignedUrls } from '@/utils/watermark/getSignedPageUrl';
import { useAuth } from '@/contexts/AuthContext';
interface WebtoonReaderProps {
  pages: string[];
  currentPage: number;
  onPageChange: (page: number) => void;
  onNavigateHome: () => void;
  onNavigateChapterList: () => void;
  onPreviousChapter: () => void;
  onNextChapter: () => void;
  hasPreviousChapter: boolean;
  hasNextChapter: boolean;
  chapterTitle: string;
  chapterNumber: number;
  seriesSlug?: string;
  chapterId?: string;
}
export const WebtoonReader = ({
  pages,
  currentPage,
  onPageChange,
  onNavigateHome,
  onNavigateChapterList,
  onPreviousChapter,
  onNextChapter,
  hasPreviousChapter,
  hasNextChapter,
  chapterTitle,
  chapterNumber,
  seriesSlug,
  chapterId
}: WebtoonReaderProps) => {
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const suppressAutoScroll = useRef(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [boxedWidth, setBoxedWidth] = useState(() => {
    const stored = localStorage.getItem('manga-boxed-width');
    // Default to true (boxed) unless explicitly set to 'false'
    return stored === null ? true : stored === 'true';
  });
  const [hasAccess, setHasAccess] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<number, string>>({});
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Use signed URLs and prefetch
  const effectivePages = Object.keys(signedUrls).length > 0 ? pages.map((_, index) => signedUrls[index] || pages[index]) : pages;
  const {
    metrics,
    isPreloaded
  } = useAdvancedImagePreloader(effectivePages, currentPage, {
    strategy: 'conservative',
    mode: 'webtoon',
    enabled: true
  });
  const {
    imageGap,
    imageFit,
    imageScale,
    readingMode
  } = useChapterLayout();
  const {
    user
  } = useAuth();
  const navigate = useNavigate();

  // Enhanced progress tracking with scroll position support
  const {
    updateProgress: updateAdvancedProgress,
    getChapterProgress,
    getCompletionStatus,
    debouncedSave,
    settings: progressSettings
  } = useAdvancedReadingProgress(user?.id, chapterId);

  // Get current chapter's progress for resume functionality
  const currentChapterProgress = getChapterProgress(chapterId || '');
  const scrollPositionRef = useRef<number>(0);

  // Keyboard settings
  const {
    settings: keyboardSettings
  } = useKeyboardSettings();

  // Keyboard navigation functions
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };
  const handleScrollUp = () => {
    window.scrollBy({
      top: -window.innerHeight * 0.8,
      behavior: 'smooth'
    });
  };
  const handleScrollDown = () => {
    window.scrollBy({
      top: window.innerHeight * 0.8,
      behavior: 'smooth'
    });
  };
  const handleJumpToPercentage = (percentage: number) => {
    const targetPage = Math.floor(percentage / 100 * pages.length);
    const clampedPage = Math.max(0, Math.min(targetPage, pages.length - 1));
    onPageChange(clampedPage);
  };
  const handleJumpToStart = () => {
    onPageChange(0);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  const handleJumpToEnd = () => {
    onPageChange(pages.length - 1);
    const lastPageElement = pageRefs.current[pages.length - 1];
    if (lastPageElement) {
      lastPageElement.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  };
  const handleCloseModal = () => {
    if (settingsOpen) {
      setSettingsOpen(false);
    } else if (showKeyboardHelp) {
      setShowKeyboardHelp(false);
    }
  };

  // Initialize keyboard navigation
  const {
    shortcuts
  } = useKeyboardNavigation({
    onPrevPage: () => {
      if (currentPage > 0) {
        onPageChange(currentPage - 1);
      } else {
        onPreviousChapter();
      }
    },
    onNextPage: () => {
      if (currentPage < pages.length - 1) {
        onPageChange(currentPage + 1);
      } else {
        onNextChapter();
      }
    },
    onPrevChapter: onPreviousChapter,
    onNextChapter: onNextChapter,
    onScrollUp: handleScrollUp,
    onScrollDown: handleScrollDown,
    onToggleFullscreen: handleToggleFullscreen,
    onToggleSettings: () => setSettingsOpen(!settingsOpen),
    onToggleTheme: () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    },
    onShowHelp: () => setShowKeyboardHelp(true),
    onCloseModal: handleCloseModal,
    onJumpToStart: handleJumpToStart,
    onJumpToEnd: handleJumpToEnd,
    onJumpToPercentage: handleJumpToPercentage,
    settings: keyboardSettings,
    scope: 'reader'
  });

  // Initialize swipe navigation
  useSwipeNavigation({
    onSwipeLeft: () => {
      if (currentPage < pages.length - 1) {
        onPageChange(currentPage + 1);
      } else {
        onNextChapter();
      }
    },
    onSwipeRight: () => {
      if (currentPage > 0) {
        onPageChange(currentPage - 1);
      } else {
        onPreviousChapter();
      }
    },
    enabled: true
  });

  // Map ImageFit to valid CSS objectFit values
  const getObjectFit = (fit: string): 'contain' | 'cover' | 'fill' | 'scale-down' | 'none' => {
    switch (fit) {
      case 'contain':
        return 'contain';
      case 'width':
        return 'contain';
      case 'height':
        return 'contain';
      case 'auto':
        return 'none';
      default:
        return 'contain';
    }
  };

  // Update current page based on window scroll position (single scroll)
  useEffect(() => {
    const handleScroll = () => {
      const threshold = window.innerHeight * 0.5; // 50% of viewport
      scrollPositionRef.current = window.scrollY;
      for (let i = 0; i < pageRefs.current.length; i++) {
        const pageEl = pageRefs.current[i];
        if (!pageEl) continue;
        const rect = pageEl.getBoundingClientRect();
        const pageTop = rect.top;
        const pageBottom = rect.bottom;
        if (pageTop <= threshold && pageBottom >= threshold) {
          if (i !== currentPage) {
            suppressAutoScroll.current = true;
            onPageChange(i);

            // Update progress with scroll position for webtoon mode
            if (chapterId && progressSettings.enableTracking) {
              debouncedSave(chapterId, {
                currentPage: i,
                totalPages: pages.length,
                scrollPosition: scrollPositionRef.current,
                readingMode: 'webtoon',
                completed: i >= pages.length - 1
              });
            }
            setTimeout(() => {
              suppressAutoScroll.current = false;
            }, 100);
          }
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, {
      passive: true
    });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentPage, onPageChange, chapterId, pages.length, debouncedSave, progressSettings.enableTracking]);

  // Auto-scroll to current page when it changes externally OR resume from saved position
  useEffect(() => {
    if (suppressAutoScroll.current) return;

    // Auto-resume functionality
    if (currentChapterProgress?.resumePosition && progressSettings.autoResume) {
      const {
        page,
        scroll
      } = currentChapterProgress.resumePosition;

      // Only auto-resume on initial load (when currentPage is 0)
      if (currentPage === 0 && page > 0) {
        console.log('Auto-resuming from saved position:', {
          page,
          scroll
        });
        onPageChange(page);

        // Restore scroll position after a brief delay
        setTimeout(() => {
          window.scrollTo({
            top: scroll,
            behavior: 'smooth'
          });
        }, 500);
        return;
      }
    }
    const pageEl = pageRefs.current[currentPage];
    if (pageEl) {
      pageEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [currentPage, currentChapterProgress, progressSettings.autoResume, onPageChange]);

  // Listen for boxed width changes
  useEffect(() => {
    const handleBoxedWidthChange = (event: CustomEvent) => {
      setBoxedWidth(event.detail);
    };
    window.addEventListener('boxedWidthChange', handleBoxedWidthChange as EventListener);
    return () => {
      window.removeEventListener('boxedWidthChange', handleBoxedWidthChange as EventListener);
    };
  }, []);

  // Load signed URLs for pages with WebP detection
  useEffect(() => {
    if (!chapterId) return;
    const supportsWebP = () => {
      try {
        return document.createElement('canvas').toDataURL('image/webp').indexOf('webp') > -1;
      } catch {
        return false;
      }
    };
    const format = supportsWebP() ? 'webp' : 'jpeg';
    const loadSignedUrls = async () => {
      // Load current page and next 2 pages
      const startIndex = currentPage;
      const count = Math.min(3, pages.length - startIndex);
      for (let i = 0; i < count; i++) {
        const pageIndex = startIndex + i;
        if (signedUrls[pageIndex]) continue; // Already have this URL

        try {
          const signedUrl = await getSignedPageUrl(chapterId, pageIndex, 120, format);
          if (signedUrl) {
            setSignedUrls(prev => ({
              ...prev,
              [pageIndex]: signedUrl
            }));
          }
        } catch (error) {
          console.warn(`Failed to get signed URL for page ${pageIndex}:`, error);
        }
      }
    };
    loadSignedUrls();
  }, [chapterId, currentPage, pages.length]);

  // Preload next pages with signed URLs  
  useEffect(() => {
    if (!chapterId) return;
    const supportsWebP = () => {
      try {
        return document.createElement('canvas').toDataURL('image/webp').indexOf('webp') > -1;
      } catch {
        return false;
      }
    };
    const format = supportsWebP() ? 'webp' : 'jpeg';
    const preloadNext = async () => {
      try {
        const nextUrls = await preloadSignedUrls(chapterId, currentPage + 1, 2, format);
        nextUrls.forEach((url, idx) => {
          const pageIndex = currentPage + 1 + idx;
          setSignedUrls(prev => ({
            ...prev,
            [pageIndex]: url
          }));
        });
      } catch (error) {
        console.warn('Failed to preload signed URLs:', error);
      }
    };
    preloadNext();
  }, [chapterId, currentPage]);

  // Check access for premium content
  useEffect(() => {
    if (seriesSlug && user) {
      hasPremiumAccess(user.id, seriesSlug, chapterNumber).then(result => setHasAccess(result.hasAccess)).catch(() => setHasAccess(false));
    }
  }, [seriesSlug, chapterNumber, user]);

  // Lazy-load comments: load after user scrolls at least half a viewport
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 0.5) {
        setShowComments(true);
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, {
      passive: true
    });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const progressPercentage = (currentPage + 1) / pages.length * 100;
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <Card className="rounded-none border-b bg-background/95 backdrop-blur-sm">
        <div className="w-full px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-4 min-w-0">
              <Button variant="ghost" size="sm" onClick={onNavigateHome} className="px-2 sm:px-3">
                <Home className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Home</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={onNavigateChapterList} className="px-2 sm:px-3">
                <List className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Chapters</span>
              </Button>
            </div>
            
            <div className="text-center min-w-0 flex-1 mx-2">
              <h1 className="font-bold text-sm sm:text-lg truncate">Ch. {chapterNumber}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">{chapterTitle}</p>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                {currentPage + 1}/{pages.length}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(!settingsOpen)} className="px-2">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-2 sm:mt-3">
            <Progress value={progressPercentage} className="h-1" />
          </div>
        </div>
      </Card>

      {/* Resume Indicator */}
      {currentChapterProgress && currentChapterProgress.currentPage > 0 && !suppressAutoScroll.current && <div className="fixed top-20 left-4 right-4 z-40 max-w-md mx-auto">
          <ResumeIndicator progress={currentChapterProgress} chapterTitle={chapterTitle} onResume={() => {
        if (currentChapterProgress.resumePosition) {
          onPageChange(currentChapterProgress.resumePosition.page);
          setTimeout(() => {
            window.scrollTo({
              top: currentChapterProgress.resumePosition!.scroll,
              behavior: 'smooth'
            });
          }, 100);
        }
      }} />
        </div>}

      {/* Webtoon Pages Container - Seamless vertical flow */}
      <div className="pt-0 sm:pt-0 pb-0 sm:pb-0 overflow-x-hidden">
        <div className={boxedWidth ? "max-w-4xl mx-auto" : "w-full"}>
          <div style={{
          width: `${imageScale}%`,
          margin: '0 auto'
        }}>
            {pages.map((page, index) => <div key={index} ref={el => pageRefs.current[index] = el} className="w-full block" style={{
            marginBottom: `${imageGap}px`
          }}>
                <PreloadableImage src={signedUrls[index] || (typeof page === 'string' ? page : '')} alt={`Page ${index + 1}`} pageIndex={index} hasAccess={hasAccess} priority={index <= currentPage + 2 ? 'high' : 'low'} className="block mx-auto" style={{
              width: imageFit === 'auto' ? 'auto' : '100%',
              height: readingMode === 'webtoon' ? 'auto' : imageFit === 'height' ? '100vh' : 'auto',
              maxWidth: boxedWidth ? '100%' : '100vw',
              objectFit: readingMode === 'webtoon' ? 'contain' : getObjectFit(imageFit),
              display: 'block'
            }} onLoad={() => {
              console.log(`Page ${index + 1} loaded successfully ${isPreloaded(signedUrls[index] || page) ? '(preloaded)' : ''}`);
            }} onError={async e => {
              const target = e.currentTarget as HTMLImageElement;
              console.error(`Failed to load page ${index + 1}:`, page);

              // Try to refresh signed URL on error (likely expired) with same format
              if (chapterId && signedUrls[index]) {
                try {
                  const supportsWebP = () => {
                    try {
                      return document.createElement('canvas').toDataURL('image/webp').indexOf('webp') > -1;
                    } catch {
                      return false;
                    }
                  };
                  const format = supportsWebP() ? 'webp' : 'jpeg';
                  const freshUrl = await getSignedPageUrl(chapterId, index, 120, format);
                  if (freshUrl && freshUrl !== signedUrls[index]) {
                    setSignedUrls(prev => ({
                      ...prev,
                      [index]: freshUrl
                    }));
                    target.src = freshUrl;
                    return;
                  }
                } catch (error) {
                  console.warn(`Failed to refresh signed URL for page ${index + 1}:`, error);
                }
              }
              target.src = '/placeholder.svg';
              target.style.opacity = '0.7';
            }} />
              </div>)}
          </div>
        </div>
      </div>

      {/* Hidden horizontal progress bar */}
      <div className="hidden">
        <ChapterProgressBar currentPage={currentPage} totalPages={pages.length} variant="both" className="max-w-4xl mx-auto" />
      </div>

      {/* Footer */}
      <Card className="rounded-none border-t bg-background/95 backdrop-blur-sm">
        <div className="w-full px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="group relative">
              <Button variant="outline" size="sm" onClick={onPreviousChapter} disabled={!hasPreviousChapter} className="px-2 sm:px-4">
                <ChevronLeft className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              {hasPreviousChapter && <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  Previous Chapter: Ch. {chapterNumber - 1}
                </div>}
            </div>
            
            <div className="text-center min-w-0 flex-1 flex items-center justify-center gap-2">
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {currentPage + 1}/{pages.length}
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {Math.round(progressPercentage)}% Complete
                </div>
              </div>
              
              {seriesSlug && <Button variant="ghost" size="sm" onClick={() => navigate(`/series/${seriesSlug}`)} className="px-2 sm:px-3" title="View series details">
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline sm:ml-1">Details</span>
                </Button>}
            </div>
            
            <div className="group relative">
              <Button variant="outline" size="sm" onClick={onNextChapter} disabled={!hasNextChapter} className="px-2 sm:px-4">
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4 sm:ml-1" />
              </Button>
              {hasNextChapter && <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  Next Chapter: Ch. {chapterNumber + 1}
                </div>}
            </div>
          </div>
        </div>
      </Card>

      {/* Comments Section - Full screen overlay when active */}
      {showComments && chapterId && <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Chapter Comments</h2>
                <Button variant="outline" size="sm" onClick={() => setShowComments(false)}>
                  Close
                </Button>
              </div>
              <EnhancedUnifiedCommentSystem targetType="chapter" targetId={chapterId} targetTitle={chapterTitle} showRating={true} />
            </div>
          </div>
        </div>}

      {/* Comments Toggle - Add floating button for comments */}
      <div className="fixed bottom-20 right-4 z-40">
        
      </div>

      {/* Floating Settings Button with Circular Progress */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="relative">
          <CircularProgress value={progressPercentage} size={44} strokeWidth={3} />
          <Button variant="secondary" size="icon" className="rounded-full shadow-lg relative z-10" aria-label="Reader settings" onClick={() => setSettingsOpen(!settingsOpen)}>
            <Settings className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Chapter Settings Panel */}
      <ChapterSettings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} metrics={metrics} />

      {/* Keyboard Help Dialog */}
      <KeyboardShortcutsHelp shortcuts={shortcuts} open={showKeyboardHelp} onOpenChange={setShowKeyboardHelp} />

      {/* Visual Feedback for Keyboard Actions */}
      {keyboardSettings.visualFeedback && <KeyboardVisualFeedback />}
    </div>;
};