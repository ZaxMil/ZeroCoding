import { supabase } from '@/integrations/supabase/client';

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
  table?: string;
  operation?: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
  rowsAffected?: number;
}

interface PerformanceStats {
  averageQueryTime: number;
  slowestQuery: QueryMetrics | null;
  fastestQuery: QueryMetrics | null;
  totalQueries: number;
  errorRate: number;
  queriesPerSecond: number;
  tableStats: Record<string, {
    queryCount: number;
    averageTime: number;
    errorCount: number;
  }>;
  totalSeedingTime?: number;
}

class DatabasePerformanceMonitor {
  private metrics: QueryMetrics[] = [];
  private maxMetrics = 1000; // Keep last 1000 queries
  private isEnabled = true;

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  clear() {
    this.metrics = [];
  }

  async executeQuery<T>(
    queryFunction: () => Promise<T>,
    queryInfo: {
      query: string;
      table?: string;
      operation?: QueryMetrics['operation'];
    }
  ): Promise<T> {
    if (!this.isEnabled) {
      return queryFunction();
    }

    const startTime = performance.now();
    const timestamp = new Date();

    try {
      const result = await queryFunction();
      const duration = performance.now() - startTime;

      // Extract rows affected from Supabase response if available
      let rowsAffected: number | undefined;
      if (result && typeof result === 'object' && 'data' in result) {
        const data = (result as any).data;
        if (Array.isArray(data)) {
          rowsAffected = data.length;
        } else if (data) {
          rowsAffected = 1;
        }
      }

      this.recordMetric({
        query: queryInfo.query,
        duration,
        timestamp,
        success: true,
        table: queryInfo.table,
        operation: queryInfo.operation,
        rowsAffected
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        query: queryInfo.query,
        duration,
        timestamp,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        table: queryInfo.table,
        operation: queryInfo.operation
      });

      throw error;
    }
  }

  private recordMetric(metric: QueryMetrics) {
    this.metrics.push(metric);
    
    // Keep only the last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getStats(timeRange?: { start: Date; end: Date }): PerformanceStats {
    let filteredMetrics = this.metrics;
    
    if (timeRange) {
      filteredMetrics = this.metrics.filter(
        m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    if (filteredMetrics.length === 0) {
      return {
        averageQueryTime: 0,
        slowestQuery: null,
        fastestQuery: null,
        totalQueries: 0,
        errorRate: 0,
        queriesPerSecond: 0,
        tableStats: {}
      };
    }

    const successfulQueries = filteredMetrics.filter(m => m.success);
    const totalDuration = successfulQueries.reduce((sum, m) => sum + m.duration, 0);
    const averageQueryTime = totalDuration / successfulQueries.length;

    const slowestQuery = filteredMetrics.reduce((slowest, current) => 
      !slowest || current.duration > slowest.duration ? current : slowest
    );

    const fastestQuery = successfulQueries.reduce((fastest, current) => 
      !fastest || current.duration < fastest.duration ? current : fastest
    );

    const errorCount = filteredMetrics.filter(m => !m.success).length;
    const errorRate = (errorCount / filteredMetrics.length) * 100;

    // Calculate queries per second based on time range
    const timeSpanMs = timeRange 
      ? timeRange.end.getTime() - timeRange.start.getTime()
      : (filteredMetrics[filteredMetrics.length - 1]?.timestamp.getTime() || 0) - (filteredMetrics[0]?.timestamp.getTime() || 0);
    const queriesPerSecond = timeSpanMs > 0 ? (filteredMetrics.length / (timeSpanMs / 1000)) : 0;

    // Table statistics
    const tableStats: Record<string, { queryCount: number; averageTime: number; errorCount: number }> = {};
    
    filteredMetrics.forEach(metric => {
      if (!metric.table) return;
      
      if (!tableStats[metric.table]) {
        tableStats[metric.table] = { queryCount: 0, averageTime: 0, errorCount: 0 };
      }
      
      tableStats[metric.table].queryCount++;
      if (!metric.success) {
        tableStats[metric.table].errorCount++;
      }
    });

    // Calculate average times for each table
    Object.keys(tableStats).forEach(table => {
      const tableMetrics = filteredMetrics.filter(m => m.table === table && m.success);
      const tableDuration = tableMetrics.reduce((sum, m) => sum + m.duration, 0);
      tableStats[table].averageTime = tableDuration / tableMetrics.length || 0;
    });

    return {
      averageQueryTime,
      slowestQuery,
      fastestQuery,
      totalQueries: filteredMetrics.length,
      errorRate,
      queriesPerSecond,
      tableStats
    };
  }

  getSlowQueries(threshold: number = 1000): QueryMetrics[] {
    return this.metrics.filter(m => m.duration > threshold);
  }

  getRecentErrors(limit: number = 10): QueryMetrics[] {
    return this.metrics
      .filter(m => !m.success)
      .slice(-limit)
      .reverse();
  }

  exportMetrics(): QueryMetrics[] {
    return [...this.metrics];
  }

  // Enhanced seeding with performance monitoring
  async executeOptimizedSeeding(
    seedingFunction: () => Promise<any>,
    batchSize: number = 50
  ): Promise<{ success: boolean; stats: any; performance: PerformanceStats }> {
    const startTime = performance.now();
    
    try {
      // Clear previous metrics for clean measurement
      this.clear();
      
      const result = await seedingFunction();
      
      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      
      const performanceStats = this.getStats();
      
      console.log(`🚀 Seeding completed in ${totalDuration.toFixed(2)}ms`);
      console.log(`📊 Performance Stats:`, performanceStats);
      
      return {
        success: true,
        stats: result.stats || {},
        performance: {
          ...performanceStats,
          totalSeedingTime: totalDuration
        }
      };
    } catch (error) {
      return {
        success: false,
        stats: {},
        performance: this.getStats()
      };
    }
  }
}

// Global instance
export const dbPerformanceMonitor = new DatabasePerformanceMonitor();

// Helper functions for common operations
export const monitoredQuery = {
  select: async <T>(table: string, query: () => Promise<T>) => {
    return dbPerformanceMonitor.executeQuery(query, {
      query: `SELECT from ${table}`,
      table,
      operation: 'select'
    });
  },
  
  insert: async <T>(table: string, query: () => Promise<T>) => {
    return dbPerformanceMonitor.executeQuery(query, {
      query: `INSERT into ${table}`,
      table,
      operation: 'insert'
    });
  },
  
  update: async <T>(table: string, query: () => Promise<T>) => {
    return dbPerformanceMonitor.executeQuery(query, {
      query: `UPDATE ${table}`,
      table,
      operation: 'update'
    });
  },
  
  delete: async <T>(table: string, query: () => Promise<T>) => {
    return dbPerformanceMonitor.executeQuery(query, {
      query: `DELETE from ${table}`,
      table,
      operation: 'delete'
    });
  }
};
