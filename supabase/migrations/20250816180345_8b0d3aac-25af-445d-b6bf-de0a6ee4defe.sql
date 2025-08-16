-- Phase 10: Strategic Database Indexing (Simplified)
-- Create essential indexes for optimal query performance

-- Basic indexes for manga_meta table
CREATE INDEX IF NOT EXISTS idx_manga_meta_status 
ON manga_meta (status);

CREATE INDEX IF NOT EXISTS idx_manga_meta_publication_date 
ON manga_meta (publication_date DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_manga_meta_view_count 
ON manga_meta (view_count DESC) WHERE view_count > 0;

CREATE INDEX IF NOT EXISTS idx_manga_meta_rating 
ON manga_meta (rating_average DESC, rating_count DESC) WHERE rating_count > 0;

-- GIN indexes for array columns
CREATE INDEX IF NOT EXISTS idx_manga_meta_genres 
ON manga_meta USING GIN (genres);

CREATE INDEX IF NOT EXISTS idx_manga_meta_tags 
ON manga_meta USING GIN (tags);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_manga_meta_title_search 
ON manga_meta USING GIN (to_tsvector('english', title));

-- Indexes for chapters table
CREATE INDEX IF NOT EXISTS idx_chapters_series_id 
ON chapters (series_id);

CREATE INDEX IF NOT EXISTS idx_chapters_series_chapter 
ON chapters (series_id, chapter_number);

CREATE INDEX IF NOT EXISTS idx_chapters_release_date 
ON chapters (release_date DESC);

CREATE INDEX IF NOT EXISTS idx_chapters_is_locked 
ON chapters (is_locked, release_date DESC);

-- Indexes for comments table
CREATE INDEX IF NOT EXISTS idx_comments_chapter_id 
ON comments (chapter_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_user_id 
ON comments (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_parent_id 
ON comments (parent_id, created_at ASC) WHERE parent_id IS NOT NULL;

-- Indexes for user activity
CREATE INDEX IF NOT EXISTS idx_user_activity_user_date 
ON user_activity_logs (user_id, created_at DESC) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_activity_type 
ON user_activity_logs (activity_type, created_at DESC);

-- Function to get index usage statistics
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE(
  table_name TEXT,
  index_name TEXT,
  index_size TEXT,
  index_scans BIGINT,
  tuples_read BIGINT
) LANGUAGE SQL AS $$
  SELECT 
    t.relname::TEXT as table_name,
    i.relname::TEXT as index_name,
    pg_size_pretty(pg_relation_size(i.oid)) as index_size,
    s.idx_scan as index_scans,
    s.idx_tup_read as tuples_read
  FROM pg_stat_user_indexes s
  JOIN pg_class i ON i.oid = s.indexrelid
  JOIN pg_class t ON t.oid = s.relid
  WHERE s.schemaname = 'public'
  ORDER BY s.idx_scan DESC;
$$;