import React from 'react';
import { EnhancedUnifiedCommentSystem } from '@/components/comments/EnhancedUnifiedCommentSystem';

interface SeriesCommentsProps {
  seriesId: string;
  seriesTitle: string;
}

export const SeriesComments: React.FC<SeriesCommentsProps> = ({ seriesId, seriesTitle }) => {
  return (
    <EnhancedUnifiedCommentSystem
      targetType="series"
      targetId={seriesId}
      targetTitle={seriesTitle}
      showRating={true}
    />
  );
};