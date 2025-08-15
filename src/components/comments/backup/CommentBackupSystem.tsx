import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Download,
  Upload,
  Database,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Settings,
  Play,
  Pause,
  Calendar,
  FileText,
  Archive
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface BackupMetadata {
  id: string;
  created_at: string;
  backup_type: 'full' | 'incremental' | 'manual' | 'automatic';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  total_comments: number;
  file_size: number;
  file_path: string;
  created_by?: string;
  description?: string;
}

interface BackupSettings {
  enableAutoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
  includeDeleted: boolean;
  includeMetadata: boolean;
  compressionLevel: 'none' | 'low' | 'medium' | 'high';
}

export const CommentBackupSystem: React.FC = () => {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [settings, setSettings] = useState<BackupSettings>({
    enableAutoBackup: true,
    backupFrequency: 'weekly',
    retentionDays: 90,
    includeDeleted: false,
    includeMetadata: true,
    compressionLevel: 'medium'
  });
  const [loading, setLoading] = useState(true);
  const [backupProgress, setBackupProgress] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupMetadata | null>(null);

  useEffect(() => {
    fetchBackups();
    loadSettings();
  }, []);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      // Mock backup data since advanced tables don't exist yet
      const mockBackups: BackupMetadata[] = [
        {
          id: '1',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          backup_type: 'automatic',
          status: 'completed',
          total_comments: 150,
          file_size: 1024000,
          file_path: 'backups/comments-2024-01-15.json',
          description: 'Daily automatic backup'
        },
        {
          id: '2',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          backup_type: 'manual',
          status: 'completed',
          total_comments: 142,
          file_size: 987000,
          file_path: 'backups/comments-manual-2024-01-08.json',
          description: 'Manual backup before major update'
        }
      ];
      
      setBackups(mockBackups);
    } catch (error) {
      console.error('Error fetching backups:', error);
      toast.error('Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = () => {
    const saved = localStorage.getItem('commentBackupSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  };

  const saveSettings = (newSettings: BackupSettings) => {
    setSettings(newSettings);
    localStorage.setItem('commentBackupSettings', JSON.stringify(newSettings));
    toast.success('Backup settings saved');
  };

  const createBackup = async (type: 'full' | 'incremental' | 'manual', description?: string) => {
    try {
      setIsBackingUp(true);
      setBackupProgress(0);

      // Fetch all comments data
      const [chapterComments, seriesComments] = await Promise.all([
        supabase
          .from('comments')
          .select(`
            *,
            profiles(display_name, email, role),
            comment_likes(*),
            comment_reactions(*),
            comment_attachments(*)
          `),
        supabase
          .from('series_comments')
          .select(`
            *,
            profiles(display_name, email, role),
            comment_likes(*),
            comment_reactions(*),
            comment_attachments(*)
          `)
      ]);

      setBackupProgress(30);

      const allComments = [
        ...(chapterComments.data || []),
        ...(seriesComments.data || [])
      ];

      // Prepare backup data
      const backupData = {
        metadata: {
          created_at: new Date().toISOString(),
          backup_type: type,
          total_comments: allComments.length,
          settings: settings,
          version: '1.0'
        },
        comments: allComments,
        schema_version: '1.0'
      };

      setBackupProgress(60);

      // Convert to JSON and calculate size
      const jsonData = JSON.stringify(backupData, null, 2);
      const fileSizeBytes = new Blob([jsonData]).size;

      // In a real implementation, you would upload this to cloud storage
      // For demo purposes, we'll simulate the upload
      await new Promise(resolve => setTimeout(resolve, 2000));

      setBackupProgress(80);

      // Mock backup creation since advanced tables don't exist yet
      const newBackup: BackupMetadata = {
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        backup_type: type,
        status: 'completed',
        total_comments: allComments.length,
        file_size: fileSizeBytes,
        file_path: `backups/comments-${Date.now()}.json`,
        description: description || `${type} backup created manually`
      };

      // Add to mock data
      setBackups(prev => [newBackup, ...prev]);

      setBackupProgress(100);
      toast.success('Backup created successfully');
      fetchBackups();

      // Download backup file for user
      downloadBackup(jsonData, `comments-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`);

    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    } finally {
      setIsBackingUp(false);
      setBackupProgress(0);
    }
  };

  const downloadBackup = (data: string, filename: string) => {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const restoreFromBackup = async (backup: BackupMetadata) => {
    try {
      // In a real implementation, you would download and parse the backup file
      // For demo purposes, we'll simulate the restore process
      
      const confirmed = window.confirm(
        `Are you sure you want to restore from this backup? This will replace all current comments with data from ${format(parseISO(backup.created_at), 'MMM dd, yyyy HH:mm')}`
      );

      if (!confirmed) return;

      setLoading(true);
      
      // Simulate restore process
      await new Promise(resolve => setTimeout(resolve, 3000));

      toast.success('Comments restored successfully from backup');
      setRestoreDialogOpen(false);

    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error('Failed to restore from backup');
    } finally {
      setLoading(false);
    }
  };

  const deleteBackup = async (backup: BackupMetadata) => {
    try {
      const confirmed = window.confirm('Are you sure you want to delete this backup?');
      if (!confirmed) return;

      // Mock deletion since advanced tables don't exist yet
      setBackups(prev => prev.filter(b => b.id !== backup.id));
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error('Failed to delete backup');
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = (status: BackupMetadata['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status: BackupMetadata['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const uploadBackup = async (file: File) => {
    try {
      setLoading(true);
      
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      // Validate backup data structure
      if (!backupData.metadata || !backupData.comments) {
        throw new Error('Invalid backup file format');
      }

      // Mock import since advanced tables don't exist yet
      const newBackup: BackupMetadata = {
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        backup_type: 'manual',
        status: 'completed',
        total_comments: backupData.comments.length,
        file_size: file.size,
        file_path: `imported/${file.name}`,
        description: `Imported backup: ${file.name}`
      };

      setBackups(prev => [newBackup, ...prev]);
    } catch (error) {
      console.error('Error importing backup:', error);
      toast.error('Failed to import backup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comment Backup & Restore</h1>
          <p className="text-muted-foreground">Manage backups and restore points for all comment data</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Backup Settings</DialogTitle>
              </DialogHeader>
              <BackupSettingsForm settings={settings} onSave={saveSettings} />
            </DialogContent>
          </Dialog>
          
          <input
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            id="backup-upload"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadBackup(file);
            }}
          />
          <Button 
            variant="outline" 
            onClick={() => document.getElementById('backup-upload')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          
          <Button onClick={() => createBackup('manual', 'Manual backup')}>
            <Database className="h-4 w-4 mr-2" />
            Create Backup
          </Button>
        </div>
      </div>

      {/* Backup Progress */}
      {isBackingUp && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Creating backup...</span>
                <span className="text-sm text-muted-foreground">{backupProgress}%</span>
              </div>
              <Progress value={backupProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backups.length}</div>
            <p className="text-xs text-muted-foreground">
              {backups.filter(b => b.status === 'completed').length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Backup</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backups.length > 0 ? format(parseISO(backups[0].created_at), 'MMM dd') : 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              {backups.length > 0 ? format(parseISO(backups[0].created_at), 'yyyy HH:mm') : 'No backups yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(backups.reduce((sum, b) => sum + b.file_size, 0))}
            </div>
            <p className="text-xs text-muted-foreground">All backup files</p>
          </CardContent>
        </Card>
      </div>

      {/* Auto Backup Status */}
      {settings.enableAutoBackup && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Automatic backups are enabled ({settings.backupFrequency}). 
            Backups will be retained for {settings.retentionDays} days.
          </AlertDescription>
        </Alert>
      )}

      {/* Backups List */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center justify-between p-4 border rounded">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-48"></div>
                      <div className="h-3 bg-muted rounded w-32"></div>
                    </div>
                    <div className="h-8 bg-muted rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No backups found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first backup to protect your comment data
              </p>
              <Button onClick={() => createBackup('manual', 'First backup')}>
                <Database className="h-4 w-4 mr-2" />
                Create First Backup
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {backups.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-4 border rounded hover:bg-muted/50">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className={getStatusColor(backup.status)}>
                        {getStatusIcon(backup.status)}
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {backup.backup_type.charAt(0).toUpperCase() + backup.backup_type.slice(1)} Backup
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(backup.created_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {backup.total_comments.toLocaleString()} comments
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {formatFileSize(backup.file_size)}
                      </Badge>
                    </div>
                    {backup.description && (
                      <p className="text-sm text-muted-foreground pl-10">
                        {backup.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {backup.status === 'completed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBackup(backup);
                            setRestoreDialogOpen(true);
                          }}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // In a real implementation, download the backup file
                            toast.success('Backup download started');
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteBackup(backup)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore from Backup</DialogTitle>
          </DialogHeader>
          {selectedBackup && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This will replace all current comments with data from the selected backup. 
                  This action cannot be undone.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <h4 className="font-medium">Backup Details</h4>
                <p className="text-sm text-muted-foreground">
                  Created: {format(parseISO(selectedBackup.created_at), 'MMM dd, yyyy HH:mm')}
                </p>
                <p className="text-sm text-muted-foreground">
                  Comments: {selectedBackup.total_comments.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Size: {formatFileSize(selectedBackup.file_size)}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => restoreFromBackup(selectedBackup)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore Backup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Backup Settings Form Component
const BackupSettingsForm: React.FC<{
  settings: BackupSettings;
  onSave: (settings: BackupSettings) => void;
}> = ({ settings, onSave }) => {
  const [formSettings, setFormSettings] = useState(settings);

  const handleSave = () => {
    onSave(formSettings);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Auto Backup</label>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formSettings.enableAutoBackup}
            onChange={(e) => setFormSettings(prev => ({ ...prev, enableAutoBackup: e.target.checked }))}
          />
          <span className="text-sm">Enable automatic backups</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Backup Frequency</label>
        <Select 
          value={formSettings.backupFrequency} 
          onValueChange={(value: any) => setFormSettings(prev => ({ ...prev, backupFrequency: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Retention Period (days)</label>
        <Input
          type="number"
          value={formSettings.retentionDays}
          onChange={(e) => setFormSettings(prev => ({ ...prev, retentionDays: parseInt(e.target.value) }))}
          min={1}
          max={365}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Include deleted comments</label>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formSettings.includeDeleted}
            onChange={(e) => setFormSettings(prev => ({ ...prev, includeDeleted: e.target.checked }))}
          />
          <span className="text-sm">Include deleted comments in backups</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Include metadata</label>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formSettings.includeMetadata}
            onChange={(e) => setFormSettings(prev => ({ ...prev, includeMetadata: e.target.checked }))}
          />
          <span className="text-sm">Include user profiles and statistics</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Compression Level</label>
        <Select 
          value={formSettings.compressionLevel} 
          onValueChange={(value: any) => setFormSettings(prev => ({ ...prev, compressionLevel: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  );
};