import { supabase } from '@/integrations/supabase/client';

interface QueryPerformanceMetrics {
  queryName: string;
  startTime: number;
  endTime: number;
  duration: number;
  resultCount: number;
  error?: string;
}

class QueryOptimizer {
  private metrics: QueryPerformanceMetrics[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private batchQueue: Array<{ query: string; resolve: Function; reject: Function }> = [];

  // Performance monitoring wrapper
  async measureQuery<T>(
    queryName: string,
    queryFunction: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await queryFunction();
      const endTime = performance.now();
      
      this.logMetrics({
        queryName,
        startTime,
        endTime,
        duration: endTime - startTime,
        resultCount: Array.isArray(result) ? result.length : 1
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      
      this.logMetrics({
        queryName,
        startTime,
        endTime,
        duration: endTime - startTime,
        resultCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  private logMetrics(metrics: QueryPerformanceMetrics) {
    this.metrics.push(metrics);
    
    // Log slow queries (> 1000ms)
    if (metrics.duration > 1000) {
      console.warn(`🐌 Slow query detected: ${metrics.queryName} took ${metrics.duration.toFixed(2)}ms`);
    }
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  // Get performance report
  getPerformanceReport() {
    const totalQueries = this.metrics.length;
    const avgDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries;
    const slowQueries = this.metrics.filter(m => m.duration > 1000);
    const errorQueries = this.metrics.filter(m => m.error);
    
    return {
      totalQueries,
      avgDuration: avgDuration.toFixed(2),
      slowQueriesCount: slowQueries.length,
      errorQueriesCount: errorQueries.length,
      slowQueries: slowQueries.slice(-10), // Last 10 slow queries
      errorQueries: errorQueries.slice(-10) // Last 10 error queries
    };
  }

  // Optimized dashboard stats query
  async getDashboardStats() {
    return this.measureQuery('dashboard_stats', async () => {
      // Use count queries instead of selecting all data
      const [chaptersResult, usersResult, bookmarksResult, commentsResult] = await Promise.all([
        supabase.from('chapters').select('view_count', { count: 'exact' }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('bookmarks').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
      ]);

      // Get total views efficiently
      const { data: viewsData } = await supabase
        .from('chapters')
        .select('view_count')
        .not('view_count', 'is', null);

      const totalViews = viewsData?.reduce((sum, chapter) => sum + (chapter.view_count || 0), 0) || 0;

      return {
        totalChapters: chaptersResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalViews,
        totalBookmarks: bookmarksResult.count || 0,
        totalComments: commentsResult.count || 0
      };
    });
  }

  // Optimized series chapters query with pagination
  async getSeriesChapters(seriesId: string, page = 0, limit = 50) {
    return this.measureQuery(`series_chapters_${seriesId}`, async () => {
      const offset = page * limit;
      
      const { data, error, count } = await supabase
        .from('chapters')
        .select(`
          id,
          title,
          chapter_number,
          created_at,
          view_count,
          is_premium,
          coin_price,
          is_locked
        `, { count: 'exact' })
        .eq('series_id', seriesId)
        .order('chapter_number', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        chapters: data || [],
        totalCount: count || 0,
        hasMore: (count || 0) > offset + limit,
        currentPage: page
      };
    });
  }

  // Batch multiple related queries
  async batchUserQueries(userId: string) {
    return this.measureQuery(`batch_user_queries_${userId}`, async () => {
      const [profile, bookmarks, readingProgress, comments] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        
        supabase
          .from('bookmarks')
          .select(`
            id,
            created_at,
            chapters!inner(
              id,
              title,
              chapter_number,
              series_id,
              manga_meta!inner(
                title,
                slug,
                cover_image
              )
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20),
        
        supabase
          .from('reading_progress')
          .select(`
            chapter_id,
            page_number,
            completed,
            updated_at,
            chapters!inner(
              title,
              chapter_number,
              series_id,
              manga_meta!inner(
                title,
                slug
              )
            )
          `)
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(10),
        
        supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
      ]);

      return {
        profile: profile.data,
        bookmarks: bookmarks.data || [],
        readingProgress: readingProgress.data || [],
        commentCount: comments.count || 0
      };
    });
  }

  // Optimized search with proper indexing hints
  async searchContent(query: string, type: 'all' | 'series' | 'chapters' = 'all', limit = 20) {
    return this.measureQuery(`search_${type}_${query}`, async () => {
      const searchTerm = `%${query}%`;
      
      if (type === 'series' || type === 'all') {
        const seriesResults = await supabase
          .from('manga_meta')
          .select(`
            id,
            title,
            slug,
            description,
            cover_image,
            status,
            genres
          `)
          .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .limit(type === 'all' ? Math.floor(limit / 2) : limit);

        if (type === 'series') {
          return { series: seriesResults.data || [], chapters: [] };
        }
      }

      if (type === 'chapters' || type === 'all') {
        const chaptersResults = await supabase
          .from('chapters')
          .select(`
            id,
            title,
            chapter_number,
            series_id,
            manga_meta!inner(
              title,
              slug,
              cover_image
            )
          `)
          .ilike('title', searchTerm)
          .limit(type === 'all' ? Math.floor(limit / 2) : limit);

        if (type === 'chapters') {
          return { series: [], chapters: chaptersResults.data || [] };
        }

        return {
          series: type === 'all' ? (await supabase
            .from('manga_meta')
            .select('id, title, slug, description, cover_image, status, genres')
            .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
            .limit(Math.floor(limit / 2))).data || [] : [],
          chapters: chaptersResults.data || []
        };
      }

      return { series: [], chapters: [] };
    });
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = [];
  }
}

export const queryOptimizer = new QueryOptimizer();
