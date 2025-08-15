-- Add missing columns to reading_progress table
ALTER TABLE public.reading_progress 
ADD COLUMN IF NOT EXISTS scroll_position integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS reading_mode text DEFAULT 'webtoon';

-- Create missing tables for advanced comment system

-- Comment bookmarks table
CREATE TABLE IF NOT EXISTS public.comment_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  comment_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, comment_id)
);

-- Comment reports table  
CREATE TABLE IF NOT EXISTS public.comment_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL,
  reported_by uuid NOT NULL,
  report_reason text NOT NULL,
  report_details text,
  status text DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Comment mentions table
CREATE TABLE IF NOT EXISTS public.comment_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL,
  mentioned_user_id uuid NOT NULL,
  mentioning_user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(comment_id, mentioned_user_id)
);

-- User reputation table
CREATE TABLE IF NOT EXISTS public.user_reputation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  reputation_score integer DEFAULT 100,
  trust_level integer DEFAULT 1,
  last_calculated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Comment notifications table
CREATE TABLE IF NOT EXISTS public.comment_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  comment_id uuid NOT NULL,
  notification_type text NOT NULL,
  triggering_user_id uuid,
  metadata jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Series comments table (if not exists)
CREATE TABLE IF NOT EXISTS public.series_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  series_id uuid NOT NULL,
  content text NOT NULL,
  parent_id uuid,
  like_count integer DEFAULT 0,
  is_pinned boolean DEFAULT false,
  is_flagged boolean DEFAULT false,
  flag_count integer DEFAULT 0,
  pinned_by uuid,
  status text DEFAULT 'active',
  is_edited boolean DEFAULT false,
  edit_deadline timestamp with time zone,
  markdown_content text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.comment_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment_bookmarks
CREATE POLICY "Users can manage their own bookmarks" ON public.comment_bookmarks
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for comment_reports  
CREATE POLICY "Users can create reports" ON public.comment_reports
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can view their own reports" ON public.comment_reports
  FOR SELECT USING (auth.uid() = reported_by);

CREATE POLICY "Admins can manage all reports" ON public.comment_reports
  FOR ALL USING (is_admin());

-- RLS Policies for comment_mentions
CREATE POLICY "Anyone can view mentions" ON public.comment_mentions
  FOR SELECT USING (true);

CREATE POLICY "System can create mentions" ON public.comment_mentions
  FOR INSERT WITH CHECK (true);

-- RLS Policies for user_reputation
CREATE POLICY "Anyone can view reputation" ON public.user_reputation
  FOR SELECT USING (true);

CREATE POLICY "System can manage reputation" ON public.user_reputation
  FOR ALL USING (true);

-- RLS Policies for comment_notifications
CREATE POLICY "Users can view their own notifications" ON public.comment_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.comment_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.comment_notifications
  FOR INSERT WITH CHECK (true);

-- RLS Policies for series_comments
CREATE POLICY "Anyone can view series comments" ON public.series_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own series comments" ON public.series_comments
  FOR INSERT WITH CHECK ((auth.uid() = user_id) AND (NOT is_user_banned()));

CREATE POLICY "Users can update their own series comments" ON public.series_comments
  FOR UPDATE USING ((auth.uid() = user_id) AND (NOT is_user_banned()));

CREATE POLICY "Users can delete their own series comments" ON public.series_comments
  FOR DELETE USING ((auth.uid() = user_id) AND (NOT is_user_banned()));

CREATE POLICY "Admins can manage all series comments" ON public.series_comments
  FOR ALL USING (is_admin());

-- Add triggers for series_comments
CREATE TRIGGER update_series_comments_updated_at
  BEFORE UPDATE ON public.series_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER handle_series_comment_xp
  AFTER INSERT OR DELETE ON public.series_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_comment_xp();

CREATE TRIGGER set_series_comment_edit_deadline
  BEFORE INSERT ON public.series_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_comment_edit_deadline();

CREATE TRIGGER update_series_on_series_comment_change
  AFTER INSERT OR UPDATE OR DELETE ON public.series_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_series_on_comment_change();