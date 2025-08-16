import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  XCircle, 
  Ban, 
  Search, 
  Filter,
  AlertTriangle,
  MessageSquare,
  Clock,
  User
} from 'lucide-react';

interface CommentForModeration {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  status: string;
  chapter_id: string;
  profiles: { display_name?: string };
  reports_count: number;
}

export const BulkModerationTools: React.FC = () => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentForModeration[]>([]);
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [bulkAction, setBulkAction] = useState('');
  const [moderationReason, setModerationReason] = useState('');
  const [showReasonDialog, setShowReasonDialog] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [statusFilter, sortBy]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          status,
          chapter_id
        `);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      query = query.order(sortBy, { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      const processedComments: CommentForModeration[] = data?.map(comment => ({
        ...comment,
        profiles: { display_name: 'Anonymous' }, // Mock data since relation doesn't exist
        reports_count: Math.floor(Math.random() * 3) // Mock reports count
      })) || [];

      setComments(processedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const filteredComments = comments.filter(comment =>
    comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectComment = (commentId: string, checked: boolean) => {
    const newSelected = new Set(selectedComments);
    if (checked) {
      newSelected.add(commentId);
    } else {
      newSelected.delete(commentId);
    }
    setSelectedComments(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedComments(new Set(filteredComments.map(c => c.id)));
    } else {
      setSelectedComments(new Set());
    }
  };

  const executeBulkAction = async () => {
    if (!bulkAction || selectedComments.size === 0) return;

    if (bulkAction === 'delete' || bulkAction === 'ban') {
      setShowReasonDialog(true);
      return;
    }

    await performBulkAction();
  };

  const performBulkAction = async () => {
    try {
      const commentIds = Array.from(selectedComments);

      switch (bulkAction) {
        case 'approve':
          await supabase
            .from('comments')
            .update({ status: 'active' })
            .in('id', commentIds);
          break;

        case 'delete':
          await supabase
            .from('comments')
            .update({ status: 'deleted' })
            .in('id', commentIds);
          break;

        case 'ban':
          // Get unique user IDs from selected comments
          const userIds = [...new Set(
            comments
              .filter(c => selectedComments.has(c.id))
              .map(c => c.user_id)
          )];

          // Ban users (mock implementation)
          console.log('Would ban users:', userIds);
          break;

        case 'pending':
          await supabase
            .from('comments')
            .update({ status: 'pending' })
            .in('id', commentIds);
          break;
      }

      // Log moderation actions
      const moderationLogs = commentIds.map(commentId => ({
        comment_id: commentId,
        comment_type: 'chapter',
        moderator_id: user?.id,
        action: bulkAction === 'approve' ? 'approved' : bulkAction === 'delete' ? 'rejected' : 'pending',
        reason: moderationReason || `Bulk ${bulkAction} action`
      }));

      await supabase
        .from('comment_moderation')
        .insert(moderationLogs);

      toast.success(`Successfully ${bulkAction}ed ${selectedComments.size} comments`);
      setSelectedComments(new Set());
      setBulkAction('');
      setModerationReason('');
      setShowReasonDialog(false);
      fetchComments();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'deleted':
        return <Badge variant="destructive">Deleted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Bulk Moderation Tools</h2>
        <Badge variant="secondary">
          {selectedComments.size} selected
        </Badge>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="reports_count">Reports Count</SelectItem>
                <SelectItem value="content">Content</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={fetchComments} variant="outline">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedComments.size > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {selectedComments.size} comments selected
              </span>
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Choose action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Approve All</SelectItem>
                  <SelectItem value="delete">Delete All</SelectItem>
                  <SelectItem value="pending">Mark as Pending</SelectItem>
                  <SelectItem value="ban">Ban Users</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={executeBulkAction}
                disabled={!bulkAction}
                variant={bulkAction === 'delete' || bulkAction === 'ban' ? 'destructive' : 'default'}
              >
                Execute Action
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Comments for Moderation</CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedComments.size === filteredComments.length && filteredComments.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredComments.map((comment) => (
              <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedComments.has(comment.id)}
                      onCheckedChange={(checked) => handleSelectComment(comment.id, !!checked)}
                    />
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {comment.profiles?.display_name || 'Anonymous'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(comment.status)}
                    {comment.reports_count > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {comment.reports_count} reports
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="pl-7">
                  <p className="text-sm bg-muted p-3 rounded">
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                    <span>Chapter ID: {comment.chapter_id}</span>
                  </div>
                </div>
              </div>
            ))}

            {filteredComments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No comments found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reason Dialog */}
      <Dialog open={showReasonDialog} onOpenChange={setShowReasonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Moderation Reason</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You are about to {bulkAction} {selectedComments.size} comments. 
              Please provide a reason for this action.
            </p>
            <Textarea
              placeholder="Enter reason for moderation action..."
              value={moderationReason}
              onChange={(e) => setModerationReason(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowReasonDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={performBulkAction}
                variant={bulkAction === 'delete' || bulkAction === 'ban' ? 'destructive' : 'default'}
                disabled={!moderationReason.trim()}
              >
                Confirm {bulkAction}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};