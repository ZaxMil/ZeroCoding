import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  User,
  Eye,
  Shield,
  Loader2,
  Download,
  Upload,
  Settings,
  RefreshCw
} from 'lucide-react';

interface CommentForModeration {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  status: string;
  chapter_id: string;
  series_id?: string;
  target_type: 'chapter' | 'series';
  profiles: { display_name?: string; username?: string; role?: string };
  reports_count: number;
  flag_score: number;
  sentiment_score?: number;
  has_attachments: boolean;
}

interface ModerationStats {
  total: number;
  pending: number;
  active: number;
  deleted: number;
  flagged: number;
  reported: number;
}

interface BulkModerationFilters {
  status: string;
  target_type: string;
  date_range: string;
  min_reports: number;
  sentiment: string;
  user_role: string;
  has_attachments: boolean | null;
}

export const EnhancedBulkModerationTools: React.FC = () => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentForModeration[]>([]);
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [bulkAction, setBulkAction] = useState('');
  const [moderationReason, setModerationReason] = useState('');
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [stats, setStats] = useState<ModerationStats>({
    total: 0,
    pending: 0,
    active: 0,
    deleted: 0,
    flagged: 0,
    reported: 0
  });
  
  const [filters, setFilters] = useState<BulkModerationFilters>({
    status: 'all',
    target_type: 'all',
    date_range: '7d',
    min_reports: 0,
    sentiment: 'all',
    user_role: 'all',
    has_attachments: null
  });

  const [activeTab, setActiveTab] = useState('queue');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    fetchComments();
    fetchStats();
  }, [filters, sortBy]);

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
          chapter_id,
          series_id,
          profiles:user_id (
            display_name,
            username,
            role
          )
        `);

      // Apply filters
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.date_range !== 'all') {
        const days = parseInt(filters.date_range.replace('d', ''));
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query = query.gte('created_at', startDate.toISOString());
      }

      query = query.order(sortBy, { ascending: false }).limit(100);

      const { data, error } = await query;

      if (error) throw error;

      // Process and enhance comments data
      const processedComments: CommentForModeration[] = data?.map(comment => ({
        ...comment,
        target_type: comment.series_id ? 'series' as const : 'chapter' as const,
        profiles: { 
          display_name: 'Anonymous', 
          username: null, 
          role: 'member' 
        },
        reports_count: Math.floor(Math.random() * 5), // Mock data
        flag_score: Math.random() * 100,
        sentiment_score: Math.random() * 100 - 50, // -50 to +50
        has_attachments: Math.random() > 0.8
      })) || [];

      setComments(processedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // This would normally be a proper aggregation query
      const { data } = await supabase
        .from('comments')
        .select('status', { count: 'exact' });

      if (data) {
        const newStats = {
          total: data.length,
          pending: data.filter(c => c.status === 'pending').length,
          active: data.filter(c => c.status === 'active').length,
          deleted: data.filter(c => c.status === 'deleted').length,
          flagged: data.filter(c => c.status === 'flagged').length,
          reported: Math.floor(Math.random() * 20) // Mock
        };
        setStats(newStats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filteredComments = comments.filter(comment => {
    const matchesSearch = comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comment.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comment.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesReports = comment.reports_count >= filters.min_reports;
    
    let matchesRole = true;
    if (filters.user_role !== 'all') {
      matchesRole = comment.profiles?.role === filters.user_role;
    }

    let matchesAttachments = true;
    if (filters.has_attachments !== null) {
      matchesAttachments = comment.has_attachments === filters.has_attachments;
    }

    return matchesSearch && matchesReports && matchesRole && matchesAttachments;
  });

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

  const handleSmartSelection = (criteria: string) => {
    let newSelected = new Set<string>();
    
    switch (criteria) {
      case 'flagged':
        newSelected = new Set(filteredComments.filter(c => c.flag_score > 70).map(c => c.id));
        break;
      case 'reported':
        newSelected = new Set(filteredComments.filter(c => c.reports_count > 0).map(c => c.id));
        break;
      case 'negative_sentiment':
        newSelected = new Set(filteredComments.filter(c => (c.sentiment_score || 0) < -20).map(c => c.id));
        break;
      case 'old':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        newSelected = new Set(filteredComments.filter(c => new Date(c.created_at) < weekAgo).map(c => c.id));
        break;
    }
    
    setSelectedComments(newSelected);
    toast.success(`Selected ${newSelected.size} comments based on ${criteria} criteria`);
  };

  const executeBulkAction = async () => {
    if (!bulkAction || selectedComments.size === 0) return;

    if (['delete', 'ban', 'suspend'].includes(bulkAction)) {
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

        case 'flag':
          await supabase
            .from('comments')
            .update({ status: 'flagged' })
            .in('id', commentIds);
          break;

        case 'pending':
          await supabase
            .from('comments')
            .update({ status: 'pending' })
            .in('id', commentIds);
          break;

        case 'ban':
          // Get unique user IDs and ban them
          const userIds = [...new Set(
            comments
              .filter(c => selectedComments.has(c.id))
              .map(c => c.user_id)
          )];
          
          // This would implement user banning logic
          console.log('Would ban users:', userIds);
          break;
      }

      // Log moderation actions
      const moderationLogs = commentIds.map(commentId => ({
        comment_id: commentId,
        comment_type: 'bulk_moderation',
        moderator_id: user?.id,
        action: bulkAction,
        reason: moderationReason || `Bulk ${bulkAction} action`,
        created_at: new Date().toISOString()
      }));

      await supabase
        .from('comment_moderation')
        .insert(moderationLogs);

      toast.success(`Successfully ${bulkAction}ed ${selectedComments.size} comments`);
      
      // Reset state and refresh
      setSelectedComments(new Set());
      setBulkAction('');
      setModerationReason('');
      setShowReasonDialog(false);
      fetchComments();
      fetchStats();
      
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const exportModerationData = () => {
    const exportData = filteredComments.map(comment => ({
      id: comment.id,
      content: comment.content.slice(0, 100) + '...',
      user: comment.profiles?.display_name || 'Anonymous',
      status: comment.status,
      created_at: comment.created_at,
      reports_count: comment.reports_count,
      flag_score: comment.flag_score,
      target_type: comment.target_type
    }));

    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moderation-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'deleted':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Deleted</Badge>;
      case 'flagged':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Flagged</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSentimentBadge = (score?: number) => {
    if (!score) return null;
    
    if (score > 20) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Positive</Badge>;
    } else if (score < -20) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Negative</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Neutral</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Enhanced Bulk Moderation
          </h2>
          <p className="text-muted-foreground mt-1">
            Advanced tools for efficient content moderation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportModerationData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Badge variant="secondary" className="px-3 py-1">
            {selectedComments.size} selected
          </Badge>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.deleted}</p>
              <p className="text-xs text-muted-foreground">Deleted</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.flagged}</p>
              <p className="text-xs text-muted-foreground">Flagged</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.reported}</p>
              <p className="text-xs text-muted-foreground">Reported</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="queue">Moderation Queue</TabsTrigger>
          <TabsTrigger value="filters">Advanced Filters</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">Quick Select:</span>
                <Button size="sm" variant="outline" onClick={() => handleSmartSelection('flagged')}>
                  High Flag Score
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleSmartSelection('reported')}>
                  Reported Content
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleSmartSelection('negative_sentiment')}>
                  Negative Sentiment
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleSmartSelection('old')}>
                  Old Content
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search and Filter Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search comments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="deleted">Deleted</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.target_type} onValueChange={(value) => setFilters({...filters, target_type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="chapter">Chapter</SelectItem>
                    <SelectItem value="series">Series</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Date Created</SelectItem>
                    <SelectItem value="reports_count">Reports Count</SelectItem>
                    <SelectItem value="flag_score">Flag Score</SelectItem>
                    <SelectItem value="sentiment_score">Sentiment</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={fetchComments} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedComments.size > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">
                      {selectedComments.size} comments selected
                    </span>
                    <Select value={bulkAction} onValueChange={setBulkAction}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Choose action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approve">Approve All</SelectItem>
                        <SelectItem value="delete">Delete All</SelectItem>
                        <SelectItem value="flag">Flag All</SelectItem>
                        <SelectItem value="pending">Mark as Pending</SelectItem>
                        <SelectItem value="ban">Ban Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={executeBulkAction}
                      disabled={!bulkAction}
                      variant={['delete', 'ban'].includes(bulkAction) ? 'destructive' : 'default'}
                    >
                      Execute Action
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedComments(new Set())}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Comments for Moderation</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedComments.size === filteredComments.length && filteredComments.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm text-muted-foreground">Select All</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      onClick={() => setViewMode('list')}
                    >
                      List
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      onClick={() => setViewMode('grid')}
                    >
                      Grid
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
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
                            {comment.profiles?.display_name || comment.profiles?.username || 'Anonymous'}
                          </span>
                          {comment.profiles?.role === 'admin' && (
                            <Badge variant="outline" className="text-xs">Admin</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(comment.status)}
                        {comment.reports_count > 0 && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {comment.reports_count}
                          </Badge>
                        )}
                        {comment.has_attachments && (
                          <Badge variant="outline" className="gap-1">
                            📎
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="pl-7">
                      <p className="text-sm bg-muted p-3 rounded line-clamp-3">
                        {comment.content}
                      </p>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                          <span className="capitalize">{comment.target_type}</span>
                          {comment.flag_score > 50 && (
                            <span className="text-orange-600">
                              Flag Score: {Math.round(comment.flag_score)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getSentimentBadge(comment.sentiment_score)}
                          <Button size="sm" variant="ghost">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredComments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No comments found matching your criteria
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Filtering Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Minimum Reports</label>
                    <Input
                      type="number"
                      value={filters.min_reports}
                      onChange={(e) => setFilters({...filters, min_reports: parseInt(e.target.value) || 0})}
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">User Role</label>
                    <Select value={filters.user_role} onValueChange={(value) => setFilters({...filters, user_role: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="author">Author</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Date Range</label>
                    <Select value={filters.date_range} onValueChange={(value) => setFilters({...filters, date_range: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1d">Last 24 hours</SelectItem>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 3 months</SelectItem>
                        <SelectItem value="all">All time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Has Attachments</label>
                    <Select 
                      value={filters.has_attachments === null ? 'all' : filters.has_attachments.toString()} 
                      onValueChange={(value) => setFilters({
                        ...filters, 
                        has_attachments: value === 'all' ? null : value === 'true'
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="true">With Attachments</SelectItem>
                        <SelectItem value="false">Without Attachments</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Moderation Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Advanced moderation settings will be available in future updates.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                variant={['delete', 'ban'].includes(bulkAction) ? 'destructive' : 'default'}
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