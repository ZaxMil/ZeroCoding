import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Book, FileText, Bookmark, User, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePaginatedSeries } from '@/hooks/usePaginatedSeries';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useReadingNotes } from '@/hooks/useReadingNotes';
import { formatDistanceToNow } from 'date-fns';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
  
  const { series, fetchSeries } = usePaginatedSeries(20);
  const { bookmarks, searchBookmarks } = useBookmarks();
  const { notes, searchNotes } = useReadingNotes();

  // Search results
  const seriesResults = series.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10);

  const bookmarkResults = searchQuery ? searchBookmarks(searchQuery).slice(0, 10) : [];
  const noteResults = searchQuery ? searchNotes(searchQuery).slice(0, 10) : [];

  const totalResults = seriesResults.length + bookmarkResults.length + noteResults.length;

  useEffect(() => {
    if (isOpen) {
      fetchSeries(1, { search: searchQuery });
    }
  }, [searchQuery, isOpen]);

  const handleSeriesClick = (seriesId: string) => {
    navigate(`/series/${seriesId}`);
    onClose();
  };

  const handleBookmarkClick = (bookmark: any) => {
    navigate(`/reader/${bookmark.chapterId}?page=${bookmark.pageNumber}`);
    onClose();
  };

  const handleNoteClick = (note: any) => {
    navigate(`/reader/${note.chapterId}?page=${note.pageNumber}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            <CardTitle>Search Everything</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Search series, bookmarks, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <div className="text-sm text-muted-foreground">
                Found {totalResults} results
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mx-4 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="series">Series</TabsTrigger>
              <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-96 px-4">
              <TabsContent value="all" className="space-y-4 mt-0">
                {/* Series Results */}
                {seriesResults.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Book className="h-4 w-4" />
                      Series ({seriesResults.length})
                    </div>
                    {seriesResults.map((series) => (
                      <Card 
                        key={series.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSeriesClick(series.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <img 
                              src={series.cover_image_url} 
                              alt={series.title}
                              className="w-12 h-16 object-cover rounded"
                            />
                            <div className="flex-1 space-y-1">
                              <h4 className="font-medium text-sm">{series.title}</h4>
                              {series.author && (
                                <p className="text-xs text-muted-foreground">by {series.author}</p>
                              )}
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {series.chapter_count} chapters
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {series.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Bookmark Results */}
                {bookmarkResults.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Bookmark className="h-4 w-4" />
                      Bookmarks ({bookmarkResults.length})
                    </div>
                    {bookmarkResults.map((bookmark) => (
                      <Card 
                        key={bookmark.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleBookmarkClick(bookmark)}
                      >
                        <CardContent className="p-3">
                          <div className="space-y-1">
                            <h4 className="font-medium text-sm">{bookmark.title}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Page {bookmark.pageNumber}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(bookmark.timestamp, { addSuffix: true })}
                              </span>
                            </div>
                            {bookmark.note && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {bookmark.note}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Note Results */}
                {noteResults.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4" />
                      Notes ({noteResults.length})
                    </div>
                    {noteResults.map((note) => (
                      <Card 
                        key={note.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleNoteClick(note)}
                      >
                        <CardContent className="p-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Page {note.pageNumber}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {note.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(note.timestamp, { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm line-clamp-2">{note.content}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {searchQuery && totalResults === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No results found for "{searchQuery}"</p>
                    <p className="text-sm">Try different keywords or browse categories</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="series" className="space-y-2 mt-0">
                {seriesResults.map((series) => (
                  <Card 
                    key={series.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSeriesClick(series.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <img 
                          src={series.cover_image_url} 
                          alt={series.title}
                          className="w-16 h-20 object-cover rounded"
                        />
                        <div className="flex-1 space-y-2">
                          <h4 className="font-medium">{series.title}</h4>
                          {series.author && (
                            <p className="text-sm text-muted-foreground">by {series.author}</p>
                          )}
                          {series.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {series.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {series.chapter_count} chapters
                            </Badge>
                            <Badge variant="outline">
                              {series.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="bookmarks" className="space-y-2 mt-0">
                {bookmarkResults.map((bookmark) => (
                  <Card 
                    key={bookmark.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleBookmarkClick(bookmark)}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <h4 className="font-medium">{bookmark.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            Page {bookmark.pageNumber}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(bookmark.timestamp, { addSuffix: true })}
                          </span>
                        </div>
                        {bookmark.note && (
                          <p className="text-sm text-muted-foreground">
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="notes" className="space-y-2 mt-0">
                {noteResults.map((note) => (
                  <Card 
                    key={note.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleNoteClick(note)}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            Page {note.pageNumber}
                          </Badge>
                          <Badge variant="secondary">
                            {note.type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(note.timestamp, { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm">{note.content}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};