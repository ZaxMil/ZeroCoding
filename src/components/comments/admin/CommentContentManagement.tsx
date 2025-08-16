import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Settings, 
  Shield, 
  Clock, 
  Users, 
  MessageSquare,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock
} from 'lucide-react';

interface CommentSettings {
  moderation_enabled: boolean;
  auto_approve: boolean;
  require_approval: boolean;
  max_comment_length: number;
  allow_anonymous: boolean;
  allow_replies: boolean;
  allow_mentions: boolean;
  spam_filter_enabled: boolean;
  profanity_filter_enabled: boolean;
  rate_limit_enabled: boolean;
  rate_limit_count: number;
  rate_limit_window: number;
}

interface WordFilter {
  id: string;
  word: string;
  action: 'block' | 'flag' | 'replace';
  replacement?: string;
  created_at: string;
}

export const CommentContentManagement: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<CommentSettings>({
    moderation_enabled: true,
    auto_approve: false,
    require_approval: true,
    max_comment_length: 1000,
    allow_anonymous: false,
    allow_replies: true,
    allow_mentions: true,
    spam_filter_enabled: true,
    profanity_filter_enabled: true,
    rate_limit_enabled: true,
    rate_limit_count: 5,
    rate_limit_window: 60
  });

  const [wordFilters, setWordFilters] = useState<WordFilter[]>([]);
  const [newWord, setNewWord] = useState('');
  const [newAction, setNewAction] = useState<'block' | 'flag' | 'replace'>('block');
  const [newReplacement, setNewReplacement] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
    loadWordFilters();
  }, []);

  const loadSettings = async () => {
    try {
      // Since we don't have a settings table, we'll use mock data
      // In a real implementation, you'd load from a settings table
      console.log('Loading comment settings...');
      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setLoading(false);
    }
  };

  const loadWordFilters = async () => {
    try {
      // Mock word filters - in real implementation, load from database
      const mockFilters: WordFilter[] = [
        { id: '1', word: 'spam', action: 'block', created_at: new Date().toISOString() },
        { id: '2', word: 'inappropriate', action: 'flag', created_at: new Date().toISOString() },
        { id: '3', word: 'badword', action: 'replace', replacement: '***', created_at: new Date().toISOString() }
      ];
      setWordFilters(mockFilters);
    } catch (error) {
      console.error('Error loading word filters:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Mock save - in real implementation, save to database
      console.log('Saving settings:', settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addWordFilter = async () => {
    if (!newWord.trim()) return;

    try {
      const newFilter: WordFilter = {
        id: Date.now().toString(),
        word: newWord.toLowerCase(),
        action: newAction,
        replacement: newAction === 'replace' ? newReplacement : undefined,
        created_at: new Date().toISOString()
      };

      setWordFilters([...wordFilters, newFilter]);
      setNewWord('');
      setNewReplacement('');
      toast.success('Word filter added');
    } catch (error) {
      console.error('Error adding word filter:', error);
      toast.error('Failed to add word filter');
    }
  };

  const removeWordFilter = async (filterId: string) => {
    try {
      setWordFilters(wordFilters.filter(f => f.id !== filterId));
      toast.success('Word filter removed');
    } catch (error) {
      console.error('Error removing word filter:', error);
      toast.error('Failed to remove word filter');
    }
  };

  const updateSetting = (key: keyof CommentSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
        <h2 className="text-2xl font-bold">Comment Content Management</h2>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="moderation">Moderation Enabled</Label>
                  <p className="text-sm text-muted-foreground">Enable comment moderation</p>
                </div>
                <Switch
                  id="moderation"
                  checked={settings.moderation_enabled}
                  onCheckedChange={(checked) => updateSetting('moderation_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-approve">Auto Approve</Label>
                  <p className="text-sm text-muted-foreground">Automatically approve comments</p>
                </div>
                <Switch
                  id="auto-approve"
                  checked={settings.auto_approve}
                  onCheckedChange={(checked) => updateSetting('auto_approve', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="require-approval">Require Approval</Label>
                  <p className="text-sm text-muted-foreground">All comments need approval</p>
                </div>
                <Switch
                  id="require-approval"
                  checked={settings.require_approval}
                  onCheckedChange={(checked) => updateSetting('require_approval', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-length">Max Comment Length</Label>
                <Input
                  id="max-length"
                  type="number"
                  value={settings.max_comment_length}
                  onChange={(e) => updateSetting('max_comment_length', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="anonymous">Allow Anonymous</Label>
                  <p className="text-sm text-muted-foreground">Allow anonymous comments</p>
                </div>
                <Switch
                  id="anonymous"
                  checked={settings.allow_anonymous}
                  onCheckedChange={(checked) => updateSetting('allow_anonymous', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="replies">Allow Replies</Label>
                  <p className="text-sm text-muted-foreground">Enable comment replies</p>
                </div>
                <Switch
                  id="replies"
                  checked={settings.allow_replies}
                  onCheckedChange={(checked) => updateSetting('allow_replies', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="mentions">Allow Mentions</Label>
                  <p className="text-sm text-muted-foreground">Enable user mentions</p>
                </div>
                <Switch
                  id="mentions"
                  checked={settings.allow_mentions}
                  onCheckedChange={(checked) => updateSetting('allow_mentions', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Filtering */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Content Filtering
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="spam-filter">Spam Filter</Label>
                  <p className="text-sm text-muted-foreground">Automatically detect spam</p>
                </div>
                <Switch
                  id="spam-filter"
                  checked={settings.spam_filter_enabled}
                  onCheckedChange={(checked) => updateSetting('spam_filter_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="profanity-filter">Profanity Filter</Label>
                  <p className="text-sm text-muted-foreground">Filter inappropriate language</p>
                </div>
                <Switch
                  id="profanity-filter"
                  checked={settings.profanity_filter_enabled}
                  onCheckedChange={(checked) => updateSetting('profanity_filter_enabled', checked)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="rate-limit">Rate Limiting</Label>
                  <p className="text-sm text-muted-foreground">Limit comment frequency</p>
                </div>
                <Switch
                  id="rate-limit"
                  checked={settings.rate_limit_enabled}
                  onCheckedChange={(checked) => updateSetting('rate_limit_enabled', checked)}
                />
              </div>

              {settings.rate_limit_enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rate-count">Max Comments</Label>
                    <Input
                      id="rate-count"
                      type="number"
                      value={settings.rate_limit_count}
                      onChange={(e) => updateSetting('rate_limit_count', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rate-window">Time Window (seconds)</Label>
                    <Input
                      id="rate-window"
                      type="number"
                      value={settings.rate_limit_window}
                      onChange={(e) => updateSetting('rate_limit_window', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Word Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Word Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Word to filter"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
            />
            <Select value={newAction} onValueChange={(value: 'block' | 'flag' | 'replace') => setNewAction(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="block">Block</SelectItem>
                <SelectItem value="flag">Flag for Review</SelectItem>
                <SelectItem value="replace">Replace</SelectItem>
              </SelectContent>
            </Select>
            {newAction === 'replace' && (
              <Input
                placeholder="Replacement text"
                value={newReplacement}
                onChange={(e) => setNewReplacement(e.target.value)}
              />
            )}
            <Button onClick={addWordFilter} disabled={!newWord.trim()}>
              Add Filter
            </Button>
          </div>

          <div className="space-y-2">
            {wordFilters.map((filter) => (
              <div key={filter.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <code className="bg-muted px-2 py-1 rounded text-sm">{filter.word}</code>
                  <Badge variant={
                    filter.action === 'block' ? 'destructive' : 
                    filter.action === 'flag' ? 'secondary' : 
                    'default'
                  }>
                    {filter.action}
                  </Badge>
                  {filter.replacement && (
                    <span className="text-sm text-muted-foreground">
                      → "{filter.replacement}"
                    </span>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => removeWordFilter(filter.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {wordFilters.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No word filters configured
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};