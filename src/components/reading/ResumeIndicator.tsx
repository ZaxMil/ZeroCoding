import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Play, Clock, CheckCircle } from 'lucide-react';
import { ReadingProgress } from '@/hooks/useAdvancedReadingProgress';

interface ResumeIndicatorProps {
  progress: ReadingProgress;
  onResume: () => void;
  chapterTitle?: string;
}

export const ResumeIndicator = ({ progress, onResume, chapterTitle }: ResumeIndicatorProps) => {
  const getStatusIcon = () => {
    if (progress.completed) return <CheckCircle className="h-4 w-4 text-success" />;
    if (progress.currentPage > 0) return <BookOpen className="h-4 w-4 text-primary" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (progress.completed) return 'Completed';
    if (progress.currentPage > 0) return `Page ${progress.currentPage} of ${progress.totalPages}`;
    return 'Not started';
  };

  const getResumeText = () => {
    if (progress.completed) return 'Read again';
    if (progress.currentPage > 0) {
      if (progress.readingMode === 'webtoon' && progress.scrollPosition) {
        return 'Resume reading';
      }
      return `Resume from page ${progress.currentPage}`;
    }
    return 'Start reading';
  };

  return (
    <Card className="p-4 border-l-4 border-l-primary bg-primary/5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusText()}</span>
            <Badge variant={progress.completed ? 'default' : 'secondary'} className="text-xs">
              {Math.round(progress.percentage)}%
            </Badge>
          </div>
          
          {chapterTitle && (
            <p className="text-sm text-muted-foreground mb-2 truncate">
              {chapterTitle}
            </p>
          )}
          
          <Progress value={progress.percentage} className="h-2 mb-2" />
          
          <p className="text-xs text-muted-foreground">
            Last read: {new Date(progress.lastReadAt).toLocaleDateString()}
          </p>
        </div>
        
        <Button 
          onClick={onResume}
          size="sm"
          className="flex items-center gap-2 shrink-0"
        >
          <Play className="h-4 w-4" />
          {getResumeText()}
        </Button>
      </div>
    </Card>
  );
};