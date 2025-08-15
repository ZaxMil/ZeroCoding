import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, BookOpen, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LastReadProgress {
  chapterId: string;
  chapterTitle: string;
  seriesTitle: string;
  pageNumber?: number;
  scrollPosition?: number;
  progress: number; // 0-100
  lastReadAt: Date;
  readingMode: 'single' | 'double' | 'webtoon';
}

interface ContinueReadingButtonProps {
  seriesId?: string;
  className?: string;
  onContinue?: (progress: LastReadProgress) => void;
}

export const ContinueReadingButton = ({ 
  seriesId, 
  className,
  onContinue 
}: ContinueReadingButtonProps) => {
  const [lastProgress, setLastProgress] = useState<LastReadProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLastProgress = async () => {
      try {
        const stored = localStorage.getItem('reading-progress');
        if (stored) {
          const allProgress = JSON.parse(stored);
          
          // Find most recent progress for this series or globally
          const relevantProgress = seriesId 
            ? allProgress.filter((p: any) => p.seriesId === seriesId)
            : allProgress;
            
          if (relevantProgress.length > 0) {
            // Get most recent
            const latest = relevantProgress.sort(
              (a: any, b: any) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime()
            )[0];
            
            // Only show if progress is meaningful (not at start or end)
            if (latest.progress > 5 && latest.progress < 95) {
              setLastProgress(latest);
            }
          }
        }
      } catch (error) {
        console.error('Error loading reading progress:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLastProgress();
  }, [seriesId]);

  const handleContinue = () => {
    if (lastProgress && onContinue) {
      onContinue(lastProgress);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Recently';
  };

  if (loading || !lastProgress) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        onClick={handleContinue}
        className="w-full h-auto p-4 flex items-center justify-between group"
        variant="default"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background/20">
            <Play className="h-4 w-4 fill-current" />
          </div>
          
          <div className="text-left">
            <div className="font-medium text-sm">Continue Reading</div>
            <div className="text-xs opacity-90 truncate max-w-48">
              {lastProgress.chapterTitle}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <Badge variant="secondary" className="text-xs">
            {Math.round(lastProgress.progress)}%
          </Badge>
          <div className="text-xs opacity-75">
            {formatTimeAgo(new Date(lastProgress.lastReadAt))}
          </div>
        </div>
      </Button>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 px-1">
        <BookOpen className="h-3 w-3 text-muted-foreground" />
        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${lastProgress.progress}%` }}
          />
        </div>
        <Clock className="h-3 w-3 text-muted-foreground" />
      </div>
    </div>
  );
};