import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  Trash2,
  CheckCircle,
  Pin,
  Ban,
  Flag,
  Download,
  AlertTriangle,
  Calendar,
  User,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';

interface ModeratedComment {
  id: string;
  content: string;
  user_id?: string;
  guest_name?: string;
  guest_email?: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'pending_review' | 'deleted';
  is_pinned: boolean;
  is_flagged: boolean;
  flag_count: number;
  like_count: number;
  series_id?: string;
  chapter_id?: string;
  profile?: {
    display_name: string;
    email: string;
    role: string;
  };
}

export const CommentsModerationDashboard: React.FC = () => {
  const [comments, setComments] = useState<ModeratedComment[]>([]);
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [bulkAction, setBulkAction] = useState('');
  const [dateRange, setDateRange] = useState('all');

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalComments: 0,
    pendingReview: 0,
    flaggedComments: 0,
    uniqueUsers: 0,
    topSeries: [],
    recentTrends: []
  });

  useEffect(() => {
    fetchComments();
    fetchAnalytics();
  }, [filterBy, sortBy, dateRange]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      
      // Use mock data for demonstration since advanced schema doesn't exist yet
      const mockComments: ModeratedComment[] = [
        {
          id: '1',
          content: 'This is a great chapter! Really enjoyed the character development.',
          user_id: 'user1',
          guest_name: undefined,
          guest_email: undefined,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          is_pinned: false,
          is_flagged: false,
          flag_count: 0,
          like_count: 15,
          chapter_id: 'ch1',
          profile: {
            display_name: 'John Reader',
            email: 'john@example.com',
            role: 'member'
          }
        },
        {
          id: '2',
          content: 'Amazing storyline! Can\'t wait for the next chapter.',
          user_id: undefined,
          guest_name: 'Anonymous Guest',
          guest_email: 'guest@example.com',
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          is_pinned: true,
          is_flagged: false,
          flag_count: 0,
          like_count: 8,
          series_id: 'series1',
          profile: undefined
        },
        {
          id: '3',
          content: 'This comment contains inappropriate content that should be flagged.',
          user_id: 'user2',
          guest_name: undefined,
          guest_email: undefined,
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          status: 'pending_review',
          is_pinned: false,
          is_flagged: true,
          flag_count: 3,
          like_count: 0,
          chapter_id: 'ch2',
          profile: {
            display_name: 'Flagged User',
            email: 'flagged@example.com',
            role: 'member'
          }
        }
      ];

      // Apply filters
      let filteredComments = mockComments;
      
      if (filterBy === 'flagged') {
        filteredComments = filteredComments.filter(c => c.is_flagged);
      } else if (filterBy === 'pending') {
        filteredComments = filteredComments.filter(c => c.status === 'pending_review');
      } else if (filterBy === 'guest') {
        filteredComments = filteredComments.filter(c => c.guest_name);
      }

      // Apply search
      if (searchTerm) {
        filteredComments = filteredComments.filter(c =>
          c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.profile?.display_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setComments(filteredComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Mock analytics for demonstration
      setAnalytics({
        totalComments: 156,
        pendingReview: 3,
        flaggedComments: 8,
        uniqueUsers: 42,
        topSeries: [],
        recentTrends: []
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const filteredComments = useMemo(() => {
    return comments.filter(comment => {
      if (searchTerm) {
        return comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
               comment.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               comment.profile?.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return true;
    });
  }, [comments, searchTerm]);

  const handleBulkAction = async () => {
    if (!bulkAction || selectedComments.size === 0) return;

    try {
      const commentIds = Array.from(selectedComments);
      
      // Mock bulk actions
      console.log(`Applying bulk action "${bulkAction}" to ${commentIds.length} comments`);
      
      toast.success(`Bulk action "${bulkAction}" applied to ${commentIds.length} comments`);
      setSelectedComments(new Set());
      setBulkAction('');
      fetchComments();
    } catch (error) {
      console.error('Error applying bulk action:', error);
      toast.error('Failed to apply bulk action');
    }
  };

  const handleCommentAction = async (commentId: string, action: string, userId?: string) => {
    try {
      // Mock individual actions
      console.log(`Applying action "${action}" to comment ${commentId}`);
      
      toast.success(`Action "${action}" applied successfully`);
      fetchComments();
    } catch (error) {
      console.error('Error applying action:', error);
      toast.error('Failed to apply action');
    }
  };

  const exportComments = async () => {
    try {
      const csvData = filteredComments.map(comment => ({
        id: comment.id,
        content: comment.content,
        author: comment.guest_name || comment.profile?.display_name || 'Anonymous',
        email: comment.guest_email || comment.profile?.email || '',
        created_at: comment.created_at,
        status: comment.status,
        is_pinned: comment.is_pinned,
        is_flagged: comment.is_flagged,
        like_count: comment.like_count
      }));

      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).map(v => `"${v}"`).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comments-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();

      toast.success('Comments exported successfully');
    } catch (error) {
      console.error('Error exporting comments:', error);
      toast.error('Failed to export comments');
    }
  };

  const toggleCommentSelection = (commentId: string) => {
    const newSelection = new Set(selectedComments);
    if (newSelection.has(commentId)) {
      newSelection.delete(commentId);
    } else {
      newSelection.add(commentId);
    }
    setSelectedComments(newSelection);
  };

  const selectAllComments = () => {
    if (selectedComments.size === filteredComments.length) {
      setSelectedComments(new Set());
    } else {
      setSelectedComments(new Set(filteredComments.map(c => c.id)));
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comments Moderation</h1>
          <p className="text-muted-foreground">Manage and moderate all comments across your platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportComments}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalComments}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pendingReview}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Comments</CardTitle>
            <Flag className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.flaggedComments}</div>
            <p className="text-xs text-muted-foreground">Reported by users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">Commenting users</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search comments, users, or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Comments</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="guest">Guest Comments</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="most_flagged">Most Flagged</SelectItem>
                  <SelectItem value="most_liked">Most Liked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedComments.size > 0 && (
            <div className="flex items-center gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">
                {selectedComments.size} comment{selectedComments.size !== 1 ? 's' : ''} selected
              </span>
              
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Bulk action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="pin">Pin</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={handleBulkAction}
                disabled={!bulkAction}
                variant="default"
              >
                Apply Action
              </Button>

              <Button 
                variant="outline"
                onClick={() => setSelectedComments(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Comments ({filteredComments.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedComments.size === filteredComments.length && filteredComments.length > 0}
                onCheckedChange={selectAllComments}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No comments found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms' : 'No comments match the current filters'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComments.map((comment) => (
                <CommentModerationCard
                  key={comment.id}
                  comment={comment}
                  isSelected={selectedComments.has(comment.id)}
                  onSelect={() => toggleCommentSelection(comment.id)}
                  onAction={handleCommentAction}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Individual comment card component for moderation
const CommentModerationCard: React.FC<{
  comment: ModeratedComment;
  isSelected: boolean;
  onSelect: () => void;
  onAction: (commentId: string, action: string, userId?: string) => void;
}> = ({ comment, isSelected, onSelect, onAction }) => {
  return (
    <div className={`border rounded-lg p-4 transition-colors ${
      isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
    }`}>
      <div className="flex items-start gap-4">
        <Checkbox checked={isSelected} onCheckedChange={onSelect} />
        
        <div className="flex-1 space-y-3">
          {/* Comment Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium">
                  {comment.guest_name?.slice(0, 2).toUpperCase() || 
                   comment.profile?.display_name?.slice(0, 2).toUpperCase() || '?'}
                </span>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {comment.guest_name || comment.profile?.display_name || 'Anonymous'}
                  </span>
                  {comment.guest_name && <Badge variant="outline">Guest</Badge>}
                  {comment.profile?.role === 'admin' && <Badge variant="default">Admin</Badge>}
                  {comment.is_pinned && <Pin className="h-4 w-4 text-primary" />}
                  {comment.is_flagged && <Flag className="h-4 w-4 text-red-500" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(comment.created_at), 'MMM dd, yyyy HH:mm')}
                  {comment.flag_count > 0 && ` • ${comment.flag_count} flags`}
                </p>
              </div>
            </div>

            <Badge variant={
              comment.status === 'active' ? 'default' :
              comment.status === 'pending_review' ? 'secondary' : 'destructive'
            }>
              {comment.status}
            </Badge>
          </div>

          {/* Comment Content */}
          <div className="bg-muted/30 rounded-md p-3">
            <p className="text-sm">{comment.content}</p>
          </div>

          {/* Comment Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{comment.like_count} likes</span>
            {comment.chapter_id && <span>Chapter comment</span>}
            {comment.series_id && <span>Series comment</span>}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {comment.status === 'pending_review' && (
              <Button
                size="sm"
                variant="default"
                onClick={() => onAction(comment.id, 'approve')}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction(comment.id, 'pin')}
              disabled={comment.is_pinned}
            >
              <Pin className="h-4 w-4 mr-1" />
              Pin
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => onAction(comment.id, 'delete')}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>

            {comment.user_id && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(comment.id, 'suspend_user', comment.user_id)}
              >
                <Shield className="h-4 w-4 mr-1" />
                Suspend User
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};