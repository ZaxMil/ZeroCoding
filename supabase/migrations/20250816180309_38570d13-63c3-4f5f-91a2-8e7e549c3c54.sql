-- Phase 10: Strategic Database Indexing (Fixed)
-- Create strategic indexes for optimal query performance

-- Indexes for manga_meta table
CREATE INDEX IF NOT EXISTS idx_manga_meta_status_publication 
ON manga_meta (status, publication_date DESC) 
WHERE status != 'draft';

CREATE INDEX IF NOT EXISTS idx_manga_meta_genres_gin 
ON manga_meta USING GIN (genres);

CREATE INDEX IF NOT EXISTS idx_manga_meta_tags_gin 
ON manga_meta USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_manga_meta_search 
ON manga_meta USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '')));

CREATE INDEX IF NOT EXISTS idx_manga_meta_rating_views 
ON manga_meta (rating_average DESC, view_count DESC) 
WHERE rating_count > 0;

-- Indexes for chapters table
CREATE INDEX IF NOT EXISTS idx_chapters_series_chapter_num 
ON chapters (series_id, chapter_number ASC);

CREATE INDEX IF NOT EXISTS idx_chapters_release_date 
ON chapters (release_date DESC) 
WHERE NOT is_locked;

CREATE INDEX IF NOT EXISTS idx_chapters_view_count 
ON chapters (view_count DESC) 
WHERE view_count > 0;

CREATE INDEX IF NOT EXISTS idx_chapters_series_unlocked 
ON chapters (series_id, is_locked, chapter_number);

-- Indexes for comments table
CREATE INDEX IF NOT EXISTS idx_comments_chapter_created 
ON comments (chapter_id, created_at DESC) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_comments_series_created 
ON comments (series_id, created_at DESC) 
WHERE status = 'active' AND series_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_comments_user_created 
ON comments (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_parent_created 
ON comments (parent_id, created_at ASC) 
WHERE parent_id IS NOT NULL;