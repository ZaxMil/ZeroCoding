import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Search, 
  MoreHorizontal, 
  Trash2, 
  Eye, 
  RefreshCw,
  MessageSquare,
  Clock,
  User,
  Pin,
  Flag,
  Shield,
  ExternalLink,
  Filter
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface UnifiedComment {
  comment_type: 'chapter' | 'series';
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  parent_id: string | null;
  like_count: number;
  is_pinned: boolean;
  is_flagged: boolean;
  status: string;
  chapter_id: string | null;
  series_id: string;
  chapter_title: string | null;
  chapter_number: number | null;
  series_title: string;
  user_profile?: {
    username: string;
    email: string;
    role: string;
  };
}

interface CommentStats {
  total: number;
  today: number;
  thisWeek: number;
  flagged: number;
  series: number;
  chapters: number;
}

export const EnhancedCommentsManager = () => {
  const [comments, setComments] = useState<UnifiedComment[]>([]);
  const [stats, setStats] = useState<CommentStats>({
    total: 0,
    today: 0,
    thisWeek: 0,
    flagged: 0,
    series: 0,
    chapters: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [seriesFilter, setSeriesFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedComment, setSelectedComment] = useState<UnifiedComment | null>(null);
  const [seriesList, setSeriesList] = useState<Array<{id: string, title: string}>>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
    fetchSeriesList();
  }, []);

  const fetchSeriesList = async () => {
    try {
      const { data, error } = await supabase
        .from('manga_meta')
        .select('id, title')
        .order('title');
      
      if (error) throw error;
      setSeriesList(data || []);
    } catch (error: any) {
      console.error('Error fetching series list:', error);
    }
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      
      // Use the unified view we created
      const { data: commentsData, error } = await supabase
        .from('unified_comments_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles for all comments
      const userIds = Array.from(new Set((commentsData || []).map(c => c.user_id)));
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, username, email, role')
        .in('user_id', userIds);

      // Create profiles map
      const profilesMap = (profilesData || []).reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>);

      // Combine comments with user profiles
      const commentsWithProfiles: UnifiedComment[] = (commentsData || []).map(comment => ({
        ...comment,
        comment_type: comment.comment_type as 'chapter' | 'series',
        user_profile: profilesMap[comment.user_id] || {
          username: null,
          email: 'unknown@example.com',
          role: 'member'
        }
      }));
      
      setComments(commentsWithProfiles);
      
      // Calculate stats
      const total = commentsWithProfiles.length;
      const today = commentsWithProfiles.filter(c => 
        new Date(c.created_at).toDateString() === new Date().toDateString()
      ).length;
      const thisWeek = commentsWithProfiles.filter(c => {
        const commentDate = new Date(c.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return commentDate >= weekAgo;
      }).length;
      const flagged = commentsWithProfiles.filter(c => c.is_flagged).length;
      const series = commentsWithProfiles.filter(c => c.comment_type === 'series').length;
      const chapters = commentsWithProfiles.filter(c => c.comment_type === 'chapter').length;

      setStats({
        total,
        today,
        thisWeek,
        flagged,
        series,
        chapters,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const moderateComment = async (commentId: string, action: 'approve' | 'reject' | 'delete' | 'pin' | 'unpin') => {
    try {
      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;

      const tableName = comment.comment_type === 'chapter' ? 'comments' : 'series_comments';
      
      let updateData: any = {};
      
      switch (action) {
        case 'approve':
          updateData = { status: 'active', is_flagged: false };
          break;
        case 'reject':
          updateData = { status: 'hidden' };
          break;
        case 'pin':
          updateData = { is_pinned: true };
          break;
        case 'unpin':
          updateData = { is_pinned: false };
          break;
        case 'delete':
          const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .eq('id', commentId);
          
          if (deleteError) throw deleteError;
          
          toast({
            title: "Success",
            description: "Comment deleted successfully",
          });
          fetchComments();
          return;
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', commentId);

      if (error) throw error;

      // Log admin action
      const { error: logError } = await supabase
        .from('admin_actions')
        .insert({
          action_type: `comment_${action}`,
          admin_user_id: (await supabase.auth.getUser()).data.user?.id,
          description: `${action.charAt(0).toUpperCase() + action.slice(1)} comment`,
          target_type: 'comment',
          target_id: commentId
        });

      if (logError) console.error('Failed to log admin action:', logError);

      toast({
        title: "Success",
        description: `Comment ${action === 'pin' ? 'pinned' : action === 'unpin' ? 'unpinned' : action + 'd'} successfully`,
      });
      fetchComments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredComments = comments.filter(comment => {
    const matchesSearch = 
      comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.series_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.chapter_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.user_profile?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.user_profile?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || comment.comment_type === typeFilter;
    const matchesSeries = seriesFilter === "all" || comment.series_id === seriesFilter;
    const matchesStatus = statusFilter === "all" || comment.status === statusFilter;
    
    return matchesSearch && matchesType && matchesSeries && matchesStatus;
  });

  const getCommentHierarchy = () => {
    // Group comments by series
    const hierarchy: Record<string, {
      series: any;
      seriesComments: UnifiedComment[];
      chapters: Record<string, {
        chapter: any;
        comments: UnifiedComment[];
      }>;
    }> = {};

    filteredComments.forEach(comment => {
      if (!hierarchy[comment.series_id]) {
        hierarchy[comment.series_id] = {
          series: {
            id: comment.series_id,
            title: comment.series_title
          },
          seriesComments: [],
          chapters: {}
        };
      }

      if (comment.comment_type === 'series') {
        hierarchy[comment.series_id].seriesComments.push(comment);
      } else if (comment.chapter_id) {
        if (!hierarchy[comment.series_id].chapters[comment.chapter_id]) {
          hierarchy[comment.series_id].chapters[comment.chapter_id] = {
            chapter: {
              id: comment.chapter_id,
              title: comment.chapter_title,
              number: comment.chapter_number
            },
            comments: []
          };
        }
        hierarchy[comment.series_id].chapters[comment.chapter_id].comments.push(comment);
      }
    });

    return hierarchy;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hierarchy = getCommentHierarchy();

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.thisWeek}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Flagged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.flagged}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Series</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.series}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chapters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.chapters}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Comments Management</CardTitle>
          <CardDescription>Moderate and manage user comments across series and chapters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search comments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="series">Series Comments</SelectItem>
                <SelectItem value="chapter">Chapter Comments</SelectItem>
              </SelectContent>
            </Select>

            <Select value={seriesFilter} onValueChange={setSeriesFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by series" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Series</SelectItem>
                {seriesList.map(series => (
                  <SelectItem key={series.id} value={series.id}>
                    {series.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={fetchComments} variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Hierarchical Comments Display */}
          <div className="space-y-6">
            {Object.entries(hierarchy).map(([seriesId, data]) => (
              <Card key={seriesId} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Link 
                        to={`/series/${seriesId}`}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        {data.series.title}
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {data.seriesComments.length} series comments
                      </Badge>
                      <Badge variant="outline">
                        {Object.values(data.chapters).reduce((sum, ch) => sum + ch.comments.length, 0)} chapter comments
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Series Comments */}
                  {data.seriesComments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Series Comments ({data.seriesComments.length})
                      </h4>
                      <div className="space-y-2">
                        {data.seriesComments.map(comment => (
                          <div key={comment.id} className="border rounded-lg p-3 bg-background/50">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <User className="h-3 w-3" />
                                  <span className="text-sm font-medium">
                                    {comment.user_profile?.username || comment.user_profile?.email?.split('@')[0] || 'Anonymous'}
                                  </span>
                                  {comment.user_profile?.role === 'admin' && (
                                    <Badge variant="destructive" className="text-xs">
                                      <Shield className="h-3 w-3 mr-1" />
                                      Admin
                                    </Badge>
                                  )}
                                  {comment.is_pinned && (
                                    <Badge variant="outline" className="text-xs">
                                      <Pin className="h-3 w-3 mr-1" />
                                      Pinned
                                    </Badge>
                                  )}
                                  {comment.is_flagged && (
                                    <Badge variant="destructive" className="text-xs">
                                      <Flag className="h-3 w-3 mr-1" />
                                      Flagged
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {comment.content}
                                </p>
                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                  <span>{comment.like_count} likes</span>
                                  <span>Status: {comment.status}</span>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => setSelectedComment(comment)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => moderateComment(comment.id, comment.is_pinned ? 'unpin' : 'pin')}>
                                    <Pin className="h-4 w-4 mr-2" />
                                    {comment.is_pinned ? 'Unpin' : 'Pin'}
                                  </DropdownMenuItem>
                                  {comment.status !== 'active' && (
                                    <DropdownMenuItem onClick={() => moderateComment(comment.id, 'approve')}>
                                      <Shield className="h-4 w-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => moderateComment(comment.id, 'reject')}>
                                    <Flag className="h-4 w-4 mr-2" />
                                    Hide
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => moderateComment(comment.id, 'delete')}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chapter Comments */}
                  {Object.entries(data.chapters).map(([chapterId, chapterData]) => (
                    <div key={chapterId}>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Chapter {chapterData.chapter.number}: {chapterData.chapter.title} ({chapterData.comments.length})
                      </h4>
                      <div className="space-y-2">
                        {chapterData.comments.map(comment => (
                          <div key={comment.id} className="border rounded-lg p-3 bg-background/30">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <User className="h-3 w-3" />
                                  <span className="text-sm font-medium">
                                    {comment.user_profile?.username || comment.user_profile?.email?.split('@')[0] || 'Anonymous'}
                                  </span>
                                  {comment.user_profile?.role === 'admin' && (
                                    <Badge variant="destructive" className="text-xs">
                                      <Shield className="h-3 w-3 mr-1" />
                                      Admin
                                    </Badge>
                                  )}
                                  {comment.is_pinned && (
                                    <Badge variant="outline" className="text-xs">
                                      <Pin className="h-3 w-3 mr-1" />
                                      Pinned
                                    </Badge>
                                  )}
                                  {comment.is_flagged && (
                                    <Badge variant="destructive" className="text-xs">
                                      <Flag className="h-3 w-3 mr-1" />
                                      Flagged
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {comment.content}
                                </p>
                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                  <span>{comment.like_count} likes</span>
                                  <span>Status: {comment.status}</span>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => setSelectedComment(comment)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => moderateComment(comment.id, comment.is_pinned ? 'unpin' : 'pin')}>
                                    <Pin className="h-4 w-4 mr-2" />
                                    {comment.is_pinned ? 'Unpin' : 'Pin'}
                                  </DropdownMenuItem>
                                  {comment.status !== 'active' && (
                                    <DropdownMenuItem onClick={() => moderateComment(comment.id, 'approve')}>
                                      <Shield className="h-4 w-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => moderateComment(comment.id, 'reject')}>
                                    <Flag className="h-4 w-4 mr-2" />
                                    Hide
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => moderateComment(comment.id, 'delete')}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comment Details Dialog */}
      <Dialog open={!!selectedComment} onOpenChange={() => setSelectedComment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comment Details</DialogTitle>
            <DialogDescription>
              Full comment details and metadata
            </DialogDescription>
          </DialogHeader>
          {selectedComment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type & Location</label>
                <div className="flex gap-2">
                  <Badge variant={selectedComment.comment_type === 'series' ? 'default' : 'secondary'}>
                    {selectedComment.comment_type === 'series' ? 'Series Comment' : 'Chapter Comment'}
                  </Badge>
                  {selectedComment.chapter_id && (
                    <Badge variant="outline">
                      Chapter {selectedComment.chapter_number}
                    </Badge>
                  )}
                </div>
                <p className="text-sm">
                  <strong>Series:</strong> {selectedComment.series_title}
                </p>
                {selectedComment.chapter_title && (
                  <p className="text-sm">
                    <strong>Chapter:</strong> {selectedComment.chapter_title}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">User</label>
                <p className="text-sm">
                  <strong>Username:</strong> {selectedComment.user_profile?.username || 'Not set'}<br/>
                  <strong>Email:</strong> {selectedComment.user_profile?.email}<br/>
                  <strong>Role:</strong> {selectedComment.user_profile?.role}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Comment</label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{selectedComment.content}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stats</label>
                  <p className="text-sm text-muted-foreground">
                    <strong>Likes:</strong> {selectedComment.like_count}<br/>
                    <strong>Status:</strong> {selectedComment.status}<br/>
                    <strong>Pinned:</strong> {selectedComment.is_pinned ? 'Yes' : 'No'}<br/>
                    <strong>Flagged:</strong> {selectedComment.is_flagged ? 'Yes' : 'No'}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Timestamps</label>
                  <p className="text-sm text-muted-foreground">
                    <strong>Created:</strong> {new Date(selectedComment.created_at).toLocaleString()}<br/>
                    <strong>Updated:</strong> {new Date(selectedComment.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};