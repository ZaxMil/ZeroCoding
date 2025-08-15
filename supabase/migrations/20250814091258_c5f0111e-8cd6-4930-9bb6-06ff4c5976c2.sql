-- Database adjustments for unified comment system

-- 1. First, check if we need to add any missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_chapter_id_parent_id ON public.comments(chapter_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id_created_at ON public.comments(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_series_comments_series_id_parent_id ON public.series_comments(series_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_series_comments_user_id_created_at ON public.series_comments(user_id, created_at);

-- 2. Ensure proper relationships exist and add series_id to comments table for easier querying
-- This will help us group chapter comments under their series
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS series_id uuid REFERENCES public.manga_meta(id);

-- 3. Update existing comments to have series_id by joining through chapters
UPDATE public.comments 
SET series_id = c.series_id 
FROM public.chapters c 
WHERE public.comments.chapter_id = c.id 
AND public.comments.series_id IS NULL;

-- 4. Add index for the new series_id column
CREATE INDEX IF NOT EXISTS idx_comments_series_id ON public.comments(series_id);

-- 5. Add a view to get unified comments across both tables for admin dashboard
CREATE OR REPLACE VIEW public.unified_comments_view AS
SELECT 
  'chapter' as comment_type,
  c.id,
  c.content,
  c.user_id,
  c.created_at,
  c.updated_at,
  c.parent_id,
  c.like_count,
  c.is_pinned,
  c.is_flagged,
  c.status,
  c.chapter_id,
  c.series_id,
  ch.title as chapter_title,
  ch.chapter_number,
  m.title as series_title
FROM public.comments c
LEFT JOIN public.chapters ch ON c.chapter_id = ch.id
LEFT JOIN public.manga_meta m ON c.series_id = m.id

UNION ALL

SELECT 
  'series' as comment_type,
  sc.id,
  sc.content,
  sc.user_id,
  sc.created_at,
  sc.updated_at,
  sc.parent_id,
  sc.like_count,
  sc.is_pinned,
  sc.is_flagged,
  sc.status,
  NULL as chapter_id,
  sc.series_id,
  NULL as chapter_title,
  NULL as chapter_number,
  m.title as series_title
FROM public.series_comments sc
LEFT JOIN public.manga_meta m ON sc.series_id = m.id;

-- 6. Grant permissions on the view
GRANT SELECT ON public.unified_comments_view TO authenticated;
GRANT SELECT ON public.unified_comments_view TO anon;