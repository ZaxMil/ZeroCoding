import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Home, List, SkipBack, SkipForward, Settings, ZoomIn, ZoomOut, RotateCcw, User, Maximize2, RefreshCw } from 'lucide-react';
import { useChapterLayout } from '@/hooks/useChapterLayout';
import { ReaderSettingsSheet } from './ReaderSettingsSheet';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DoublePageReaderProps {
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
  chapterId?: string;
}

export const DoublePageReader = ({
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
}: DoublePageReaderProps) => {
  const { imageFit, imageScale, autoHideControls, pageFlipAnimation } = useChapterLayout();
  const { user, userProfile } = useAuth();
  const [showControls, setShowControls] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const [loadingPages, setLoadingPages] = useState<Record<number, boolean>>({});
  const [currentZoom, setCurrentZoom] = useState(100);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate pages for manga reading order (right-to-left)
  const getCurrentPages = () => {
    // Ensure we start from an even page index for proper spreads
    const spreadStartIndex = Math.floor(currentPage / 2) * 2;
    const rightPageIndex = spreadStartIndex;
    const leftPageIndex = spreadStartIndex + 1;
    
    return {
      rightPage: pages[rightPageIndex] || null,
      leftPage: leftPageIndex < pages.length ? pages[leftPageIndex] : null,
      rightPageIndex,
      leftPageIndex: leftPageIndex < pages.length ? leftPageIndex : null
    };
  };

  // Auto-hide controls (only if enabled)
  useEffect(() => {
    if (!autoHideControls) return;
    
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, [showControls, autoHideControls]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          goToNextPage(); // In manga, left arrow goes to next page
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          goToPreviousPage(); // In manga, right arrow goes to previous page
          break;
        case ' ':
          e.preventDefault();
          setShowControls(!showControls);
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
        case '0':
          resetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showControls, currentZoom]);

  const goToNextPage = useCallback(() => {
    if (isFlipping) return; // Prevent navigation during animation
    
    const nextPage = currentPage + 2; // Skip 2 pages in double page mode
    
    if (pageFlipAnimation && (nextPage < pages.length || hasNextChapter)) {
      setIsFlipping(true);
      setFlipDirection('next');
      
      // Delay the actual page change for flip animation
      setTimeout(() => {
        if (nextPage < pages.length) {
          onPageChange(nextPage);
          resetZoom();
        } else if (hasNextChapter) {
          onNextChapter();
        }
        
        // Reset animation state
        setTimeout(() => {
          setIsFlipping(false);
          setFlipDirection(null);
        }, 600); // Match CSS animation duration (0.8s - 0.2s delay)
      }, 300); // Slightly longer delay for elastic effect
    } else {
      // Instant navigation when animation is disabled
      if (nextPage < pages.length) {
        onPageChange(nextPage);
        resetZoom();
      } else if (hasNextChapter) {
        onNextChapter();
      }
    }
    setShowControls(true);
  }, [currentPage, pages.length, hasNextChapter, onPageChange, onNextChapter, pageFlipAnimation, isFlipping]);

  const goToPreviousPage = useCallback(() => {
    if (isFlipping) return; // Prevent navigation during animation
    
    const prevPage = Math.max(0, currentPage - 2); // Go back 2 pages in double page mode
    
    if (pageFlipAnimation && (prevPage >= 0 || hasPreviousChapter)) {
      setIsFlipping(true);
      setFlipDirection('prev');
      
      // Delay the actual page change for flip animation
      setTimeout(() => {
        if (prevPage >= 0) {
          onPageChange(prevPage);
          resetZoom();
        } else if (hasPreviousChapter) {
          onPreviousChapter();
        }
        
        // Reset animation state
        setTimeout(() => {
          setIsFlipping(false);
          setFlipDirection(null);
        }, 600); // Match CSS animation duration (0.8s - 0.2s delay)
      }, 300); // Slightly longer delay for elastic effect
    } else {
      // Instant navigation when animation is disabled
      if (prevPage >= 0) {
        onPageChange(prevPage);
        resetZoom();
      } else if (hasPreviousChapter) {
        onPreviousChapter();
      }
    }
    setShowControls(true);
  }, [currentPage, hasPreviousChapter, onPageChange, onPreviousChapter, pageFlipAnimation, isFlipping]);

  const zoomIn = () => setCurrentZoom(prev => Math.min(300, prev + 25));
  const zoomOut = () => setCurrentZoom(prev => Math.max(25, prev - 25));
  const resetZoom = () => {
    setCurrentZoom(100);
    setPanPosition({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const reloadChapter = async () => {
    setIsPreloading(true);
    try {
      // Force reload all images by updating their src with cache busting
      const imageElements = document.querySelectorAll('img');
      imageElements.forEach((img, index) => {
        if (img.src.includes('page')) {
          img.src = `${img.src}?t=${Date.now()}`;
        }
      });
    } finally {
      setIsPreloading(false);
    }
  };

  // Preload next double page spread
  useEffect(() => {
    const { rightPageIndex, leftPageIndex } = getCurrentPages();
    const nextRightIndex = rightPageIndex + 2;
    const nextLeftIndex = leftPageIndex !== null ? leftPageIndex + 2 : null;
    
    if (nextRightIndex < pages.length) {
      const img = new Image();
      img.src = pages[nextRightIndex];
    }
    if (nextLeftIndex !== null && nextLeftIndex < pages.length) {
      const img = new Image();
      img.src = pages[nextLeftIndex];
    }
  }, [currentPage, pages]);

  const handleContainerClick = (e: React.MouseEvent) => {
    // Don't navigate if we're panning, zoomed in, or flipping
    if (currentZoom > 100 || isPanning || isFlipping) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const containerWidth = rect.width;
    const leftThird = containerWidth / 3;
    const rightThird = containerWidth * 2 / 3;
    
    if (clickX < leftThird) {
      goToPreviousPage(); // In manga, left side goes to previous
    } else if (clickX > rightThird) {
      goToNextPage(); // In manga, right side goes to next
    } else {
      setShowControls(!showControls);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (currentZoom > 100) {
      setIsPanning(true);
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && currentZoom > 100) {
      const container = containerRef.current;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const maxPanX = Math.max(0, (containerRect.width * currentZoom / 100 - containerRect.width) / 2);
        const maxPanY = Math.max(0, (containerRect.height * currentZoom / 100 - containerRect.height) / 2);
        
        setPanPosition(prev => ({
          x: Math.max(-maxPanX, Math.min(maxPanX, prev.x + e.movementX)),
          y: Math.max(-maxPanY, Math.min(maxPanY, prev.y + e.movementY))
        }));
      }
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const getImageStyles = () => {
    const baseScale = (imageScale / 100) * (currentZoom / 100);
    
    let objectFit: 'contain' | 'cover' | 'fill' | 'scale-down' | 'none' = 'contain';
    let width = '100%';
    let height = '100%';
    let maxWidth = 'none';
    let maxHeight = 'none';
    
    switch (imageFit) {
      case 'width':
        objectFit = 'none';
        width = '100%';
        height = 'auto';
        maxHeight = '100%';
        break;
      case 'height':
        objectFit = 'contain';
        width = 'auto';
        height = '100%';
        maxWidth = '100%';
        break;
      case 'auto':
        objectFit = 'none';
        width = 'auto';
        height = 'auto';
        maxWidth = '100%';
        maxHeight = '100%';
        break;
      default: // contain
        objectFit = 'contain';
        width = '100%';
        height = '100%';
    }

    return {
      transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${baseScale})`,
      objectFit,
      width,
      height,
      maxWidth,
      maxHeight,
      cursor: currentZoom > 100 ? (isPanning ? 'grabbing' : 'grab') : 'pointer',
      transition: 'transform 0.2s ease-out'
    };
  };

  const { rightPage, leftPage, rightPageIndex, leftPageIndex } = getCurrentPages();
  const progressPercentage = ((currentPage + 1) / pages.length) * 100;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Header */}
      {showControls && (
        <Card className="fixed top-0 left-0 right-0 z-50 rounded-none border-b bg-background/95 backdrop-blur-sm animate-fade-in">
          <div className="w-full px-4 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={onNavigateHome}>
                  <Home className="h-3 w-3 mr-1" />
                  Home
                </Button>
                <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={onNavigateChapterList}>
                  <List className="h-3 w-3 mr-1" />
                  Chapters
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-7 px-2"
                  onClick={reloadChapter}
                  disabled={isPreloading}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isPreloading ? 'animate-spin' : ''}`} />
                  Reload
                </Button>
              </div>
              
              <div className="text-center flex-1">
                <h1 className="font-bold text-base truncate">Ch. {chapterNumber} : {chapterTitle}</h1>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {rightPageIndex + 1}-{leftPageIndex ? leftPageIndex + 1 : rightPageIndex + 1}/{pages.length}
                </span>
                {user && (
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      <User className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-muted/30 h-0.5">
            <div 
              className="h-full bg-primary transition-all duration-300" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </Card>
      )}

      {/* Main Reader Area */}
      <div 
        ref={containerRef}
        className="relative w-full h-screen flex items-center justify-center pt-12"
        onClick={handleContainerClick}
      >
        {/* Double Page Container with Flip Animation */}
        <div className="relative w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center perspective-1000">
          <div 
            className={`flex w-full h-full gap-1 transform-style-preserve-3d transition-transform duration-200 ${
              isFlipping && flipDirection === 'next' ? 'animate-[elasticFlipNext_0.8s_cubic-bezier(0.25,0.46,0.45,0.94)]' :
              isFlipping && flipDirection === 'prev' ? 'animate-[elasticFlipPrev_0.8s_cubic-bezier(0.25,0.46,0.45,0.94)]' : ''
            }`}
          >
            {/* Right Page (First in manga reading order) */}
            <div 
              className={`flex-1 h-full relative transform-gpu transition-all duration-300 ${
                isFlipping && flipDirection === 'next' ? 'elastic-flip-shadow-active animate-[elasticBounceNext_0.8s_cubic-bezier(0.68,-0.55,0.265,1.55)]' :
                isFlipping && flipDirection === 'prev' ? 'elastic-flip-shadow-active animate-[elasticBouncePrev_0.8s_cubic-bezier(0.68,-0.55,0.265,1.55)]' :
                'elastic-flip-shadow'
              }`}
            >
              {rightPage && (
                <img
                  src={rightPage}
                  alt={`Page ${rightPageIndex + 1}`}
                  className="w-full h-full object-contain select-none"
                  style={getImageStyles()}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  draggable={false}
                  onLoad={() => setLoadingPages(prev => ({ ...prev, [rightPageIndex]: false }))}
                  onLoadStart={() => setLoadingPages(prev => ({ ...prev, [rightPageIndex]: true }))}
                />
              )}
              {loadingPages[rightPageIndex] && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
            </div>

            {/* Left Page (Second in manga reading order) */}
            <div 
              className={`flex-1 h-full relative transform-gpu transition-all duration-300 ${
                isFlipping && flipDirection === 'next' ? 'elastic-flip-shadow-active animate-[elasticBounceNext_0.8s_cubic-bezier(0.68,-0.55,0.265,1.55)]' :
                isFlipping && flipDirection === 'prev' ? 'elastic-flip-shadow-active animate-[elasticBouncePrev_0.8s_cubic-bezier(0.68,-0.55,0.265,1.55)]' :
                'elastic-flip-shadow'
              }`}
            >
              {leftPage && leftPageIndex !== null && (
                <img
                  src={leftPage}
                  alt={`Page ${leftPageIndex + 1}`}
                  className="w-full h-full object-contain select-none"
                  style={getImageStyles()}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  draggable={false}
                  onLoad={() => setLoadingPages(prev => ({ ...prev, [leftPageIndex]: false }))}
                  onLoadStart={() => setLoadingPages(prev => ({ ...prev, [leftPageIndex]: true }))}
                />
              )}
              {leftPageIndex !== null && loadingPages[leftPageIndex] && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {showControls && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="fixed left-4 top-1/2 -translate-y-1/2 z-40 bg-background/95 backdrop-blur-sm h-8 w-8 p-0"
              onClick={goToNextPage}
              disabled={currentPage >= pages.length - 1 && !hasNextChapter}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="fixed right-4 top-1/2 -translate-y-1/2 z-40 bg-background/95 backdrop-blur-sm h-8 w-8 p-0"
              onClick={goToPreviousPage}
              disabled={currentPage === 0 && !hasPreviousChapter}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {/* Bottom Controls */}
      {showControls && (
        <Card className="fixed bottom-0 left-0 right-0 z-50 rounded-none border-t bg-background/95 backdrop-blur-sm animate-fade-in">
          <div className="w-full px-4 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={onPreviousChapter}
                  disabled={!hasPreviousChapter}
                >
                  <SkipBack className="h-3 w-3 mr-1" />
                  Prev Chapter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={onNextChapter}
                  disabled={!hasNextChapter}
                >
                  Next Chapter
                  <SkipForward className="h-3 w-3 ml-1" />
                </Button>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={zoomOut}>
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <span className="text-xs font-mono min-w-10 text-center">{currentZoom}%</span>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={zoomIn}>
                  <ZoomIn className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={resetZoom}>
                  <RotateCcw className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={toggleFullscreen}>
                  <Maximize2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Floating Settings Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setSettingsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-background/95 backdrop-blur-sm border-border/50 hover:bg-accent h-8 w-8 p-0"
      >
        <Settings className="h-3 w-3" />
      </Button>

      {/* Settings Panel */}
      <ReaderSettingsSheet
        isOpen={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  );
};