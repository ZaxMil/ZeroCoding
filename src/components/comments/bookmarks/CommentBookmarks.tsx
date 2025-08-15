import React, { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck, Star, Trash2, Search, Filter, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface BookmarkedComment {
  id: string;
  comment_id: string;
  user_id: string;
  folder_id?: string;
  notes?: string;
  created_at: string;
  comment: {
    id: string;
    content: string;
    author: {
      id: string;
      name: string;
      avatar?: string;
    };
    created_at: string;
    reactions: Array<{ type: string; count: number }>;
    replies_count: number;
  };
  folder?: {
    id: string;
    name: string;
    color: string;
  };
}

interface BookmarkFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  user_id: string;
  created_at: string;
  bookmarks_count: number;
}

interface CommentBookmarksProps {
  userId: string;
  className?: string;
}

export const CommentBookmarks: React.FC<CommentBookmarksProps> = ({
  userId,
  className = ""
}) => {
  const [bookmarks, setBookmarks] = useState<BookmarkedComment[]>([]);
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'comment_date'>('newest');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#3b82f6');
  const { toast } = useToast();

  useEffect(() => {
    fetchBookmarks();
    fetchFolders();
  }, [userId]);

  const fetchBookmarks = async () => {
    try {
      // Mock data - replace with actual API call
      const mockBookmarks: BookmarkedComment[] = [
        {
          id: '1',
          comment_id: 'comment-1',
          user_id: userId,
          folder_id: 'folder-1',
          notes: 'Great insight about React hooks',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          comment: {
            id: 'comment-1',
            content: 'This is a really insightful comment about React performance optimizations...',
            author: {
              id: 'user-1',
              name: 'John Doe',
              avatar: '/avatars/john.jpg'
            },
            created_at: new Date(Date.now() - 172800000).toISOString(),
            reactions: [{ type: 'like', count: 15 }, { type: 'helpful', count: 8 }],
            replies_count: 3
          },
          folder: {
            id: 'folder-1',
            name: 'React Tips',
            color: '#3b82f6'
          }
        },
        {
          id: '2',
          comment_id: 'comment-2',
          user_id: userId,
          notes: 'Need to research this further',
          created_at: new Date(Date.now() - 259200000).toISOString(),
          comment: {
            id: 'comment-2',
            content: 'Here\'s an interesting approach to state management using Zustand...',
            author: {
              id: 'user-2',
              name: 'Jane Smith',
              avatar: '/avatars/jane.jpg'
            },
            created_at: new Date(Date.now() - 345600000).toISOString(),
            reactions: [{ type: 'like', count: 22 }],
            replies_count: 7
          }
        }
      ];

      setBookmarks(mockBookmarks);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      toast({
        title: "Error",
        description: "Failed to load bookmarks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      // Mock data - replace with actual API call
      const mockFolders: BookmarkFolder[] = [
        {
          id: 'folder-1',
          name: 'React Tips',
          description: 'Useful React development tips and tricks',
          color: '#3b82f6',
          user_id: userId,
          created_at: new Date(Date.now() - 604800000).toISOString(),
          bookmarks_count: 12
        },
        {
          id: 'folder-2',
          name: 'Design Patterns',
          description: 'Software design patterns and best practices',
          color: '#10b981',
          user_id: userId,
          created_at: new Date(Date.now() - 1209600000).toISOString(),
          bookmarks_count: 8
        }
      ];

      setFolders(mockFolders);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const newFolder: BookmarkFolder = {
        id: `folder-${Date.now()}`,
        name: newFolderName,
        description: newFolderDescription,
        color: newFolderColor,
        user_id: userId,
        created_at: new Date().toISOString(),
        bookmarks_count: 0
      };

      setFolders(prev => [...prev, newFolder]);
      setNewFolderName('');
      setNewFolderDescription('');
      setNewFolderColor('#3b82f6');
      setShowCreateFolder(false);

      toast({
        title: "Success",
        description: "Folder created successfully"
      });
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive"
      });
    }
  };

  const removeBookmark = async (bookmarkId: string) => {
    try {
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
      toast({
        title: "Success",
        description: "Bookmark removed successfully"
      });
    } catch (error) {
      console.error('Error removing bookmark:', error);
      toast({
        title: "Error",
        description: "Failed to remove bookmark",
        variant: "destructive"
      });
    }
  };

  const filteredBookmarks = bookmarks
    .filter(bookmark => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const contentMatch = bookmark.comment.content.toLowerCase().includes(query);
        const authorMatch = bookmark.comment.author.name.toLowerCase().includes(query);
        const notesMatch = bookmark.notes?.toLowerCase().includes(query);
        if (!contentMatch && !authorMatch && !notesMatch) return false;
      }

      // Folder filter
      if (selectedFolder !== 'all') {
        if (selectedFolder === 'unorganized') {
          return !bookmark.folder_id;
        } else {
          return bookmark.folder_id === selectedFolder;
        }
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'comment_date':
          return new Date(b.comment.created_at).getTime() - new Date(a.comment.created_at).getTime();
        default:
          return 0;
      }
    });

  if (loading) {
    return <div className="animate-pulse">Loading bookmarks...</div>;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              Bookmarked Comments ({bookmarks.length})
            </CardTitle>
            <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="folder-name">Folder Name</Label>
                    <Input
                      id="folder-name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Enter folder name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="folder-description">Description</Label>
                    <Textarea
                      id="folder-description"
                      value={newFolderDescription}
                      onChange={(e) => setNewFolderDescription(e.target.value)}
                      placeholder="Optional description"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="folder-color">Color</Label>
                    <Input
                      id="folder-color"
                      type="color"
                      value={newFolderColor}
                      onChange={(e) => setNewFolderColor(e.target.value)}
                      className="w-20 h-10"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createFolder}>
                      Create Folder
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedFolder} onValueChange={setSelectedFolder}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Folders</SelectItem>
                <SelectItem value="unorganized">Unorganized</SelectItem>
                <Separator />
                {folders.map(folder => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: folder.color }}
                      />
                      {folder.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="comment_date">Comment date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bookmarks List */}
          <div className="space-y-4">
            {filteredBookmarks.length === 0 ? (
              <Card className="p-8 text-center">
                <Bookmark className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h4 className="text-lg font-semibold text-foreground mb-2">No Bookmarks Found</h4>
                <p className="text-muted-foreground text-sm">
                  {searchQuery || selectedFolder !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'Start bookmarking comments to build your collection!'}
                </p>
              </Card>
            ) : (
              filteredBookmarks.map(bookmark => (
                <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={bookmark.comment.author.avatar} />
                        <AvatarFallback>
                          {bookmark.comment.author.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{bookmark.comment.author.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(bookmark.comment.created_at))} ago
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {bookmark.folder && (
                              <Badge 
                                variant="outline" 
                                style={{ borderColor: bookmark.folder.color, color: bookmark.folder.color }}
                              >
                                {bookmark.folder.name}
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBookmark(bookmark.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-foreground leading-relaxed">
                          {bookmark.comment.content}
                        </p>
                        
                        {bookmark.notes && (
                          <div className="bg-muted/50 p-3 rounded-md">
                            <p className="text-xs text-muted-foreground mb-1">Your notes:</p>
                            <p className="text-sm">{bookmark.notes}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {bookmark.comment.reactions.reduce((sum, r) => sum + r.count, 0)} reactions
                          </span>
                          <span>{bookmark.comment.replies_count} replies</span>
                          <span>
                            Bookmarked {formatDistanceToNow(new Date(bookmark.created_at))} ago
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};