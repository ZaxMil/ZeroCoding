import React from 'react';
import { Lock, Clock } from 'lucide-react';

interface ChapterIconProps {
  isLocked: boolean;
  isLastOpened: boolean;
  className?: string;
}

export const ChapterIcon: React.FC<ChapterIconProps> = ({ 
  isLocked, 
  isLastOpened, 
  className = "h-4 w-4" 
}) => {
  // Priority: Lock icon takes precedence over clock icon
  if (isLocked) {
    return <Lock className={`${className} text-muted-foreground`} />;
  }
  
  if (isLastOpened) {
    return <Clock className={`${className} text-primary`} />;
  }
  
  // No icon if neither locked nor last opened
  return null;
};

interface ChapterListItemProps {
  chapter: {
    id: string;
    chapter_number: number;
    title: string;
    is_locked?: boolean;
  };
  isLastOpened?: boolean;
  onChapterClick: (chapterNumber: number) => void;
  children?: React.ReactNode;
}

export const ChapterListItem: React.FC<ChapterListItemProps> = ({
  chapter,
  isLastOpened = false,
  onChapterClick,
  children
}) => {
  return (
    <div 
      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => onChapterClick(chapter.chapter_number)}
    >
      <div className="flex items-center gap-3">
        <ChapterIcon 
          isLocked={chapter.is_locked || false}
          isLastOpened={isLastOpened}
        />
        <div>
          <h4 className="font-medium">Chapter {chapter.chapter_number}</h4>
          <p className="text-sm text-muted-foreground">{chapter.title}</p>
        </div>
      </div>
      {children}
    </div>
  );
};