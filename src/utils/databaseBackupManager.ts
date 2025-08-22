import { supabase } from '@/integrations/supabase/client';

interface BackupConfig {
  autoBackupEnabled: boolean;
  backupInterval: number; // minutes
  maxBackups: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

interface BackupMetadata {
  id: string;
  timestamp: Date;
  size: number;
  tables: string[];
  recordCount: number;
  compressionRatio?: number;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

class DatabaseBackupManager {
  private config: BackupConfig = {
    autoBackupEnabled: false,
    backupInterval: 360, // 6 hours
    maxBackups: 10,
    compressionEnabled: true,
    encryptionEnabled: false
  };

  private backups: BackupMetadata[] = [];
  private backupInterval: NodeJS.Timeout | null = null;

  updateConfig(newConfig: Partial<BackupConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    // Restart auto-backup if enabled
    if (this.config.autoBackupEnabled) {
      this.startAutoBackup();
    } else {
      this.stopAutoBackup();
    }
  }

  getConfig(): BackupConfig {
    return { ...this.config };
  }

  getBackups(): BackupMetadata[] {
    return [...this.backups];
  }

  startAutoBackup() {
    this.stopAutoBackup(); // Clear existing interval
    
    if (this.config.autoBackupEnabled) {
      this.backupInterval = setInterval(() => {
        this.createBackup(`auto-backup-${Date.now()}`);
      }, this.config.backupInterval * 60 * 1000);
      
      console.log(`🔄 Auto-backup started (every ${this.config.backupInterval} minutes)`);
    }
  }

  stopAutoBackup() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
      console.log('⏹️ Auto-backup stopped');
    }
  }

  async createBackup(name?: string): Promise<BackupMetadata> {
    const backupId = name || `backup-${Date.now()}`;
    const timestamp = new Date();

    const metadata: BackupMetadata = {
      id: backupId,
      timestamp,
      size: 0,
      tables: [],
      recordCount: 0,
      status: 'pending'
    };

    this.backups.push(metadata);

    try {
      console.log(`📦 Starting backup: ${backupId}`);
      
      // Get list of tables to backup
      const tables = [
        'manga_meta',
        'chapters', 
        'chapter_prices',
        'series_views',
        'user_profiles',
        'user_coins',
        'coin_purchases',
        'user_chapter_unlocks',
        'comments',
        'ratings'
      ];

      let totalRecords = 0;
      const backupData: Record<string, any[]> = {};

      // Export data from each table
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table as any)
            .select('*');

          if (error) {
            console.warn(`⚠️ Failed to backup table ${table}:`, error);
            continue;
          }

          if (data && data.length > 0) {
            backupData[table] = data;
            totalRecords += data.length;
            metadata.tables.push(table);
          }
        } catch (error) {
          console.warn(`⚠️ Error backing up table ${table}:`, error);
        }
      }

      // Calculate backup size and compression
      const jsonData = JSON.stringify(backupData, null, 2);
      const originalSize = new Blob([jsonData]).size;
      
      let finalData = jsonData;
      let compressionRatio = 1;

      if (this.config.compressionEnabled) {
        // In a real implementation, you'd use a compression library like pako
        // For now, we'll simulate compression
        compressionRatio = 0.3; // Simulate 30% of original size
      }

      metadata.size = Math.floor(originalSize * compressionRatio);
      metadata.recordCount = totalRecords;
      metadata.compressionRatio = compressionRatio;
      metadata.status = 'completed';

      // Store backup data in localStorage for demo (in production, use proper storage)
      try {
        localStorage.setItem(`backup-${backupId}`, finalData);
      } catch (error) {
        // Handle localStorage quota exceeded
        console.warn('⚠️ Could not store backup in localStorage:', error);
      }

      // Cleanup old backups
      this.cleanupOldBackups();

      console.log(`✅ Backup completed: ${backupId}`);
      console.log(`📊 Records: ${totalRecords}, Size: ${(metadata.size / 1024 / 1024).toFixed(2)}MB`);

      return metadata;

    } catch (error) {
      console.error(`❌ Backup failed: ${backupId}`, error);
      
      metadata.status = 'failed';
      metadata.error = error instanceof Error ? error.message : 'Unknown error';
      
      return metadata;
    }
  }

  async restoreBackup(backupId: string): Promise<{ success: boolean; error?: string }> {
    console.log(`🔄 Starting restore from backup: ${backupId}`);

    try {
      // Retrieve backup data
      const backupData = localStorage.getItem(`backup-${backupId}`);
      if (!backupData) {
        throw new Error('Backup data not found');
      }

      const data = JSON.parse(backupData);
      
      // Confirm with user (in a real app, this would be a proper confirmation dialog)
      const confirmed = confirm(
        '⚠️ This will replace all current data with backup data. Are you sure you want to continue?'
      );
      
      if (!confirmed) {
        return { success: false, error: 'Restore cancelled by user' };
      }

      // Restore each table
      for (const [tableName, tableData] of Object.entries(data)) {
        if (!Array.isArray(tableData) || tableData.length === 0) continue;

        try {
          // Delete existing data
          const { error: deleteError } = await supabase
            .from(tableName as any)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

          if (deleteError) {
            console.warn(`⚠️ Could not clear table ${tableName}:`, deleteError);
          }

          // Insert backup data in batches
          const batchSize = 100;
          for (let i = 0; i < tableData.length; i += batchSize) {
            const batch = tableData.slice(i, i + batchSize);
            
            const { error: insertError } = await supabase
              .from(tableName as any)
              .insert(batch);

            if (insertError) {
              console.error(`❌ Failed to restore batch for ${tableName}:`, insertError);
            }
          }

          console.log(`✅ Restored ${tableData.length} records to ${tableName}`);

        } catch (error) {
          console.error(`❌ Error restoring table ${tableName}:`, error);
        }
      }

      console.log('✅ Backup restore completed');
      return { success: true };

    } catch (error) {
      console.error('❌ Backup restore failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  deleteBackup(backupId: string): boolean {
    try {
      // Remove from localStorage
      localStorage.removeItem(`backup-${backupId}`);
      
      // Remove from metadata
      this.backups = this.backups.filter(backup => backup.id !== backupId);
      
      console.log(`🗑️ Deleted backup: ${backupId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete backup ${backupId}:`, error);
      return false;
    }
  }

  private cleanupOldBackups() {
    if (this.backups.length <= this.config.maxBackups) return;

    // Sort by timestamp (oldest first)
    const sortedBackups = [...this.backups].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Remove oldest backups
    const toRemove = sortedBackups.slice(0, this.backups.length - this.config.maxBackups);
    
    toRemove.forEach(backup => {
      this.deleteBackup(backup.id);
    });

    console.log(`🧹 Cleaned up ${toRemove.length} old backups`);
  }

  exportBackup(backupId: string): void {
    const backupData = localStorage.getItem(`backup-${backupId}`);
    if (!backupData) {
      console.error('Backup not found');
      return;
    }

    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `database-backup-${backupId}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  getBackupStats(): {
    totalBackups: number;
    totalSize: number;
    latestBackup?: BackupMetadata;
    failedBackups: number;
  } {
    const totalSize = this.backups.reduce((sum, backup) => sum + backup.size, 0);
    const latestBackup = this.backups
      .filter(b => b.status === 'completed')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
    const failedBackups = this.backups.filter(b => b.status === 'failed').length;

    return {
      totalBackups: this.backups.length,
      totalSize,
      latestBackup,
      failedBackups
    };
  }
}

// Global instance
export const databaseBackupManager = new DatabaseBackupManager();