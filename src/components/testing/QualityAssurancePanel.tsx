import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock,
  Bug,
  Target,
  FileText,
  Users,
  Zap,
  Shield,
  Search,
  Plus,
  Eye
} from 'lucide-react';

interface QAIssue {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'bug' | 'improvement' | 'feature' | 'security' | 'performance';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  assignee?: string;
  reporter: string;
  createdAt: Date;
  updatedAt: Date;
  reproduction?: string[];
  screenshots?: string[];
}

interface QAMetrics {
  totalIssues: number;
  openIssues: number;
  resolvedIssues: number;
  criticalIssues: number;
  bugEscapeRate: number;
  testCoverage: number;
  codeQuality: number;
}

export const QualityAssurancePanel: React.FC = () => {
  const [issues, setIssues] = useState<QAIssue[]>([]);
  const [metrics, setMetrics] = useState<QAMetrics>({
    totalIssues: 0,
    openIssues: 0,
    resolvedIssues: 0,
    criticalIssues: 0,
    bugEscapeRate: 2.1,
    testCoverage: 87.3,
    codeQuality: 8.4
  });
  const [showNewIssueForm, setShowNewIssueForm] = useState(false);
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    severity: 'medium' as const,
    category: 'bug' as const,
    reproduction: ''
  });
  const [filter, setFilter] = useState({
    status: 'all',
    severity: 'all',
    category: 'all',
    search: ''
  });

  // Initialize with sample data
  useEffect(() => {
    const sampleIssues: QAIssue[] = [
      {
        id: '1',
        title: 'Chapter loading fails on slow connections',
        description: 'When users have slow internet connections, chapter pages fail to load properly and show error messages.',
        severity: 'high',
        category: 'bug',
        status: 'open',
        reporter: 'QA Team',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        reproduction: [
          'Throttle network to 2G speed',
          'Navigate to any chapter',
          'Observe loading behavior'
        ]
      },
      {
        id: '2',
        title: 'Improve mobile reading experience',
        description: 'The mobile reading interface could be enhanced with better gesture controls and page transitions.',
        severity: 'medium',
        category: 'improvement',
        status: 'in-progress',
        assignee: 'Dev Team',
        reporter: 'User Feedback',
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-14')
      },
      {
        id: '3',
        title: 'Security vulnerability in comment system',
        description: 'Potential XSS vulnerability found in the comment posting functionality.',
        severity: 'critical',
        category: 'security',
        status: 'resolved',
        assignee: 'Security Team',
        reporter: 'Security Audit',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-13')
      },
      {
        id: '4',
        title: 'Payment processing timeout',
        description: 'Premium subscription payments occasionally time out during processing.',
        severity: 'high',
        category: 'bug',
        status: 'open',
        reporter: 'Support Team',
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-08')
      },
      {
        id: '5',
        title: 'Add dark mode toggle animation',
        description: 'Smooth transition animation when switching between light and dark modes.',
        severity: 'low',
        category: 'feature',
        status: 'open',
        reporter: 'UX Team',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-05')
      }
    ];

    setIssues(sampleIssues);
    updateMetrics(sampleIssues);
  }, []);

  const updateMetrics = (issueList: QAIssue[]) => {
    const totalIssues = issueList.length;
    const openIssues = issueList.filter(i => i.status === 'open').length;
    const resolvedIssues = issueList.filter(i => i.status === 'resolved').length;
    const criticalIssues = issueList.filter(i => i.severity === 'critical').length;

    setMetrics(prev => ({
      ...prev,
      totalIssues,
      openIssues,
      resolvedIssues,
      criticalIssues
    }));
  };

  const handleCreateIssue = () => {
    if (!newIssue.title.trim()) return;

    const issue: QAIssue = {
      id: Date.now().toString(),
      title: newIssue.title,
      description: newIssue.description,
      severity: newIssue.severity,
      category: newIssue.category,
      status: 'open',
      reporter: 'Current User',
      createdAt: new Date(),
      updatedAt: new Date(),
      reproduction: newIssue.reproduction ? newIssue.reproduction.split('\n') : undefined
    };

    const updatedIssues = [issue, ...issues];
    setIssues(updatedIssues);
    updateMetrics(updatedIssues);

    // Reset form
    setNewIssue({
      title: '',
      description: '',
      severity: 'medium',
      category: 'bug',
      reproduction: ''
    });
    setShowNewIssueForm(false);
  };

  const handleStatusChange = (issueId: string, newStatus: QAIssue['status']) => {
    const updatedIssues = issues.map(issue =>
      issue.id === issueId
        ? { ...issue, status: newStatus, updatedAt: new Date() }
        : issue
    );
    setIssues(updatedIssues);
    updateMetrics(updatedIssues);
  };

  const filteredIssues = issues.filter(issue => {
    const matchesStatus = filter.status === 'all' || issue.status === filter.status;
    const matchesSeverity = filter.severity === 'all' || issue.severity === filter.severity;
    const matchesCategory = filter.category === 'all' || issue.category === filter.category;
    const matchesSearch = !filter.search || 
      issue.title.toLowerCase().includes(filter.search.toLowerCase()) ||
      issue.description.toLowerCase().includes(filter.search.toLowerCase());

    return matchesStatus && matchesSeverity && matchesCategory && matchesSearch;
  });

  const getSeverityColor = (severity: QAIssue['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStatusColor = (status: QAIssue['status']) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: QAIssue['category']) => {
    switch (category) {
      case 'bug': return <Bug className="h-4 w-4" />;
      case 'improvement': return <Target className="h-4 w-4" />;
      case 'feature': return <Plus className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'performance': return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* QA Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Issues</p>
                <p className="text-2xl font-bold">{metrics.totalIssues}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Issues</p>
                <p className="text-2xl font-bold text-red-600">{metrics.openIssues}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Test Coverage</p>
                <p className="text-2xl font-bold text-green-600">{metrics.testCoverage}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Code Quality</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.codeQuality}/10</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Progress Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Test Coverage</span>
              <span>{metrics.testCoverage}%</span>
            </div>
            <Progress value={metrics.testCoverage} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Code Quality Score</span>
              <span>{metrics.codeQuality}/10</span>
            </div>
            <Progress value={metrics.codeQuality * 10} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Bug Escape Rate</span>
              <span>{metrics.bugEscapeRate}%</span>
            </div>
            <Progress value={100 - metrics.bugEscapeRate * 10} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Issue Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-6 w-6" />
              Issue Tracking
            </CardTitle>
            <Button onClick={() => setShowNewIssueForm(!showNewIssueForm)}>
              <Plus className="h-4 w-4 mr-2" />
              New Issue
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search issues..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="w-48"
              />
            </div>
            <select
              value={filter.status}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={filter.severity}
              onChange={(e) => setFilter(prev => ({ ...prev, severity: e.target.value }))}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={filter.category}
              onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Categories</option>
              <option value="bug">Bug</option>
              <option value="improvement">Improvement</option>
              <option value="feature">Feature</option>
              <option value="security">Security</option>
              <option value="performance">Performance</option>
            </select>
          </div>

          {/* New Issue Form */}
          {showNewIssueForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create New Issue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Issue title"
                  value={newIssue.title}
                  onChange={(e) => setNewIssue(prev => ({ ...prev, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Issue description"
                  value={newIssue.description}
                  onChange={(e) => setNewIssue(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
                <div className="flex gap-4">
                  <select
                    value={newIssue.severity}
                    onChange={(e) => setNewIssue(prev => ({ ...prev, severity: e.target.value as any }))}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <select
                    value={newIssue.category}
                    onChange={(e) => setNewIssue(prev => ({ ...prev, category: e.target.value as any }))}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="bug">Bug</option>
                    <option value="improvement">Improvement</option>
                    <option value="feature">Feature</option>
                    <option value="security">Security</option>
                    <option value="performance">Performance</option>
                  </select>
                </div>
                <Textarea
                  placeholder="Reproduction steps (one per line)"
                  value={newIssue.reproduction}
                  onChange={(e) => setNewIssue(prev => ({ ...prev, reproduction: e.target.value }))}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button onClick={handleCreateIssue}>Create Issue</Button>
                  <Button variant="outline" onClick={() => setShowNewIssueForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Issues List */}
          <div className="space-y-4">
            {filteredIssues.map(issue => (
              <Card key={issue.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    {getCategoryIcon(issue.category)}
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{issue.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {issue.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>By {issue.reporter}</span>
                        <span>•</span>
                        <span>{issue.createdAt.toLocaleDateString()}</span>
                        {issue.assignee && (
                          <>
                            <span>•</span>
                            <span>Assigned to {issue.assignee}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(issue.severity)}>
                      {issue.severity}
                    </Badge>
                    <select
                      value={issue.status}
                      onChange={(e) => handleStatusChange(issue.id, e.target.value as any)}
                      className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(issue.status)}`}
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
                
                {issue.reproduction && (
                  <div className="mt-3 p-3 bg-muted/50 rounded">
                    <h4 className="text-sm font-medium mb-2">Reproduction Steps:</h4>
                    <ol className="text-sm list-decimal list-inside space-y-1">
                      {issue.reproduction.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {filteredIssues.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No issues found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};