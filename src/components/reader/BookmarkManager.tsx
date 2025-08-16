import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bookmark, Plus, Trash2, Edit, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface BookmarkData {
  id: string;
  chapterId: string;
  pageNumber: number;
  title: string;
  note?: string;
  timestamp: number;
  tags: string[];
}

interface BookmarkManagerProps {
  chapterId: string;
  currentPage: number;
  bookmarks: BookmarkData[];
  onAddBookmark: (bookmark: Omit<BookmarkData, 'id' | 'timestamp'>) => void;
  onUpdateBookmark: (id: string, bookmark: Partial<BookmarkData>) => void;
  onDeleteBookmark: (id: string) => void;
  onGoToBookmark: (bookmark: BookmarkData) => void;
}

export const BookmarkManager: React.FC<BookmarkManagerProps> = ({
  chapterId,
  currentPage,
  bookmarks,
  onAddBookmark,
  onUpdateBookmark,
  onDeleteBookmark,
  onGoToBookmark
}) => {
  const [isAddingBookmark, setIsAddingBookmark] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newBookmark, setNewBookmark] = useState({
    title: '',
    note: '',
    tags: [] as string[]
  });

  const chapterBookmarks = bookmarks.filter(b => b.chapterId === chapterId);
  const filteredBookmarks = chapterBookmarks.filter(bookmark =>
    bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bookmark.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bookmark.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddBookmark = () => {
    if (!newBookmark.title.trim()) return;

    onAddBookmark({
      chapterId,
      pageNumber: currentPage,
      title: newBookmark.title,
      note: newBookmark.note || undefined,
      tags: newBookmark.tags
    });

    setNewBookmark({ title: '', note: '', tags: [] });
    setIsAddingBookmark(false);
  };

  const handleTagInput = (value: string, isEdit = false, bookmarkId?: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(Boolean);
    
    if (isEdit && bookmarkId) {
      onUpdateBookmark(bookmarkId, { tags });
    } else {
      setNewBookmark(prev => ({ ...prev, tags }));
    }
  };

  const currentPageBookmark = chapterBookmarks.find(b => b.pageNumber === currentPage);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5" />
          <h3 className="font-semibold">Bookmarks</h3>
          <Badge variant="secondary">{chapterBookmarks.length}</Badge>
        </div>
        
        {!currentPageBookmark && (
          <Button
            size="sm"
            onClick={() => setIsAddingBookmark(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        )}
      </div>

      {currentPageBookmark && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-primary">
              <Bookmark className="h-4 w-4 fill-current" />
              Current page is bookmarked
            </div>
          </CardContent>
        </Card>
      )}

      {isAddingBookmark && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Add Bookmark</CardTitle>
            <CardDescription>Page {currentPage}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bookmark-title">Title</Label>
              <Input
                id="bookmark-title"
                value={newBookmark.title}
                onChange={(e) => setNewBookmark(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Bookmark title..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bookmark-note">Note (optional)</Label>
              <Textarea
                id="bookmark-note"
                value={newBookmark.note}
                onChange={(e) => setNewBookmark(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Add a note..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bookmark-tags">Tags (comma separated)</Label>
              <Input
                id="bookmark-tags"
                value={newBookmark.tags.join(', ')}
                onChange={(e) => handleTagInput(e.target.value)}
                placeholder="action, favorite, important..."
              />
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddBookmark}>
                Save
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setIsAddingBookmark(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {chapterBookmarks.length > 0 && (
        <>
          <div className="space-y-2">
            <Label htmlFor="bookmark-search">Search Bookmarks</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="bookmark-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search bookmarks..."
                className="pl-8"
              />
            </div>
          </div>

          <ScrollArea className="h-64">
            <div className="space-y-2">
              {filteredBookmarks.map((bookmark) => (
                <Card key={bookmark.id} className="cursor-pointer hover:bg-muted/50">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex-1 space-y-1"
                        onClick={() => onGoToBookmark(bookmark)}
                      >
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{bookmark.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            Page {bookmark.pageNumber}
                          </Badge>
                        </div>
                        
                        {bookmark.note && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {bookmark.note}
                          </p>
                        )}
                        
                        {bookmark.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {bookmark.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(bookmark.timestamp, { addSuffix: true })}
                        </p>
                      </div>

                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingBookmark(bookmark.id);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteBookmark(bookmark.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {editingBookmark === bookmark.id && (
                      <div className="mt-3 space-y-2 border-t pt-3">
                        <Input
                          value={bookmark.title}
                          onChange={(e) => onUpdateBookmark(bookmark.id, { title: e.target.value })}
                          placeholder="Title..."
                        />
                        <Textarea
                          value={bookmark.note || ''}
                          onChange={(e) => onUpdateBookmark(bookmark.id, { note: e.target.value })}
                          placeholder="Note..."
                          rows={2}
                        />
                        <Input
                          value={bookmark.tags.join(', ')}
                          onChange={(e) => handleTagInput(e.target.value, true, bookmark.id)}
                          placeholder="Tags..."
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => setEditingBookmark(null)}>
                            Done
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {filteredBookmarks.length === 0 && searchTerm && (
                <div className="text-center py-4 text-muted-foreground">
                  No bookmarks found matching "{searchTerm}"
                </div>
              )}
            </div>
          </ScrollArea>
        </>
      )}

      {chapterBookmarks.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No bookmarks in this chapter</p>
          <p className="text-sm">Add bookmarks to save interesting pages</p>
        </div>
      )}
    </div>
  );
};