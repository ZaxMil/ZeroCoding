import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeLeftIndicatorProps {
  totalPages: number;
  currentPage: number;
  averageReadingSpeed?: number; // pages per minute
  className?: string;
}

export const TimeLeftIndicator = ({ 
  totalPages, 
  currentPage, 
  averageReadingSpeed = 1.5, // default 1.5 pages per minute
  className 
}: TimeLeftIndicatorProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const pagesRemaining = Math.max(0, totalPages - currentPage);
    const minutesLeft = Math.ceil(pagesRemaining / averageReadingSpeed);
    setTimeLeft(minutesLeft);
    
    // Show indicator only if there's meaningful time left
    setIsVisible(minutesLeft > 0 && pagesRemaining > 0);
  }, [totalPages, currentPage, averageReadingSpeed]);

  const formatTime = (minutes: number) => {
    if (minutes < 1) return '< 1min';
    if (minutes < 60) return `${minutes}min`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getVariant = () => {
    if (timeLeft <= 2) return 'default';
    if (timeLeft <= 10) return 'secondary';
    return 'outline';
  };

  const getIcon = () => {
    if (timeLeft <= 5) return <Timer className="h-3 w-3" />;
    return <Clock className="h-3 w-3" />;
  };

  if (!isVisible) return null;

  return (
    <Badge
      variant={getVariant()}
      className={cn(
        "flex items-center gap-1 text-xs transition-all duration-300",
        "hover:scale-105 cursor-default",
        className
      )}
    >
      {getIcon()}
      <span>{formatTime(timeLeft)} left</span>
    </Badge>
  );
};