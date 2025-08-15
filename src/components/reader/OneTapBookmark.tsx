import { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface BookmarkData {
  chapterId: string;
  pageNumber: number;
  timestamp: number;
  labels: string[];
  note?: string;
}

interface OneTapBookmarkProps {
  chapterId: string;
  pageNumber: number;
  className?: string;
}

export const OneTapBookmark = ({ chapterId, pageNumber, className }: OneTapBookmarkProps) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showLabelDialog, setShowLabelDialog] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Check if current page is bookmarked
    const bookmarks: BookmarkData[] = JSON.parse(localStorage.getItem('manga_bookmarks') || '[]');
    const bookmark = bookmarks.find(b => b.chapterId === chapterId && b.pageNumber === pageNumber);
    setIsBookmarked(!!bookmark);
    
    if (bookmark) {
      setSelectedLabels(bookmark.labels || []);
    }

    // Load available labels
    const allLabels = bookmarks.flatMap(b => b.labels || []);
    const uniqueLabels = Array.from(new Set(allLabels));
    setAvailableLabels(uniqueLabels);
  }, [chapterId, pageNumber]);

  const quickBookmark = () => {
    const bookmarks: BookmarkData[] = JSON.parse(localStorage.getItem('manga_bookmarks') || '[]');
    const existingIndex = bookmarks.findIndex(b => b.chapterId === chapterId && b.pageNumber === pageNumber);

    if (existingIndex >= 0) {
      // Remove bookmark
      bookmarks.splice(existingIndex, 1);
      setIsBookmarked(false);
      setSelectedLabels([]);
      toast({
        title: "Bookmark removed",
        description: `Page ${pageNumber} bookmark removed`,
      });
    } else {
      // Add bookmark
      const newBookmark: BookmarkData = {
        chapterId,
        pageNumber,
        timestamp: Date.now(),
        labels: []
      };
      bookmarks.push(newBookmark);
      setIsBookmarked(true);
      toast({
        title: "Page bookmarked",
        description: `Page ${pageNumber} saved to bookmarks`,
      });
    }

    localStorage.setItem('manga_bookmarks', JSON.stringify(bookmarks));
  };

  const addLabel = () => {
    if (!newLabel.trim()) return;
    
    const bookmarks: BookmarkData[] = JSON.parse(localStorage.getItem('manga_bookmarks') || '[]');
    const bookmarkIndex = bookmarks.findIndex(b => b.chapterId === chapterId && b.pageNumber === pageNumber);
    
    if (bookmarkIndex >= 0) {
      const bookmark = bookmarks[bookmarkIndex];
      if (!bookmark.labels.includes(newLabel)) {
        bookmark.labels.push(newLabel);
        setSelectedLabels(prev => [...prev, newLabel]);
        
        if (!availableLabels.includes(newLabel)) {
          setAvailableLabels(prev => [...prev, newLabel]);
        }
        
        localStorage.setItem('manga_bookmarks', JSON.stringify(bookmarks));
        toast({
          title: "Label added",
          description: `Added "${newLabel}" to bookmark`,
        });
      }
    }
    
    setNewLabel('');
  };

  const removeLabel = (label: string) => {
    const bookmarks: BookmarkData[] = JSON.parse(localStorage.getItem('manga_bookmarks') || '[]');
    const bookmarkIndex = bookmarks.findIndex(b => b.chapterId === chapterId && b.pageNumber === pageNumber);
    
    if (bookmarkIndex >= 0) {
      bookmarks[bookmarkIndex].labels = bookmarks[bookmarkIndex].labels.filter(l => l !== label);
      setSelectedLabels(prev => prev.filter(l => l !== label));
      localStorage.setItem('manga_bookmarks', JSON.stringify(bookmarks));
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={quickBookmark}
        className="relative"
      >
        {isBookmarked ? (
          <BookmarkCheck className="h-4 w-4 text-yellow-500" />
        ) : (
          <Bookmark className="h-4 w-4" />
        )}
        {selectedLabels.length > 0 && (
          <Badge variant="secondary" className="ml-1 h-4 text-xs">
            {selectedLabels.length}
          </Badge>
        )}
      </Button>

      {isBookmarked && (
        <Dialog open={showLabelDialog} onOpenChange={setShowLabelDialog}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Tag className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bookmark Labels</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Current Labels</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedLabels.map(label => (
                    <Badge 
                      key={label} 
                      variant="secondary" 
                      className="cursor-pointer"
                      onClick={() => removeLabel(label)}
                    >
                      {label} ×
                    </Badge>
                  ))}
                  {selectedLabels.length === 0 && (
                    <p className="text-sm text-muted-foreground">No labels added</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Available Labels</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableLabels
                    .filter(label => !selectedLabels.includes(label))
                    .map(label => (
                      <Badge 
                        key={label} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => {
                          const bookmarks: BookmarkData[] = JSON.parse(localStorage.getItem('manga_bookmarks') || '[]');
                          const bookmarkIndex = bookmarks.findIndex(b => b.chapterId === chapterId && b.pageNumber === pageNumber);
                          if (bookmarkIndex >= 0) {
                            bookmarks[bookmarkIndex].labels.push(label);
                            setSelectedLabels(prev => [...prev, label]);
                            localStorage.setItem('manga_bookmarks', JSON.stringify(bookmarks));
                          }
                        }}
                      >
                        + {label}
                      </Badge>
                    ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add new label..."
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addLabel()}
                />
                <Button onClick={addLabel} size="sm">
                  Add
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Hook for bookmark management
export const useBookmarkManager = () => {
  const getBookmarks = (): BookmarkData[] => {
    return JSON.parse(localStorage.getItem('manga_bookmarks') || '[]');
  };

  const getBookmarksByLabel = (label: string): BookmarkData[] => {
    const bookmarks = getBookmarks();
    return bookmarks.filter(b => b.labels.includes(label));
  };

  const getAllLabels = (): string[] => {
    const bookmarks = getBookmarks();
    const allLabels = bookmarks.flatMap(b => b.labels || []);
    return Array.from(new Set(allLabels));
  };

  return { getBookmarks, getBookmarksByLabel, getAllLabels };
};