import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Clock, 
  HardDrive,
  RefreshCw,
  Settings,
  Shield,
  Archive
} from 'lucide-react';
import { databaseBackupManager } from '@/utils/databaseBackupManager';

export const DatabaseBackupPanel: React.FC = () => {
  const [config, setConfig] = useState(databaseBackupManager.getConfig());
  const [backups, setBackups] = useState(databaseBackupManager.getBackups());
  const [stats, setStats] = useState(databaseBackupManager.getBackupStats());
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [newBackupName, setNewBackupName] = useState('');
  const { toast } = useToast();

  const refreshData = () => {
    setBackups(databaseBackupManager.getBackups());
    setStats(databaseBackupManager.getBackupStats());
  };

  useEffect(() => {
    refreshData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleConfigChange = (key: keyof typeof config, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    databaseBackupManager.updateConfig(newConfig);
    
    toast({
      title: "Configuration Updated",
      description: `Backup ${key} has been updated`,
    });
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const backup = await databaseBackupManager.createBackup(newBackupName || undefined);
      
      if (backup.status === 'completed') {
        toast({
          title: "Backup Created",
          description: `Successfully created backup with ${backup.recordCount.toLocaleString()} records`,
        });
        setNewBackupName('');
      } else {
        toast({
          title: "Backup Failed",
          description: backup.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
      
      refreshData();
    } catch (error) {
      toast({
        title: "Backup Error",
        description: "Failed to create backup",
        variant: "destructive"
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestore = async (backupId: string) => {
    setIsRestoring(true);
    try {
      const result = await databaseBackupManager.restoreBackup(backupId);
      
      if (result.success) {
        toast({
          title: "Restore Completed",
          description: "Database has been restored from backup",
        });
        
        // Reload page to reflect restored data
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast({
          title: "Restore Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Restore Error",
        description: "Failed to restore from backup",
        variant: "destructive"
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDelete = (backupId: string) => {
    if (confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      const success = databaseBackupManager.deleteBackup(backupId);
      
      if (success) {
        toast({
          title: "Backup Deleted",
          description: "Backup has been successfully deleted",
        });
        refreshData();
      } else {
        toast({
          title: "Delete Failed",
          description: "Failed to delete backup",
          variant: "destructive"
        });
      }
    }
  };

  const handleExport = (backupId: string) => {
    databaseBackupManager.exportBackup(backupId);
    toast({
      title: "Export Started",
      description: "Backup download will begin shortly",
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Database Backup Manager</h2>
        <p className="text-muted-foreground">Automated backup and restore system for data protection</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Backups</p>
                <p className="text-2xl font-semibold">{stats.totalBackups}</p>
              </div>
              <Archive className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Size</p>
                <p className="text-2xl font-semibold">{formatSize(stats.totalSize)}</p>
              </div>
              <HardDrive className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Latest Backup</p>
                <p className="text-sm font-medium">
                  {stats.latestBackup ? stats.latestBackup.timestamp.toLocaleDateString() : 'None'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed Backups</p>
                <p className={`text-2xl font-semibold ${stats.failedBackups > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {stats.failedBackups}
                </p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Backup Configuration
            </CardTitle>
            <CardDescription>Configure automatic backup settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-backup">Auto Backup</Label>
              <Switch
                id="auto-backup"
                checked={config.autoBackupEnabled}
                onCheckedChange={(checked) => handleConfigChange('autoBackupEnabled', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backup-interval">Backup Interval (minutes)</Label>
              <Input
                id="backup-interval"
                type="number"
                value={config.backupInterval}
                onChange={(e) => handleConfigChange('backupInterval', parseInt(e.target.value))}
                min={30}
                max={1440}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-backups">Max Backups to Keep</Label>
              <Input
                id="max-backups"
                type="number"
                value={config.maxBackups}
                onChange={(e) => handleConfigChange('maxBackups', parseInt(e.target.value))}
                min={1}
                max={50}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="compression">Enable Compression</Label>
              <Switch
                id="compression"
                checked={config.compressionEnabled}
                onCheckedChange={(checked) => handleConfigChange('compressionEnabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Create Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Create New Backup
            </CardTitle>
            <CardDescription>Manually create a database backup</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backup-name">Backup Name (optional)</Label>
              <Input
                id="backup-name"
                placeholder="Enter backup name..."
                value={newBackupName}
                onChange={(e) => setNewBackupName(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleCreateBackup} 
              disabled={isCreatingBackup}
              className="w-full"
            >
              {isCreatingBackup ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Create Backup
                </>
              )}
            </Button>

            <Alert>
              <AlertDescription>
                Backups include all series, chapters, user data, and system settings.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Backup List */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Backups</CardTitle>
          <CardDescription>Manage and restore from existing backups</CardDescription>
        </CardHeader>
        <CardContent>
          {backups.length > 0 ? (
            <div className="space-y-3">
              {backups
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .map((backup) => (
                <div key={backup.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{backup.id}</h4>
                      <Badge className={getStatusColor(backup.status)}>
                        {backup.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {backup.timestamp.toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-muted-foreground">Size: </span>
                      <span className="font-medium">{formatSize(backup.size)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Records: </span>
                      <span className="font-medium">{backup.recordCount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tables: </span>
                      <span className="font-medium">{backup.tables.length}</span>
                    </div>
                    {backup.compressionRatio && (
                      <div>
                        <span className="text-muted-foreground">Compression: </span>
                        <span className="font-medium">{Math.round((1 - backup.compressionRatio) * 100)}%</span>
                      </div>
                    )}
                  </div>

                  {backup.error && (
                    <Alert className="mb-3">
                      <AlertDescription>{backup.error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport(backup.id)}
                      disabled={backup.status !== 'completed'}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestore(backup.id)}
                      disabled={backup.status !== 'completed' || isRestoring}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Restore
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(backup.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No backups available</p>
              <p className="text-sm text-muted-foreground">Create your first backup to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};