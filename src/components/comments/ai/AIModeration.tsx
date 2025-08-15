import React, { useState, useEffect } from 'react';
import { Brain, Shield, AlertTriangle, CheckCircle, XCircle, Eye, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface ModerationResult {
  id: string;
  comment_id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  ai_score: number;
  confidence: number;
  flags: Array<{
    type: 'spam' | 'harassment' | 'hate_speech' | 'inappropriate' | 'off_topic' | 'low_quality';
    severity: 'low' | 'medium' | 'high';
    confidence: number;
    reason: string;
  }>;
  suggested_action: 'approve' | 'review' | 'hide' | 'delete' | 'warn_user';
  created_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'reviewed';
  moderator_notes?: string;
}

interface AIModerationSettings {
  enabled: boolean;
  auto_approve_threshold: number;
  auto_hide_threshold: number;
  sensitivity: {
    spam: number;
    harassment: number;
    hate_speech: number;
    inappropriate: number;
    off_topic: number;
    low_quality: number;
  };
  notifications: {
    high_confidence_flags: boolean;
    suspicious_patterns: boolean;
    false_positive_feedback: boolean;
  };
}

interface AIModerationProps {
  onSettingsUpdate?: (settings: AIModerationSettings) => void;
  className?: string;
}

export const AIModeration: React.FC<AIModerationProps> = ({
  onSettingsUpdate,
  className = ""
}) => {
  const [results, setResults] = useState<ModerationResult[]>([]);
  const [settings, setSettings] = useState<AIModerationSettings>({
    enabled: true,
    auto_approve_threshold: 0.8,
    auto_hide_threshold: 0.3,
    sensitivity: {
      spam: 0.7,
      harassment: 0.8,
      hate_speech: 0.9,
      inappropriate: 0.6,
      off_topic: 0.5,
      low_quality: 0.4
    },
    notifications: {
      high_confidence_flags: true,
      suspicious_patterns: true,
      false_positive_feedback: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const { toast } = useToast();

  useEffect(() => {
    fetchModerationResults();
  }, []);

  const fetchModerationResults = async () => {
    try {
      // Mock data - replace with actual AI moderation API
      const mockResults: ModerationResult[] = [
        {
          id: '1',
          comment_id: 'comment-1',
          content: 'This is spam content with promotional links...',
          author: {
            id: 'user-1',
            name: 'Suspicious User',
            avatar: '/avatars/user1.jpg'
          },
          ai_score: 0.15,
          confidence: 0.92,
          flags: [
            {
              type: 'spam',
              severity: 'high',
              confidence: 0.95,
              reason: 'Contains promotional links and repetitive content patterns'
            },
            {
              type: 'low_quality',
              severity: 'medium',
              confidence: 0.78,
              reason: 'Poor grammar and formatting'
            }
          ],
          suggested_action: 'hide',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          status: 'pending'
        },
        {
          id: '2',
          comment_id: 'comment-2',
          content: 'Great article! Thanks for sharing this helpful information.',
          author: {
            id: 'user-2',
            name: 'John Doe',
            avatar: '/avatars/john.jpg'
          },
          ai_score: 0.95,
          confidence: 0.88,
          flags: [],
          suggested_action: 'approve',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          status: 'pending'
        },
        {
          id: '3',
          comment_id: 'comment-3',
          content: 'This comment contains inappropriate language and personal attacks...',
          author: {
            id: 'user-3',
            name: 'Angry User',
            avatar: '/avatars/user3.jpg'
          },
          ai_score: 0.05,
          confidence: 0.96,
          flags: [
            {
              type: 'harassment',
              severity: 'high',
              confidence: 0.98,
              reason: 'Contains personal attacks and aggressive language'
            },
            {
              type: 'inappropriate',
              severity: 'high',
              confidence: 0.91,
              reason: 'Uses inappropriate language and offensive terms'
            }
          ],
          suggested_action: 'delete',
          created_at: new Date(Date.now() - 10800000).toISOString(),
          status: 'pending'
        }
      ];

      setResults(mockResults);
    } catch (error) {
      console.error('Error fetching moderation results:', error);
      toast({
        title: "Error",
        description: "Failed to load moderation results",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (resultId: string, action: 'approve' | 'reject' | 'review', notes?: string) => {
    try {
      setResults(prev => prev.map(result => 
        result.id === resultId 
          ? { ...result, status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'reviewed', moderator_notes: notes }
          : result
      ));

      toast({
        title: "Success",
        description: `Comment ${action}d successfully`
      });
    } catch (error) {
      console.error('Error processing moderation action:', error);
      toast({
        title: "Error",
        description: "Failed to process action",
        variant: "destructive"
      });
    }
  };

  const updateSettings = (newSettings: Partial<AIModerationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    onSettingsUpdate?.(updatedSettings);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 0.8) return <Badge className="bg-green-100 text-green-800">Safe</Badge>;
    if (score >= 0.5) return <Badge className="bg-yellow-100 text-yellow-800">Review</Badge>;
    return <Badge className="bg-red-100 text-red-800">Flagged</Badge>;
  };

  const filteredResults = results.filter(result => {
    switch (activeTab) {
      case 'pending':
        return result.status === 'pending';
      case 'approved':
        return result.status === 'approved';
      case 'flagged':
        return result.status === 'rejected' || result.ai_score < 0.5;
      default:
        return true;
    }
  });

  if (loading) {
    return <div className="animate-pulse">Loading AI moderation data...</div>;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Content Moderation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">
                Pending ({results.filter(r => r.status === 'pending').length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({results.filter(r => r.status === 'approved').length})
              </TabsTrigger>
              <TabsTrigger value="flagged">
                Flagged ({results.filter(r => r.status === 'rejected' || r.ai_score < 0.5).length})
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {filteredResults.map(result => (
                <Card key={result.id} className="border-l-4 border-l-yellow-500">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={result.author.avatar} />
                        <AvatarFallback>
                          {result.author.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{result.author.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(result.created_at))} ago
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getScoreBadge(result.ai_score)}
                            <Badge variant="outline">
                              {Math.round(result.confidence * 100)}% confidence
                            </Badge>
                          </div>
                        </div>

                        <p className="text-sm text-foreground p-3 bg-muted/50 rounded-md">
                          {result.content}
                        </p>

                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">AI Score:</span>
                              <span className={`text-sm font-bold ${getScoreColor(result.ai_score)}`}>
                                {Math.round(result.ai_score * 100)}%
                              </span>
                            </div>
                            <Progress value={result.ai_score * 100} className="h-2" />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Suggested: <span className="font-medium">{result.suggested_action}</span>
                          </div>
                        </div>

                        {result.flags.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground">Detected Issues:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {result.flags.map((flag, index) => (
                                <div key={index} className="p-2 bg-red-50 rounded-md border border-red-200">
                                  <div className="flex items-center gap-2 mb-1">
                                    <AlertTriangle className="h-3 w-3 text-red-600" />
                                    <span className="text-xs font-medium text-red-800 capitalize">
                                      {flag.type.replace('_', ' ')}
                                    </span>
                                    <Badge variant="destructive" className="text-xs">
                                      {flag.severity}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-red-700">{flag.reason}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-2 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => handleAction(result.id, 'approve')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleAction(result.id, 'reject')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(result.id, 'review', 'Requires manual review')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review Later
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              {filteredResults.map(result => (
                <Card key={result.id} className="border-l-4 border-l-green-500 opacity-75">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={result.author.avatar} />
                        <AvatarFallback className="text-xs">
                          {result.author.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{result.author.name}</p>
                            <Badge className="bg-green-100 text-green-800">Approved</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(result.created_at))} ago
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">{result.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="flagged" className="space-y-4">
              {filteredResults.map(result => (
                <Card key={result.id} className="border-l-4 border-l-red-500">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={result.author.avatar} />
                        <AvatarFallback className="text-xs">
                          {result.author.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{result.author.name}</p>
                            <Badge variant="destructive">Flagged</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(result.created_at))} ago
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground line-through">{result.content}</p>
                        {result.moderator_notes && (
                          <p className="text-xs text-red-600 mt-2 italic">
                            Note: {result.moderator_notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI Moderation Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* General Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="ai-enabled" className="text-base font-medium">
                          Enable AI Moderation
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically analyze comments for harmful content
                        </p>
                      </div>
                      <Switch
                        id="ai-enabled"
                        checked={settings.enabled}
                        onCheckedChange={(enabled) => updateSettings({ enabled })}
                      />
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">
                          Auto-approve threshold ({Math.round(settings.auto_approve_threshold * 100)}%)
                        </Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Comments scoring above this threshold are automatically approved
                        </p>
                        <Slider
                          value={[settings.auto_approve_threshold]}
                          onValueChange={([value]) => updateSettings({ auto_approve_threshold: value })}
                          min={0.5}
                          max={1}
                          step={0.05}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">
                          Auto-hide threshold ({Math.round(settings.auto_hide_threshold * 100)}%)
                        </Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Comments scoring below this threshold are automatically hidden
                        </p>
                        <Slider
                          value={[settings.auto_hide_threshold]}
                          onValueChange={([value]) => updateSettings({ auto_hide_threshold: value })}
                          min={0}
                          max={0.5}
                          step={0.05}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Detection Sensitivity */}
                  <div className="space-y-4">
                    <h4 className="text-base font-medium">Detection Sensitivity</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(settings.sensitivity).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <Label className="text-sm capitalize">
                            {key.replace('_', ' ')} ({Math.round(value * 100)}%)
                          </Label>
                          <Slider
                            value={[value]}
                            onValueChange={([newValue]) => updateSettings({
                              sensitivity: { ...settings.sensitivity, [key]: newValue }
                            })}
                            min={0}
                            max={1}
                            step={0.1}
                            className="w-full"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notification Settings */}
                  <div className="space-y-4">
                    <h4 className="text-base font-medium">Notifications</h4>
                    <div className="space-y-3">
                      {Object.entries(settings.notifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <Label htmlFor={key} className="text-sm capitalize">
                            {key.replace(/_/g, ' ')}
                          </Label>
                          <Switch
                            id={key}
                            checked={value}
                            onCheckedChange={(checked) => updateSettings({
                              notifications: { ...settings.notifications, [key]: checked }
                            })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};