import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Search, 
  Check, 
  X, 
  Flag,
  User,
  Calendar,
  Filter,
  MoreHorizontal,
  Pin,
  Trash2,
  Eye,
  BookOpen
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface CommentForModeration {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  is_flagged: boolean;
  flag_count: number;
  user_name: string;
  user_id: string;
  target_type: 'series' | 'chapter';
  target_id: string;
  series_title?: string;
  chapter_title?: string;
  chapter_number?: number;
  like_count: number;
  reply_count: number;
}

interface SeriesGroup {
  series_id: string;
  series_title: string;
  total_comments: number;
  pending_comments: number;
  flagged_comments: number;
  chapters: {
    chapter_id: string;
    chapter_title: string;
    chapter_number: number;
    comment_count: number;
  }[];
}

export const CommentsManager: React.FC = () => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentForModeration[]>([]);
  const [seriesGroups, setSeriesGroups] = useState<SeriesGroup[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'flagged'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'series' | 'chapter'>('all');

  useEffect(() => {
    fetchComments();
    fetchSeriesGroups();
  }, []);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for demonstration
      const mockComments: CommentForModeration[] = [
        {
          id: '1',
          content: 'This chapter was absolutely amazing! The character development is incredible.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'approved',
          is_flagged: false,
          flag_count: 0,
          user_name: 'MangaFan123',
          user_id: 'user1',
          target_type: 'chapter',
          target_id: 'chapter1',
          series_title: 'Epic Adventure Series',
          chapter_title: 'The Beginning',
          chapter_number: 1,
          like_count: 15,
          reply_count: 3
        },
        {
          id: '2',
          content: 'When is the next chapter coming out? I can\'t wait!',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          status: 'pending',
          is_flagged: false,
          flag_count: 0,
          user_name: 'EagerReader',
          user_id: 'user2',
          target_type: 'series',
          target_id: 'series1',
          series_title: 'Epic Adventure Series',
          like_count: 2,
          reply_count: 0
        },
        {
          id: '3',
          content: 'This content is inappropriate and should be removed.',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date(Date.now() - 172800000).toISOString(),
          status: 'flagged',
          is_flagged: true,
          flag_count: 5,
          user_name: 'TrollingUser',
          user_id: 'user3',
          target_type: 'chapter',
          target_id: 'chapter2',
          series_title: 'Epic Adventure Series',
          chapter_title: 'The Journey Continues',
          chapter_number: 2,
          like_count: 0,
          reply_count: 1
        }
      ];

      setComments(mockComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSeriesGroups = async () => {
    try {
      // Mock series groups data
      const mockSeriesGroups: SeriesGroup[] = [
        {
          series_id: 'series1',
          series_title: 'Epic Adventure Series',
          total_comments: 45,
          pending_comments: 3,
          flagged_comments: 1,
          chapters: [
            {
              chapter_id: 'chapter1',
              chapter_title: 'The Beginning',
              chapter_number: 1,
              comment_count: 20
            },
            {
              chapter_id: 'chapter2',
              chapter_title: 'The Journey Continues',
              chapter_number: 2,
              comment_count: 15
            },
            {
              chapter_id: 'chapter3',
              chapter_title: 'New Challenges',
              chapter_number: 3,
              comment_count: 10
            }
          ]
        },
        {
          series_id: 'series2',
          series_title: 'Romance Chronicles',
          total_comments: 28,
          pending_comments: 1,
          flagged_comments: 0,
          chapters: [
            {
              chapter_id: 'chapter4',
              chapter_title: 'First Meeting',
              chapter_number: 1,
              comment_count: 18
            },
            {
              chapter_id: 'chapter5',
              chapter_title: 'Growing Closer',
              chapter_number: 2,
              comment_count: 10
            }
          ]
        }
      ];

      setSeriesGroups(mockSeriesGroups);
    } catch (error) {
      console.error('Error fetching series groups:', error);
    }
  };

  const moderateComment = async (commentId: string, action: 'approve' | 'reject' | 'delete') => {
    try {
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { 
              ...comment, 
              status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'rejected'
            }
          : comment
      ));

      toast.success(`Comment ${action}d successfully`);
    } catch (error) {
      console.error('Error moderating comment:', error);
      toast.error(`Failed to ${action} comment`);
    }
  };

  const pinComment = async (commentId: string) => {
    try {
      toast.success('Comment pin status updated');
    } catch (error) {
      console.error('Error pinning comment:', error);
      toast.error('Failed to update pin status');
    }
  };

  const filteredComments = comments.filter(comment => {
    const matchesSearch = 
      comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.series_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.chapter_title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'pending' && comment.status === 'pending') ||
                         (statusFilter === 'approved' && comment.status === 'approved') ||
                         (statusFilter === 'flagged' && comment.is_flagged);
    
    const matchesType = typeFilter === 'all' || comment.target_type === typeFilter;
    
    const matchesSeries = !selectedSeries || comment.target_id === selectedSeries ||
                         (comment.target_type === 'chapter' && 
                          seriesGroups.find(sg => sg.series_id === selectedSeries)?.chapters
                            .some(ch => ch.chapter_id === comment.target_id));
    
    const matchesChapter = !selectedChapter || comment.target_id === selectedChapter;
    
    return matchesSearch && matchesStatus && matchesType && matchesSeries && matchesChapter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Comment Moderation</h1>
          <p className="text-muted-foreground">Manage comments across all series and chapters</p>
        </div>
      </div>

      <Tabs defaultValue="all-comments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all-comments">All Comments</TabsTrigger>
          <TabsTrigger value="by-series">By Series</TabsTrigger>
          <TabsTrigger value="flagged">Flagged Comments</TabsTrigger>
        </TabsList>

        <TabsContent value="all-comments" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Comments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search comments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="series">Series Comments</SelectItem>
                    <SelectItem value="chapter">Chapter Comments</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setSelectedSeries(null);
                    setSelectedChapter(null);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments List */}
          {filteredComments.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No comments found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'No comments to moderate yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredComments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium">{comment.user_name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{comment.series_title}</span>
                            {comment.target_type === 'chapter' && (
                              <>
                                <span>•</span>
                                <span>Chapter {comment.chapter_number}: {comment.chapter_title}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            comment.status === 'approved' ? 'default' :
                            comment.status === 'pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {comment.status}
                        </Badge>
                        
                        <Badge variant="outline" className="text-xs">
                          {comment.target_type}
                        </Badge>
                        
                        {comment.is_flagged && (
                          <Badge variant="destructive">
                            <Flag className="h-3 w-3 mr-1" />
                            {comment.flag_count} flags
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="mb-4 whitespace-pre-wrap">{comment.content}</p>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(comment.created_at))} ago
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {comment.like_count} likes • {comment.reply_count} replies
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {comment.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => moderateComment(comment.id, 'approve')}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moderateComment(comment.id, 'reject')}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => pinComment(comment.id)}
                        >
                          <Pin className="h-4 w-4 mr-1" />
                          Pin
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moderateComment(comment.id, 'delete')}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="by-series" className="space-y-4">
          <div className="grid gap-4">
            {seriesGroups.map((series) => (
              <Card key={series.series_id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        {series.series_title}
                      </CardTitle>
                      <CardDescription>
                        {series.total_comments} total comments • {series.pending_comments} pending • {series.flagged_comments} flagged
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSeries(selectedSeries === series.series_id ? null : series.series_id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Comments
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid gap-2">
                    <h4 className="font-medium text-sm">Chapters:</h4>
                    {series.chapters.map((chapter) => (
                      <div key={chapter.chapter_id} className="flex justify-between items-center p-2 border rounded">
                        <span className="text-sm">Chapter {chapter.chapter_number}: {chapter.chapter_title}</span>
                        <Badge variant="secondary">{chapter.comment_count} comments</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="flagged" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Flag className="h-5 w-5" />
                Flagged Comments
              </CardTitle>
              <CardDescription>
                Comments that have been reported by users and require immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredComments.filter(c => c.is_flagged).length === 0 ? (
                <div className="text-center py-8">
                  <Flag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No flagged comments at this time</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredComments.filter(c => c.is_flagged).map((comment) => (
                    <Card key={comment.id} className="border-destructive/20">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{comment.user_name}</span>
                            <Badge variant="destructive">
                              {comment.flag_count} reports
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at))} ago
                          </div>
                        </div>
                        <p className="mb-3 text-sm">{comment.content}</p>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => moderateComment(comment.id, 'approve')}>
                            Keep Comment
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => moderateComment(comment.id, 'delete')}>
                            Remove Comment
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};