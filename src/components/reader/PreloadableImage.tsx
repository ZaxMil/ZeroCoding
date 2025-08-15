import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface PreloadableImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  pageIndex: number;
  onLoad?: () => void;
  onError?: (error: React.SyntheticEvent<HTMLImageElement>) => void;
  hasAccess?: boolean;
  priority?: 'high' | 'low';
  className?: string;
}

export const PreloadableImage = ({
  src,
  alt,
  pageIndex,
  onLoad,
  onError,
  hasAccess = true,
  priority = 'low',
  className,
  ...props
}: PreloadableImageProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasErrored, setHasErrored] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    // Add data attribute for intersection observer
    img.setAttribute('data-page-index', pageIndex.toString());

    const handleLoad = () => {
      setIsLoading(false);
      setHasErrored(false);
      onLoad?.();
    };

    const handleError = (e: Event) => {
      setIsLoading(false);
      setHasErrored(true);
      onError?.(e as any);
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [pageIndex, onLoad, onError]);

  if (!hasAccess) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted/50 border border-dashed rounded-lg",
        className
      )}>
        <div className="text-center p-8">
          <div className="text-sm text-muted-foreground mb-2">Premium Content</div>
          <div className="text-xs text-muted-foreground">
            Upgrade to access this page
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {hasErrored && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="text-center p-4">
            <div className="text-sm text-destructive mb-1">Failed to load</div>
            <div className="text-xs text-muted-foreground">Page {pageIndex + 1}</div>
          </div>
        </div>
      )}

      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={cn(
          "block mx-auto transition-opacity duration-200",
          isLoading && "opacity-0",
          hasErrored && "opacity-30",
          className
        )}
        loading={pageIndex < 3 ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority}
        {...props}
      />
    </div>
  );
};