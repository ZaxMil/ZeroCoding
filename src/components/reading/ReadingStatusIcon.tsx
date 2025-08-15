import { cn } from '@/lib/utils';
import { CheckCircle, BookOpen, Circle, Clock } from 'lucide-react';

export type ReadingStatus = 'unread' | 'reading' | 'completed';

interface ReadingStatusIconProps {
  status: ReadingStatus;
  progress?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ReadingStatusIcon = ({ 
  status, 
  progress = 0, 
  size = 'md',
  className 
}: ReadingStatusIconProps) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  };

  const iconSize = sizeClasses[size];

  const getIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className={cn(iconSize, "text-success", className)} />;
      case 'reading':
        return <BookOpen className={cn(iconSize, "text-primary", className)} />;
      case 'unread':
      default:
        return <Circle className={cn(iconSize, "text-muted-foreground", className)} />;
    }
  };

  const getTooltipText = () => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'reading':
        return `In progress (${progress}%)`;
      case 'unread':
      default:
        return 'Not started';
    }
  };

  return (
    <div 
      className="relative flex items-center"
      title={getTooltipText()}
    >
      {getIcon()}
      
      {status === 'reading' && progress > 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="rounded-full bg-primary"
            style={{
              width: `${Math.max(2, (progress / 100) * (size === 'sm' ? 12 : size === 'md' ? 16 : 20))}px`,
              height: `${Math.max(2, (progress / 100) * (size === 'sm' ? 12 : size === 'md' ? 16 : 20))}px`,
            }}
          />
        </div>
      )}
    </div>
  );
};