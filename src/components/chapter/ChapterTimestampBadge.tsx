import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChapterTimestampBadgeProps {
  timestamp: number;
  className?: string;
  showIcon?: boolean;
  iconOnly?: boolean;
}

export const ChapterTimestampBadge: React.FC<ChapterTimestampBadgeProps> = ({
  timestamp,
  className = '',
  showIcon = true,
  iconOnly = false
}) => {
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center transition-colors",
              iconOnly 
                ? "p-1 rounded hover:bg-muted/50" 
                : "gap-1 px-2 py-1 rounded-md bg-muted/80 text-muted-foreground text-xs border border-border/50 backdrop-blur-sm hover:bg-muted",
              className
            )}
          >
            {(showIcon || iconOnly) && <Clock className="h-3 w-3" />}
            {!iconOnly && <span>Last opened {timeAgo}</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Opened on {new Date(timestamp).toLocaleDateString()} at {new Date(timestamp).toLocaleTimeString()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};