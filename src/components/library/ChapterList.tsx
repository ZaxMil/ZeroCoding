import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Eye, Calendar, Clock, Download, BookOpen, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Chapter {
  id: string;
  number: number;
  title: string;
  pages: number;
  upload_date: string;
  views: number;
  is_read: boolean;
  read_progress: number; // 0-100
  reading_time: number; // minutes
  file_size: number; // bytes
  file_url: string;
}

interface ChapterListProps {
  chapters: Chapter[];
  onChapterClick: (chapter: Chapter) => void;
  onMarkAsRead?: (chapterId: string) => void;
  onDownload?: (chapter: Chapter) => void;
  showProgress?: boolean;
  compact?: boolean;
}

export function ChapterList({ 
  chapters, 
  onChapterClick, 
  onMarkAsRead,
  onDownload,
  showProgress = true,
  compact = false 
}: ChapterListProps) {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const sortedChapters = [...chapters].sort((a, b) => 
    sortOrder === 'desc' ? b.number - a.number : a.number - b.number
  );

  if (!chapters.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No chapters available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Chapters ({chapters.length})
          </CardTitle>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          >
            {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="space-y-1">
          {sortedChapters.map((chapter, index) => (
            <div
              key={chapter.id}
              className={`group p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors ${
                chapter.is_read ? 'opacity-75' : ''
              }`}
              onClick={() => onChapterClick(chapter)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium text-sm">
                      Chapter {chapter.number}
                    </span>
                    
                    {chapter.is_read && (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Read
                      </Badge>
                    )}
                    
                    {chapter.read_progress > 0 && chapter.read_progress < 100 && (
                      <Badge variant="outline" className="text-xs">
                        {chapter.read_progress}% read
                      </Badge>
                    )}
                  </div>

                  {chapter.title && (
                    <h4 className="font-semibold text-sm mb-2 line-clamp-1">
                      {chapter.title}
                    </h4>
                  )}

                  {!compact && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {chapter.pages} pages
                      </span>
                      
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {chapter.views.toLocaleString()} views
                      </span>
                      
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(chapter.upload_date), { addSuffix: true })}
                      </span>
                      
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {chapter.reading_time} min read
                      </span>
                      
                      <span>
                        {formatFileSize(chapter.file_size)}
                      </span>
                    </div>
                  )}

                  {showProgress && chapter.read_progress > 0 && chapter.read_progress < 100 && (
                    <div className="mt-2">
                      <Progress value={chapter.read_progress} className="h-1" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onMarkAsRead && !chapter.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(chapter.id);
                      }}
                      className="h-8 px-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {onDownload && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload(chapter);
                      }}
                      className="h-8 px-2"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}