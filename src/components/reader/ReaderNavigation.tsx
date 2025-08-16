import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronLeft, 
  ChevronRight, 
  SkipBack, 
  SkipForward,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move
} from 'lucide-react';

interface ReaderNavigationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onPreviousChapter: () => void;
  onNextChapter: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  canGoPreviousChapter: boolean;
  canGoNextChapter: boolean;
  showProgress?: boolean;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  enableZoom?: boolean;
  showPageSlider?: boolean;
}

export const ReaderNavigation: React.FC<ReaderNavigationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  onPreviousPage,
  onNextPage,
  onPreviousChapter,
  onNextChapter,
  canGoPrevious,
  canGoNext,
  canGoPreviousChapter,
  canGoNextChapter,
  showProgress = true,
  zoom = 100,
  onZoomChange,
  enableZoom = false,
  showPageSlider = false
}) => {
  const progress = totalPages > 0 ? ((currentPage + 1) / totalPages) * 100 : 0;

  const handleZoomIn = () => {
    if (onZoomChange && zoom < 200) {
      onZoomChange(Math.min(200, zoom + 25));
    }
  };

  const handleZoomOut = () => {
    if (onZoomChange && zoom > 25) {
      onZoomChange(Math.max(25, zoom - 25));
    }
  };

  const handleResetZoom = () => {
    if (onZoomChange) {
      onZoomChange(100);
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Reading Progress</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {currentPage + 1} / {totalPages}
              </Badge>
              <Badge variant="secondary">
                {Math.round(progress)}%
              </Badge>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Page Slider */}
      {showPageSlider && totalPages > 1 && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Jump to Page</div>
          <div className="px-2">
            <Slider
              value={[currentPage]}
              onValueChange={([value]) => onPageChange(value)}
              max={totalPages - 1}
              min={0}
              step={1}
              className="w-full"
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1</span>
            <span>{totalPages}</span>
          </div>
        </div>
      )}

      {/* Chapter Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousChapter}
          disabled={!canGoPreviousChapter}
          className="flex items-center gap-2"
        >
          <SkipBack className="h-4 w-4" />
          Previous Chapter
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onNextChapter}
          disabled={!canGoNextChapter}
          className="flex items-center gap-2"
        >
          Next Chapter
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousPage}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 min-w-[120px] justify-center">
          <span className="text-sm font-medium">
            Page {currentPage + 1}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!canGoNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Zoom Controls */}
      {enableZoom && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground text-center">
            Zoom Controls
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 25}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 min-w-[80px] justify-center">
              <Badge variant="outline">{zoom}%</Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetZoom}
              disabled={zoom === 100}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {zoom !== 100 && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Move className="h-3 w-3" />
                <span>Drag to pan when zoomed</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Page Jump */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>Use arrow keys or swipe to navigate</span>
      </div>
    </div>
  );
};