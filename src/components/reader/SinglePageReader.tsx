import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Home, List, SkipBack, SkipForward, Settings, ZoomIn, ZoomOut, RotateCcw, User, Maximize2 } from 'lucide-react';
import { useChapterLayout } from '@/hooks/useChapterLayout';
import { ReaderControls } from './ReaderControls';
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
  const { imageFit, imageScale } = useChapterLayout();
  const { user, userProfile } = useAuth();
  const [showControls, setShowControls] = useState(true);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const [currentZoom, setCurrentZoom] = useState(100);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-hide controls
  useEffect(() => {
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, [showControls]);

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
    if (isFlipping) return;
    
    if (currentPage < pages.length - 1) {
      setFlipDirection('next');
      setIsFlipping(true);
      
      setTimeout(() => {
        onPageChange(currentPage + 1);
        setIsFlipping(false);
        resetZoom();
      }, 300);
    } else if (hasNextChapter) {
      onNextChapter();
    }
    setShowControls(true);
  }, [currentPage, pages.length, hasNextChapter, onPageChange, onNextChapter, isFlipping]);

  const goToPreviousPage = useCallback(() => {
    if (isFlipping) return;
    
    if (currentPage > 0) {
      setFlipDirection('prev');
      setIsFlipping(true);
      
      setTimeout(() => {
        onPageChange(currentPage - 1);
        setIsFlipping(false);
        resetZoom();
      }, 300);
    } else if (hasPreviousChapter) {
      onPreviousChapter();
    }
    setShowControls(true);
  }, [currentPage, hasPreviousChapter, onPageChange, onPreviousChapter, isFlipping]);

  const zoomIn = () => setCurrentZoom(prev => Math.min(200, prev + 25));
  const zoomOut = () => setCurrentZoom(prev => Math.max(50, prev - 25));
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

  const handleImageClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const centerX = rect.width / 2;
    
    if (clickX < centerX) {
      goToPreviousPage();
    } else {
      goToNextPage();
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
      setPanPosition(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const getImageStyles = () => {
    const baseScale = (imageScale / 100) * (currentZoom / 100);
    
    let objectFit: 'contain' | 'cover' | 'fill' | 'scale-down' | 'none' = 'contain';
    switch (imageFit) {
      case 'width':
        objectFit = 'cover';
        break;
      case 'height':
        objectFit = 'contain';
        break;
      case 'auto':
        objectFit = 'none';
        break;
      default:
        objectFit = 'contain';
    }

    return {
      transform: `scale(${baseScale}) translate(${panPosition.x}px, ${panPosition.y}px)`,
      objectFit,
      cursor: currentZoom > 100 ? (isPanning ? 'grabbing' : 'grab') : 'pointer',
      transition: isFlipping ? 'none' : 'transform 0.2s ease-out'
    };
  };

  const progressPercentage = ((currentPage + 1) / pages.length) * 100;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Header */}
      {showControls && (
        <Card className="fixed top-0 left-0 right-0 z-50 rounded-none border-b bg-background/95 backdrop-blur-sm animate-fade-in">
          <div className="w-full px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={onNavigateHome}>
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
                <Button variant="ghost" size="sm" onClick={onNavigateChapterList}>
                  <List className="h-4 w-4 mr-2" />
                  Chapters
                </Button>
              </div>
              
              <div className="text-center flex-1">
                <h1 className="font-bold text-lg">Ch. {chapterNumber}</h1>
                <p className="text-sm text-muted-foreground truncate">{chapterTitle}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {currentPage + 1}/{pages.length}
                </span>
                {user && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-muted/30 h-1">
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
        className="relative w-full h-screen flex items-center justify-center pt-16"
        onClick={() => setShowControls(!showControls)}
      >
        {/* Page Container with Flip Animation */}
        <div className="relative w-full h-full max-w-6xl max-h-[90vh] perspective-1000">
          <div 
            className={`
              relative w-full h-full transition-transform duration-300 transform-style-preserve-3d
              ${isFlipping && flipDirection === 'next' ? 'rotate-y-180' : ''}
              ${isFlipping && flipDirection === 'prev' ? 'rotate-y-neg-180' : ''}
            `}
          >
            <img
              ref={imageRef}
              src={pages[currentPage]}
              alt={`Page ${currentPage + 1}`}
              className="w-full h-full object-contain select-none"
              style={getImageStyles()}
              onClick={handleImageClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              draggable={false}
            />
          </div>
        </div>

        {/* Navigation Arrows */}
        {showControls && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="fixed left-4 top-1/2 -translate-y-1/2 z-40 bg-background/95 backdrop-blur-sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 0 && !hasPreviousChapter}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="fixed right-4 top-1/2 -translate-y-1/2 z-40 bg-background/95 backdrop-blur-sm"
              onClick={goToNextPage}
              disabled={currentPage === pages.length - 1 && !hasNextChapter}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>

      {/* Bottom Controls */}
      {showControls && (
        <Card className="fixed bottom-0 left-0 right-0 z-50 rounded-none border-t bg-background/95 backdrop-blur-sm animate-fade-in">
          <div className="w-full px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPreviousChapter}
                  disabled={!hasPreviousChapter}
                >
                  <SkipBack className="h-4 w-4 mr-2" />
                  Prev Chapter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNextChapter}
                  disabled={!hasNextChapter}
                >
                  Next Chapter
                  <SkipForward className="h-4 w-4 ml-2" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={zoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-mono min-w-12 text-center">{currentZoom}%</span>
                <Button variant="outline" size="icon" onClick={zoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={resetZoom}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={toggleFullscreen}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Reader Controls */}
      <ReaderControls 
        isVisible={controlsOpen} 
        onToggle={() => setControlsOpen(!controlsOpen)} 
      />
    </div>
  );
};