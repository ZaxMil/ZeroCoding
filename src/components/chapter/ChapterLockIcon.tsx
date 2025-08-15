import React from 'react';
import { Lock, LockOpen, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChapterLockIconProps {
  isLocked: boolean;
  isOpened: boolean;
  isRecent?: boolean; // Is this the most recently read chapter
  className?: string;
  showUnlockedIcon?: boolean;
}

export const ChapterLockIcon: React.FC<ChapterLockIconProps> = ({
  isLocked,
  isOpened,
  isRecent = false,
  className = '',
  showUnlockedIcon = true
}) => {
  // Priority order: Clock (recent) > Lock (locked) > None (free)
  
  // 1. Clock icon for most recently read chapter (highest priority)
  if (isRecent && !isLocked) {
    return (
      <Clock 
        className={cn(
          "h-3 w-3 text-blue-500",
          "transition-all duration-200",
          "drop-shadow-sm",
          className
        )} 
        aria-label="Recently read chapter"
      />
    );
  }
  
  // 2. Lock icon for locked chapters
  if (isLocked) {
    // For locked chapters that have been opened - show green unlocked icon
    if (isOpened) {
      return (
        <LockOpen 
          className={cn(
            "h-3 w-3 text-green-500",
            "transition-all duration-200",
            "drop-shadow-sm",
            className
          )} 
          aria-label="Chapter unlocked (previously opened)"
        />
      );
    }
    
    // For locked chapters that haven't been opened - show orange/yellow locked icon
    return (
      <Lock 
        className={cn(
          "h-3 w-3 text-yellow-500",
          "transition-all duration-200",
          "drop-shadow-sm",
          className
        )} 
        aria-label="Chapter locked"
      />
    );
  }

  // 3. For free chapters - no icon unless explicitly requested
  if (!isLocked && showUnlockedIcon) {
    return (
      <LockOpen 
        className={cn(
          "h-3 w-3 text-muted-foreground",
          "transition-all duration-200",
          className
        )} 
        aria-label="Chapter free"
      />
    );
  }

  // Default: no icon for free chapters
  return null;
};