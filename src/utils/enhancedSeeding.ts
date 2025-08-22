import { runComprehensiveProductionReset } from './comprehensiveProductionReset';
import { dbPerformanceMonitor } from './databasePerformanceMonitor';
import { connectionPoolManager } from './connectionPoolManager';
import { databaseBackupManager } from './databaseBackupManager';

interface EnhancedSeedingResult {
  success: boolean;
  stats: any;
  performance: {
    averageQueryTime: number;
    totalQueries: number;
    errorRate: number;
    totalSeedingTime: number;
    connectionStats: any;
  };
  backupCreated?: string;
  error?: string;
}

export const runEnhancedSeeding = async (
  options: {
    createBackupBefore?: boolean;
    monitorPerformance?: boolean;
    batchSize?: number;
  } = {}
): Promise<EnhancedSeedingResult> => {
  const {
    createBackupBefore = true,
    monitorPerformance = true,
    batchSize = 50
  } = options;

  let backupId: string | undefined;

  try {
    console.log('🚀 Starting enhanced database seeding...');

    // Create backup before seeding if requested
    if (createBackupBefore) {
      console.log('📦 Creating backup before seeding...');
      const backup = await databaseBackupManager.createBackup(`pre-seed-backup-${Date.now()}`);
      if (backup.status === 'completed') {
        backupId = backup.id;
        console.log(`✅ Backup created: ${backupId}`);
      } else {
        console.warn('⚠️ Backup creation failed, continuing without backup');
      }
    }

    // Enable performance monitoring
    if (monitorPerformance) {
      dbPerformanceMonitor.enable();
      dbPerformanceMonitor.clear();
    }

    const startTime = performance.now();

    // Execute the comprehensive seeding with performance tracking
    const seedingResult = monitorPerformance 
      ? await dbPerformanceMonitor.executeOptimizedSeeding(
          runComprehensiveProductionReset,
          batchSize
        )
      : await runComprehensiveProductionReset();

    const endTime = performance.now();
    const totalSeedingTime = endTime - startTime;

    // Get performance stats
    const performanceStats = monitorPerformance 
      ? dbPerformanceMonitor.getStats() 
      : {
          averageQueryTime: 0,
          totalQueries: 0,
          errorRate: 0,
          queriesPerSecond: 0,
          tableStats: {}
        };

    // Get connection stats
    const connectionStats = connectionPoolManager.getStats();

    console.log('✅ Enhanced seeding completed successfully!');
    console.log(`📊 Performance Summary:`);
    console.log(`   - Total time: ${totalSeedingTime.toFixed(2)}ms`);
    console.log(`   - Average query time: ${performanceStats.averageQueryTime.toFixed(2)}ms`);
    console.log(`   - Total queries: ${performanceStats.totalQueries}`);
    console.log(`   - Error rate: ${performanceStats.errorRate.toFixed(2)}%`);
    console.log(`   - Connection pool utilization: ${connectionStats.totalRequests} requests`);

    return {
      success: true,
      stats: seedingResult.stats || {},
      performance: {
        averageQueryTime: performanceStats.averageQueryTime,
        totalQueries: performanceStats.totalQueries,
        errorRate: performanceStats.errorRate,
        totalSeedingTime,
        connectionStats
      },
      backupCreated: backupId
    };

  } catch (error) {
    console.error('❌ Enhanced seeding failed:', error);

    // If we created a backup and seeding failed, offer to restore
    if (backupId) {
      console.log(`💡 Backup available for restore: ${backupId}`);
    }

    return {
      success: false,
      stats: {},
      performance: {
        averageQueryTime: 0,
        totalQueries: 0,
        errorRate: 100,
        totalSeedingTime: 0,
        connectionStats: connectionPoolManager.getStats()
      },
      backupCreated: backupId,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Enhanced seeding with specific optimizations
export const runOptimizedSeeding = async (): Promise<EnhancedSeedingResult> => {
  return connectionPoolManager.executeWithPool(
    () => runEnhancedSeeding({
      createBackupBefore: true,
      monitorPerformance: true,
      batchSize: 100 // Larger batch size for better performance
    }),
    { priority: 'high', retries: 2 }
  );
};

// Quick seeding without backup (for development)
export const runQuickSeeding = async (): Promise<EnhancedSeedingResult> => {
  return runEnhancedSeeding({
    createBackupBefore: false,
    monitorPerformance: true,
    batchSize: 25
  });
};