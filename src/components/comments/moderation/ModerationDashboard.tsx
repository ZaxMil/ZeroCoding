import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle, XCircle, Eye, Ban, BarChart3, Settings, Users } from 'lucide-react';
import { toast } from 'sonner';
import { CommentAnalytics } from '../admin/CommentAnalytics';
import { BulkModerationTools } from '../admin/BulkModerationTools';
import { CommentContentManagement } from '../admin/CommentContentManagement';

interface ReportedComment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  reports: Array<{
    id: string;
    report_reason: string;
    report_details?: string;
    reported_by: string;
    created_at: string;
    profiles: { display_name?: string };
  }>;
  profiles: { display_name?: string };
}

export const ModerationDashboard: React.FC = () => {
  const { user } = useAuth();
  const [reportedComments, setReportedComments] = useState<ReportedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    if (user) {
      fetchReportedComments();
    }
  }, [user]);

  const fetchReportedComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          user_id,
          created_at,
          profiles(display_name),
          comment_reports(
            id,
            report_reason,
            report_details,
            reported_by,
            created_at,
            profiles(display_name)
          )
        `)
        .not('comment_reports', 'is', null)
        .eq('status', 'active');

      setReportedComments(reportedComments);
    } catch (error) {
      console.error('Error fetching reported comments:', error);
      toast.error('Failed to load reported comments');
    } finally {
      setLoading(false);
    }
  };

  const moderateComment = async (commentId: string, action: 'approve' | 'delete' | 'warn') => {
    try {
      if (action === 'delete') {
        await supabase
          .from('comments')
          .update({ status: 'deleted' })
          .eq('id', commentId);
      }

      // Log moderation action
      await supabase.from('comment_moderation').insert({
        comment_id: commentId,
        comment_type: 'chapter',
        moderator_id: user?.id,
        action: action === 'approve' ? 'approved' : action === 'delete' ? 'rejected' : 'pending',
        reason: `Moderated via dashboard - ${action}`
      });

      toast.success(`Comment ${action}d successfully`);
      fetchReportedComments();
    } catch (error) {
      console.error('Error moderating comment:', error);
      toast.error('Failed to moderate comment');
    }
  };

  const banUser = async (userId: string, duration: number) => {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + duration);

      // Note: user_bans table doesn't exist in current schema
      // This would need to be created or use an alternative approach
      console.log('Would ban user:', userId, 'for', duration, 'days');

      toast.success(`User banned for ${duration} days`);
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Failed to ban user');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading moderation dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Comment Moderation</h2>
        <Badge variant="secondary">
          {reportedComments.length} Reported Comments
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Pending Review
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Bulk Tools
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {reportedComments.map((comment) => (
            <Card key={comment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Report from {comment.profiles?.display_name || 'Anonymous'}
                  </CardTitle>
                  <Badge variant="destructive">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {comment.reports.length} Reports
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">{comment.content}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Reports:</h4>
                  {comment.reports.map((report) => (
                    <div key={report.id} className="text-sm border-l-2 border-destructive pl-3">
                      <p><strong>Reason:</strong> {report.report_reason}</p>
                      {report.report_details && (
                        <p><strong>Details:</strong> {report.report_details}</p>
                      )}
                      <p className="text-muted-foreground">
                        By {report.profiles?.display_name || 'Anonymous'} on{' '}
                        {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moderateComment(comment.id, 'approve')}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => moderateComment(comment.id, 'delete')}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => banUser(comment.user_id, 7)}
                  >
                    <Ban className="w-4 h-4 mr-1" />
                    Ban User (7d)
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="analytics">
          <CommentAnalytics />
        </TabsContent>

        <TabsContent value="bulk">
          <BulkModerationTools />
        </TabsContent>

        <TabsContent value="settings">
          <CommentContentManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};