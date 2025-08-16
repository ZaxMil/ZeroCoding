import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface EnhancedPreloadableImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  pageIndex: number;
  onLoad?: () => void;
  onError?: (error: React.SyntheticEvent<HTMLImageElement>) => void;
  hasAccess?: boolean;
  priority?: 'high' | 'low';
  className?: string;
  enableBlankSpaceRemoval?: boolean;
  blankSpaceThreshold?: number;
}

export const EnhancedPreloadableImage = ({
  src,
  alt,
  pageIndex,
  onLoad,
  onError,
  hasAccess = true,
  priority = 'low',
  className,
  enableBlankSpaceRemoval = true,
  blankSpaceThreshold = 240, // RGB threshold for considering a pixel "blank/white"
  ...props
}: EnhancedPreloadableImageProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasErrored, setHasErrored] = useState(false);
  const [originalImageData, setOriginalImageData] = useState<string | null>(null);
  const [processedImageData, setProcessedImageData] = useState<string | null>(null);
  const [processingComplete, setProcessingComplete] = useState(false);

  // Detect blank space and crop image
  const processImage = useCallback(async (imageElement: HTMLImageElement) => {
    if (!enableBlankSpaceRemoval || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    try {
      // Set canvas size to match image
      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;

      // Draw image to canvas
      ctx.drawImage(imageElement, 0, 0);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Find bounding box of non-blank content
      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = 0;
      let maxY = 0;

      // Check each pixel to find content boundaries
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          // Check if pixel is not blank/white (below threshold)
          const isContent = (r + g + b) / 3 < blankSpaceThreshold && a > 128;
          
          if (isContent) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      // If we found content, crop the image
      if (minX < maxX && minY < maxY) {
        const cropWidth = maxX - minX + 1;
        const cropHeight = maxY - minY + 1;

        // Add small padding to avoid cutting off content
        const padding = 5;
        const paddedMinX = Math.max(0, minX - padding);
        const paddedMinY = Math.max(0, minY - padding);
        const paddedWidth = Math.min(canvas.width - paddedMinX, cropWidth + (padding * 2));
        const paddedHeight = Math.min(canvas.height - paddedMinY, cropHeight + (padding * 2));

        // Only crop if we're removing significant blank space (at least 10% reduction)
        const originalArea = canvas.width * canvas.height;
        const croppedArea = paddedWidth * paddedHeight;
        const spaceReduction = (originalArea - croppedArea) / originalArea;

        if (spaceReduction > 0.1) {
          // Create a new canvas for the cropped image
          const croppedCanvas = document.createElement('canvas');
          const croppedCtx = croppedCanvas.getContext('2d');
          
          if (croppedCtx) {
            croppedCanvas.width = paddedWidth;
            croppedCanvas.height = paddedHeight;
            
            // Draw the cropped portion
            croppedCtx.drawImage(
              canvas,
              paddedMinX, paddedMinY, paddedWidth, paddedHeight,
              0, 0, paddedWidth, paddedHeight
            );

            // Convert to data URL
            return croppedCanvas.toDataURL('image/jpeg', 0.92);
          }
        }
      }

      return null;
    } catch (error) {
      console.warn('Failed to process image for blank space removal:', error);
      return null;
    }
  }, [enableBlankSpaceRemoval, blankSpaceThreshold]);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setHasErrored(false);
    onLoad?.();

    // Process image for blank space removal
    if (imgRef.current && enableBlankSpaceRemoval) {
      processImage(imgRef.current).then((processedData) => {
        if (processedData) {
          setProcessedImageData(processedData);
        }
        setProcessingComplete(true);
      });
    } else {
      setProcessingComplete(true);
    }
  }, [onLoad, processImage, enableBlankSpaceRemoval]);

  const handleImageError = useCallback((error: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    setHasErrored(true);
    setProcessingComplete(true);
    onError?.(error);
  }, [onError]);

  useEffect(() => {
    setOriginalImageData(src);
    setProcessedImageData(null);
    setProcessingComplete(false);
    setIsLoading(true);
    setHasErrored(false);
  }, [src]);

  if (!hasAccess) {
    return (
      <div className={cn(
        "relative flex items-center justify-center bg-muted/20 min-h-[200px] rounded-lg border-2 border-dashed border-muted-foreground/20",
        className
      )}>
        <div className="text-center p-4">
          <div className="text-muted-foreground mb-2">🔒</div>
          <p className="text-sm text-muted-foreground">Premium Content</p>
          <p className="text-xs text-muted-foreground mt-1">Unlock to view this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/10 rounded">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error state */}
      {hasErrored && (
        <div className="flex items-center justify-center bg-muted/20 min-h-[200px] rounded border border-muted-foreground/20">
          <div className="text-center p-4">
            <p className="text-sm text-muted-foreground mb-2">Failed to load page {pageIndex + 1}</p>
            <button 
              onClick={() => {
                if (imgRef.current) {
                  imgRef.current.src = src + '?retry=' + Date.now();
                }
              }}
              className="text-xs text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={processedImageData || originalImageData || src}
        alt={alt}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={priority === 'high' ? 'eager' : 'lazy'}
        className={cn(
          "transition-opacity duration-300",
          isLoading && "opacity-0",
          !isLoading && !hasErrored && "opacity-100"
        )}
        {...props}
      />

      {/* Processing indicator */}
      {enableBlankSpaceRemoval && !processingComplete && !isLoading && !hasErrored && (
        <div className="absolute top-2 right-2 bg-primary/10 backdrop-blur-sm rounded px-2 py-1">
          <div className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-xs text-primary">Optimizing...</span>
          </div>
        </div>
      )}

      {/* Optimization complete indicator */}
      {processedImageData && processingComplete && (
        <div className="absolute top-2 right-2 bg-green-500/10 backdrop-blur-sm rounded px-2 py-1 opacity-0 animate-[fadeInOut_2s_ease-in-out]">
          <span className="text-xs text-green-600">✓ Optimized</span>
        </div>
      )}
    </div>
  );
};

// Add CSS animation for fade in/out
const styles = `
@keyframes fadeInOut {
  0% { opacity: 0; }
  15% { opacity: 1; }
  85% { opacity: 1; }
  100% { opacity: 0; }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}