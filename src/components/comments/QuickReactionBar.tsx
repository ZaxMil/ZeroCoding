import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface QuickReactionBarProps {
  commentId: string;
  reactions?: Array<{
    emoji: string;
    count: number;
    hasUserReacted: boolean;
    users: string[];
  }>;
  onReaction: (commentId: string, emoji: string) => void;
  onRemoveReaction: (commentId: string, emoji: string) => void;
  className?: string;
}

const QUICK_REACTIONS = [
  { emoji: '👍', label: 'Like' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '💡', label: 'Insightful' }
];

export const QuickReactionBar: React.FC<QuickReactionBarProps> = ({
  commentId,
  reactions = [],
  onReaction,
  onRemoveReaction,
  className
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getReactionData = (emoji: string) => {
    return reactions.find(r => r.emoji === emoji) || {
      emoji,
      count: 0,
      hasUserReacted: false,
      users: []
    };
  };

  const handleReactionClick = (emoji: string) => {
    const reactionData = getReactionData(emoji);
    if (reactionData.hasUserReacted) {
      onRemoveReaction(commentId, emoji);
    } else {
      onReaction(commentId, emoji);
    }
  };

  const totalReactions = reactions.reduce((sum, r) => sum + r.count, 0);

  return (
    <div 
      className={cn(
        'flex items-center gap-1 transition-all duration-200',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Quick reaction buttons - always visible on hover */}
      <div className={cn(
        'flex items-center gap-1 transition-all duration-200 overflow-hidden',
        isHovered ? 'max-w-[300px] opacity-100' : 'max-w-0 opacity-0'
      )}>
        {QUICK_REACTIONS.map(({ emoji, label }) => {
          const reactionData = getReactionData(emoji);
          return (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              onClick={() => handleReactionClick(emoji)}
              className={cn(
                'h-8 w-8 p-0 hover:scale-110 transition-all duration-150',
                reactionData.hasUserReacted && 'bg-primary/10 scale-110'
              )}
              title={`${label} (${reactionData.count})`}
            >
              <span className="text-base">{emoji}</span>
            </Button>
          );
        })}
      </div>

      {/* Active reactions display */}
      {reactions.length > 0 && (
        <div className="flex items-center gap-1">
          {reactions.slice(0, 3).map((reaction) => (
            <Button
              key={reaction.emoji}
              variant={reaction.hasUserReacted ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleReactionClick(reaction.emoji)}
              className={cn(
                'h-7 px-2 gap-1 hover:scale-105 transition-all duration-150',
                reaction.hasUserReacted && 'bg-primary/20 border-primary/30'
              )}
              title={`${reaction.count} reaction${reaction.count !== 1 ? 's' : ''}`}
            >
              <span className="text-sm">{reaction.emoji}</span>
              <span className="text-xs font-medium">{reaction.count}</span>
            </Button>
          ))}
          
          {/* Show more reactions indicator */}
          {reactions.length > 3 && (
            <Badge variant="outline" className="text-xs px-2">
              +{reactions.length - 3} more
            </Badge>
          )}
        </div>
      )}

      {/* Add reaction button when no reactions */}
      {reactions.length === 0 && !isHovered && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
        >
          <span className="text-sm">😊</span>
          <span className="text-xs ml-1">React</span>
        </Button>
      )}

      {/* Total reactions summary */}
      {totalReactions > 0 && (
        <div className="text-xs text-muted-foreground ml-1">
          {totalReactions} reaction{totalReactions !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};