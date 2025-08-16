-- Phase 10: Strategic Database Indexing
-- Create strategic indexes for optimal query performance

-- Indexes for manga_meta table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_manga_meta_status_publication 
ON manga_meta (status, publication_date DESC) 
WHERE status != 'draft';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_manga_meta_genres_gin 
ON manga_meta USING GIN (genres);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_manga_meta_tags_gin 
ON manga_meta USING GIN (tags);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_manga_meta_search 
ON manga_meta USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_manga_meta_rating_views 
ON manga_meta (rating_average DESC, view_count DESC) 
WHERE rating_count > 0;

-- Indexes for chapters table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chapters_series_chapter_num 
ON chapters (series_id, chapter_number ASC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chapters_release_date 
ON chapters (release_date DESC) 
WHERE NOT is_locked;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chapters_view_count 
ON chapters (view_count DESC) 
WHERE view_count > 0;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chapters_series_unlocked 
ON chapters (series_id, is_locked, chapter_number);

-- Indexes for comments table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_chapter_created 
ON comments (chapter_id, created_at DESC) 
WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_series_created 
ON comments (series_id, created_at DESC) 
WHERE status = 'active' AND series_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_user_created 
ON comments (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_parent_created 
ON comments (parent_id, created_at ASC) 
WHERE parent_id IS NOT NULL;

-- Indexes for user activity tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_user_date 
ON user_activity_logs (user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_type_date 
ON user_activity_logs (activity_type, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_content 
ON user_activity_logs (content_type, content_id, created_at DESC) 
WHERE content_id IS NOT NULL;

-- Indexes for user profiles and levels
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_role_active 
ON profiles (role) 
WHERE NOT is_banned;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_levels_level_xp 
ON user_levels (level DESC, total_xp DESC);

-- Indexes for subscriptions and payments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_subscriptions_active 
ON user_subscriptions (user_id, status, end_date) 
WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_subscriptions_plan_active 
ON user_subscriptions (plan, status, start_date DESC) 
WHERE status = 'active';

-- Indexes for coin system
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coin_wallets_balance 
ON coin_wallets (user_id, balance DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coin_transactions_user_date 
ON coin_transactions (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coin_transactions_type_date 
ON coin_transactions (type, created_at DESC);

-- Indexes for chapter access and pricing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chapter_access_user_chapter 
ON chapter_access (user_id, chapter_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chapter_prices_cost 
ON chapter_prices (chapter_id, coin_cost);

-- Indexes for bookmarks and reading progress
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookmarks_user_created 
ON bookmarks (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reading_progress_user_updated 
ON reading_progress (user_id, updated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reading_progress_chapter_user 
ON reading_progress (chapter_id, user_id);

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_manga_chapters_composite 
ON chapters (series_id, is_locked, chapter_number, release_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_content_activity 
ON user_activity_logs (user_id, content_type, activity_type, created_at DESC) 
WHERE user_id IS NOT NULL;

-- Optimize theme and settings queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_theme_settings_active 
ON theme_settings (is_active, is_default) 
WHERE is_active = true OR is_default = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_child_themes_active 
ON child_themes (is_active, name) 
WHERE is_active = true;

-- Analytics and reporting indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_aggregations_metric_date 
ON analytics_aggregations (metric_name, period_type, period_date DESC);

-- Create function to analyze index usage
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE(
  schemaname TEXT,
  tablename TEXT,
  indexname TEXT,
  num_rows BIGINT,
  table_size TEXT,
  index_size TEXT,
  unique_index BOOLEAN,
  num_scans BIGINT,
  tuples_read BIGINT,
  tuples_fetched BIGINT
) LANGUAGE SQL AS $$
  SELECT 
    schemaname::TEXT,
    tablename::TEXT,
    indexname::TEXT,
    c.reltuples::BIGINT as num_rows,
    pg_size_pretty(pg_relation_size(i.indexrelid)) as index_size,
    pg_size_pretty(pg_relation_size(c.oid)) as table_size,
    i.indisunique as unique_index,
    s.idx_scan as num_scans,
    s.idx_tup_read as tuples_read,
    s.idx_tup_fetch as tuples_fetched
  FROM pg_stat_user_indexes s
  JOIN pg_index i ON s.indexrelid = i.indexrelid
  JOIN pg_class c ON i.indrelid = c.oid
  JOIN pg_indexes idx ON idx.indexname = s.indexrelname
  WHERE s.schemaname = 'public'
  ORDER BY s.idx_scan DESC, s.idx_tup_read DESC;
$$;

-- Create function to identify missing indexes
CREATE OR REPLACE FUNCTION suggest_missing_indexes()
RETURNS TABLE(
  table_name TEXT,
  suggested_index TEXT,
  reason TEXT
) LANGUAGE SQL AS $$
  WITH slow_queries AS (
    SELECT DISTINCT
      schemaname,
      tablename
    FROM pg_stat_user_tables
    WHERE seq_scan > idx_scan * 10 -- Tables with high sequential scan ratio
    AND n_tup_ins + n_tup_upd + n_tup_del > 1000 -- Active tables
  )
  SELECT 
    sq.tablename::TEXT,
    ('CREATE INDEX CONCURRENTLY idx_' || sq.tablename || '_suggested ON ' || sq.tablename || ' (created_at DESC)')::TEXT,
    'High sequential scan ratio detected'::TEXT
  FROM slow_queries sq
  WHERE sq.schemaname = 'public';
$$;