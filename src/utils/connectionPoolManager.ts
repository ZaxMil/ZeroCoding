import { supabase } from '@/integrations/supabase/client';

interface PoolConfig {
  maxConnections: number;
  minConnections: number;
  acquireTimeoutMs: number;
  idleTimeoutMs: number;
  maxLifetimeMs: number;
}

interface ConnectionStats {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  queuedRequests: number;
  totalRequests: number;
  failedRequests: number;
  averageWaitTime: number;
}

class ConnectionPoolManager {
  private config: PoolConfig = {
    maxConnections: 20,
    minConnections: 5,
    acquireTimeoutMs: 30000,
    idleTimeoutMs: 300000, // 5 minutes
    maxLifetimeMs: 1800000  // 30 minutes
  };

  private stats: ConnectionStats = {
    activeConnections: 0,
    idleConnections: 0,
    totalConnections: 0,
    queuedRequests: 0,
    totalRequests: 0,
    failedRequests: 0,
    averageWaitTime: 0
  };

  private waitTimes: number[] = [];
  private maxWaitTimeHistory = 100;

  updateConfig(newConfig: Partial<PoolConfig>) {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Connection pool config updated:', this.config);
  }

  getConfig(): PoolConfig {
    return { ...this.config };
  }

  getStats(): ConnectionStats {
    // Calculate average wait time
    if (this.waitTimes.length > 0) {
      const totalWaitTime = this.waitTimes.reduce((sum, time) => sum + time, 0);
      this.stats.averageWaitTime = totalWaitTime / this.waitTimes.length;
    }

    return { ...this.stats };
  }

  // Simulate connection acquisition tracking
  async acquireConnection<T>(operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    this.stats.queuedRequests++;
    this.stats.totalRequests++;

    try {
      // Simulate connection pool behavior
      if (this.stats.activeConnections >= this.config.maxConnections) {
        // Would typically wait for available connection
        console.warn('⚠️ Connection pool at capacity, would queue request');
      }

      this.stats.activeConnections++;
      this.stats.queuedRequests--;

      const result = await operation();
      
      const waitTime = performance.now() - startTime;
      this.recordWaitTime(waitTime);
      
      return result;
    } catch (error) {
      this.stats.failedRequests++;
      throw error;
    } finally {
      this.stats.activeConnections = Math.max(0, this.stats.activeConnections - 1);
    }
  }

  private recordWaitTime(waitTime: number) {
    this.waitTimes.push(waitTime);
    if (this.waitTimes.length > this.maxWaitTimeHistory) {
      this.waitTimes = this.waitTimes.slice(-this.maxWaitTimeHistory);
    }
  }

  // Enhanced database operations with pool management
  async executeWithPool<T>(
    operation: () => Promise<T>,
    options?: { 
      priority?: 'high' | 'normal' | 'low';
      timeout?: number;
      retries?: number;
    }
  ): Promise<T> {
    const opts = {
      priority: 'normal' as const,
      timeout: this.config.acquireTimeoutMs,
      retries: 3,
      ...options
    };

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= opts.retries; attempt++) {
      try {
        return await this.acquireConnection(operation);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < opts.retries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.warn(`🔄 Retrying database operation in ${delay}ms (attempt ${attempt}/${opts.retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Max retries exceeded');
  }

  // Optimized batch operations
  async executeBatch<T>(
    operations: (() => Promise<T>)[],
    batchSize: number = 10
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      
      const batchPromises = batch.map(op => 
        this.executeWithPool(op, { priority: 'normal' })
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Batch operation ${i + index} failed:`, result.reason);
          throw new Error(`Batch operation failed: ${result.reason}`);
        }
      });
      
      // Small delay between batches to avoid overwhelming the database
      if (i + batchSize < operations.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    return results;
  }

  // Connection health monitoring
  async performHealthCheck(): Promise<{
    healthy: boolean;
    latency: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let healthy = true;
    const startTime = performance.now();

    try {
      // Simple health check query
      await this.executeWithPool(async () => {
        const { error } = await supabase
          .from('manga_meta')
          .select('id')
          .limit(1);
        
        if (error) throw error;
      });
    } catch (error) {
      healthy = false;
      errors.push(`Database connection failed: ${error}`);
    }

    const latency = performance.now() - startTime;

    // Check pool stats for potential issues
    const stats = this.getStats();
    
    if (stats.failedRequests > stats.totalRequests * 0.1) {
      healthy = false;
      errors.push(`High failure rate: ${((stats.failedRequests / stats.totalRequests) * 100).toFixed(1)}%`);
    }
    
    if (stats.averageWaitTime > 5000) {
      healthy = false;
      errors.push(`High average wait time: ${stats.averageWaitTime.toFixed(0)}ms`);
    }

    return { healthy, latency, errors };
  }

  // Reset statistics
  resetStats() {
    this.stats = {
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
      queuedRequests: 0,
      totalRequests: 0,
      failedRequests: 0,
      averageWaitTime: 0
    };
    this.waitTimes = [];
  }

  // Get optimization recommendations
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.getStats();

    if (stats.averageWaitTime > 1000) {
      recommendations.push('Consider increasing maxConnections - high average wait time detected');
    }

    if (stats.failedRequests > stats.totalRequests * 0.05) {
      recommendations.push('High failure rate detected - check database health and connection stability');
    }

    if (stats.queuedRequests > this.config.maxConnections * 0.5) {
      recommendations.push('Frequent connection queueing - consider optimizing queries or increasing pool size');
    }

    return recommendations;
  }
}

// Global instance
export const connectionPoolManager = new ConnectionPoolManager();

// Helper functions for pool-managed operations
export const pooledQuery = {
  select: async <T>(operation: () => Promise<T>) => {
    return connectionPoolManager.executeWithPool(operation, { priority: 'normal' });
  },
  
  insert: async <T>(operation: () => Promise<T>) => {
    return connectionPoolManager.executeWithPool(operation, { priority: 'high' });
  },
  
  update: async <T>(operation: () => Promise<T>) => {
    return connectionPoolManager.executeWithPool(operation, { priority: 'high' });
  },
  
  delete: async <T>(operation: () => Promise<T>) => {
    return connectionPoolManager.executeWithPool(operation, { priority: 'high' });
  },
  
  batch: async <T>(operations: (() => Promise<T>)[], batchSize?: number) => {
    return connectionPoolManager.executeBatch(operations, batchSize);
  }
};