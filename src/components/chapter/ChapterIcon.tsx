import React from 'react';
import { Clock, Lock, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useOpenedChapters } from '@/hooks/useOpenedChapters';
import { formatDistanceToNow } from 'date-fns';

interface ChapterIconProps {
  chapterId: string;
  isLocked: boolean;
  createdAt: string;
  seriesId?: string;
  className?: string;
}

export const ChapterIcon: React.FC<ChapterIconProps> = ({ 
  chapterId, 
  isLocked, 
  createdAt, 
  seriesId,
  className = "h-3 w-3" 
}) => {
  const { getLastOpenedChapterId } = useOpenedChapters();
  
  // Check if this is the most recently read chapter (per series if seriesId provided)
  const lastOpenedId = getLastOpenedChapterId(seriesId);
  const isMostRecentlyRead = lastOpenedId === chapterId;
  
  // Check if chapter is new (within 3 days)
  const daysDiff = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const isNew = daysDiff < 3;
  
  // Priority: Clock (most recent) > Lock (locked) > Nothing (free)
  if (isMostRecentlyRead && !isLocked) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Clock className={`${className} text-blue-500`} />
          </TooltipTrigger>
          <TooltipContent>
            <p>Continue reading</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  if (isLocked) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Lock className={`${className} text-yellow-500`} />
          </TooltipTrigger>
          <TooltipContent>
            <p>Premium chapter</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // For new chapters, show sparkles but only if not locked and not most recent
  if (isNew && !isMostRecentlyRead) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-green-400">
              <Sparkles className={className} />
              <span className="text-xs font-semibold">NEW</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Free chapters with no special status show nothing
  return null;
};