import React from 'react';
import { EmojiReactionSystem } from '@/components/comments/EmojiReactionSystem';

export interface ChapterRatingProps {
  targetId: string;
  targetTitle: string;
  className?: string;
}

export const ChapterRating: React.FC<ChapterRatingProps> = ({ 
  targetId, 
  targetTitle, 
  className = "" 
}) => {
  return (
    <EmojiReactionSystem
      targetType="chapter"
      targetId={targetId}
      targetTitle={targetTitle}
      className={className}
    />
  );
};