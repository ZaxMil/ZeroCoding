import { useState, useEffect } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSignedImageUrl } from '@/lib/access';

interface ImageProps {
  src: string;
  alt: string;
  hasAccess: boolean;
  loading?: 'eager' | 'lazy';
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

export const Image = ({ 
  src, 
  alt, 
  hasAccess, 
  loading = 'lazy', 
  className, 
  style, 
  onLoad, 
  onError 
}: ImageProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState(false);

  // Check if this is a premium image (from storage bucket)
  const isPremiumImage = src.includes('storage') && src.includes('pages');

  useEffect(() => {
    if (isPremiumImage && hasAccess && !signedUrl) {
      setIsLoadingUrl(true);
      setUrlError(false);
      
      // Extract the path from the storage URL
      const pathMatch = src.match(/\/pages\/(.+)$/);
      if (pathMatch) {
        const imagePath = pathMatch[1];
        getSignedImageUrl(imagePath, 300) // 5 minute TTL
          .then((url) => {
            if (url) {
              setSignedUrl(url);
            } else {
              setUrlError(true);
            }
          })
          .catch(() => {
            setUrlError(true);
          })
          .finally(() => {
            setIsLoadingUrl(false);
          });
      }
    }
  }, [src, hasAccess, isPremiumImage, signedUrl]);

  // Show access denied overlay for premium images without access
  if (isPremiumImage && !hasAccess) {
    return (
      <div className="relative w-full min-h-[400px] flex items-center justify-center bg-muted/20">
        <Card className="p-8 text-center bg-background/95 backdrop-blur-sm">
          <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Premium Content</h3>
          <p className="text-muted-foreground mb-4">
            This page requires premium access or coin purchase to view.
          </p>
          <Button variant="outline" size="sm">
            Unlock Chapter
          </Button>
        </Card>
      </div>
    );
  }

  // Show loading state for signed URL generation
  if (isPremiumImage && hasAccess && isLoadingUrl) {
    return (
      <div className="relative w-full min-h-[400px] flex items-center justify-center bg-muted/20">
        <div className="animate-pulse text-muted-foreground">Loading secure image...</div>
      </div>
    );
  }

  // Show error state if signed URL failed
  if (isPremiumImage && hasAccess && urlError) {
    return (
      <div className="relative w-full min-h-[400px] flex items-center justify-center bg-muted/20">
        <Card className="p-8 text-center bg-background/95 backdrop-blur-sm">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Loading Error</h3>
          <p className="text-muted-foreground">
            Failed to load secure image. Please try again.
          </p>
        </Card>
      </div>
    );
  }

  // Use signed URL for premium images, original src for public images
  const imageUrl = isPremiumImage && hasAccess ? signedUrl : src;

  if (!imageUrl) {
    return null;
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      loading={loading}
      className={className}
      style={style}
      onLoad={onLoad}
      onError={onError}
    />
  );
};