import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Home, List, SkipBack, SkipForward, Settings, ZoomIn, ZoomOut, RotateCcw, User, Maximize2, RefreshCw } from 'lucide-react';
import { useChapterLayout } from '@/hooks/useChapterLayout';
import { ReaderSettingsSheet } from './ReaderSettingsSheet';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SinglePageReaderProps {
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

export const SinglePageReader = ({
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
}: SinglePageReaderProps) => {
  const { imageFit, imageScale, autoHideControls } = useChapterLayout();
  const { user, userProfile } = useAuth();
  const [showControls, setShowControls] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(100);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
          goToPreviousPage();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          goToNextPage();
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
    if (currentPage < pages.length - 1) {
      onPageChange(currentPage + 1);
      resetZoom();
      setShowControls(true);
    } else if (hasNextChapter) {
      // Auto-navigate to next chapter when reaching last page
      onNextChapter();
    }
  }, [currentPage, pages.length, hasNextChapter, onPageChange, onNextChapter]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
      resetZoom();
    } else if (hasPreviousChapter) {
      onPreviousChapter();
    }
    setShowControls(true);
  }, [currentPage, hasPreviousChapter, onPageChange, onPreviousChapter]);

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

  const handleContainerClick = (e: React.MouseEvent) => {
    // Don't navigate if we're panning or zoomed in
    if (currentZoom > 100 || isPanning) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const containerWidth = rect.width;
    const leftThird = containerWidth / 3;
    const rightThird = containerWidth * 2 / 3;
    
    if (clickX < leftThird) {
      goToPreviousPage();
    } else if (clickX > rightThird) {
      goToNextPage();
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
                  {currentPage + 1}/{pages.length}
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
        className="relative w-full h-screen flex items-center justify-center"
        onClick={handleContainerClick}
      >
        {/* Simple Page Container */}
        <div className="relative w-full h-full max-w-6xl flex items-center justify-center">
          <img
            ref={imageRef}
            src={pages[currentPage]}
            alt={`Page ${currentPage + 1}`}
            className="max-w-full max-h-full object-contain select-none"
            style={getImageStyles()}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            draggable={false}
          />
        </div>

        {/* Navigation Arrows */}
        {showControls && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="fixed left-4 top-1/2 -translate-y-1/2 z-40 bg-background/95 backdrop-blur-sm h-8 w-8 p-0"
              onClick={goToPreviousPage}
              disabled={currentPage === 0 && !hasPreviousChapter}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="fixed right-4 top-1/2 -translate-y-1/2 z-40 bg-background/95 backdrop-blur-sm h-8 w-8 p-0"
              onClick={goToNextPage}
              disabled={currentPage === pages.length - 1 && !hasNextChapter}
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
        className="fixed top-4 right-4 z-50 bg-background/95 backdrop-blur-sm border-border/50 hover:bg-accent h-8 w-8 p-0"
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