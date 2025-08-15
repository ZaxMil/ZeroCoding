-- Phase 1: Enhanced Database Schema for Advanced Comment System

-- Comment attachments for image uploads
CREATE TABLE public.comment_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced comment reactions (beyond basic emoji system)
CREATE TABLE public.comment_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL, -- emoji, custom_emoji, etc.
  reaction_value TEXT NOT NULL, -- actual emoji or custom emoji ID
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id, reaction_value)
);

-- @mentions system
CREATE TABLE public.comment_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL,
  mentioned_user_id UUID NOT NULL,
  mentioning_user_id UUID NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced notifications system
CREATE TABLE public.comment_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  comment_id UUID NOT NULL,
  notification_type TEXT NOT NULL, -- mention, reply, reaction, etc.
  triggering_user_id UUID,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User reporting system
CREATE TABLE public.comment_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL,
  reported_by UUID NOT NULL,
  report_reason TEXT NOT NULL,
  report_details TEXT,
  status TEXT DEFAULT 'pending', -- pending, reviewed, dismissed, acted_upon
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Moderation queue for automated systems
CREATE TABLE public.moderation_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- comment, user, etc.
  moderation_reason TEXT NOT NULL,
  auto_flagged BOOLEAN DEFAULT false,
  priority_level INTEGER DEFAULT 1, -- 1-5, higher is more urgent
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  assigned_to UUID,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Comment edit history tracking
CREATE TABLE public.comment_edit_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL,
  previous_content TEXT NOT NULL,
  edit_reason TEXT,
  edited_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Spam detection logs
CREATE TABLE public.spam_detection_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  content_id UUID,
  content_type TEXT NOT NULL,
  detection_method TEXT NOT NULL, -- rate_limit, keyword, ai, etc.
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  action_taken TEXT, -- blocked, flagged, allowed
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User mutes and advanced moderation
CREATE TABLE public.user_moderation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  moderation_type TEXT NOT NULL, -- mute, shadowban, temp_ban, perm_ban
  reason TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  applied_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User reputation and trust system
CREATE TABLE public.user_reputation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  reputation_score INTEGER DEFAULT 100,
  trust_level INTEGER DEFAULT 1, -- 1-5
  helpful_votes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  quality_score DECIMAL(3,2) DEFAULT 0.50,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Comment bookmarks for users
CREATE TABLE public.comment_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  comment_id UUID NOT NULL,
  bookmark_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, comment_id)
);

-- Enable Row Level Security
ALTER TABLE public.comment_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_edit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spam_detection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment_attachments
CREATE POLICY "Users can view comment attachments" ON public.comment_attachments
  FOR SELECT USING (true);

CREATE POLICY "Users can upload attachments to their comments" ON public.comment_attachments
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Admins can manage all attachments" ON public.comment_attachments
  FOR ALL USING (is_admin());

-- RLS Policies for comment_reactions
CREATE POLICY "Users can view all reactions" ON public.comment_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own reactions" ON public.comment_reactions
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for comment_mentions
CREATE POLICY "Users can view mentions involving them" ON public.comment_mentions
  FOR SELECT USING (auth.uid() = mentioned_user_id OR auth.uid() = mentioning_user_id);

CREATE POLICY "Users can create mentions" ON public.comment_mentions
  FOR INSERT WITH CHECK (auth.uid() = mentioning_user_id);

-- RLS Policies for comment_notifications
CREATE POLICY "Users can view their own notifications" ON public.comment_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.comment_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.comment_notifications
  FOR INSERT WITH CHECK (true);

-- RLS Policies for comment_reports
CREATE POLICY "Users can create reports" ON public.comment_reports
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can view their own reports" ON public.comment_reports
  FOR SELECT USING (auth.uid() = reported_by);

CREATE POLICY "Admins can manage all reports" ON public.comment_reports
  FOR ALL USING (is_admin());

-- RLS Policies for moderation_queue
CREATE POLICY "Admins can manage moderation queue" ON public.moderation_queue
  FOR ALL USING (is_admin());

-- RLS Policies for comment_edit_history
CREATE POLICY "Users can view edit history of their comments" ON public.comment_edit_history
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM comments c WHERE c.id = comment_id AND c.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM series_comments sc WHERE sc.id = comment_id AND sc.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all edit history" ON public.comment_edit_history
  FOR SELECT USING (is_admin());

CREATE POLICY "System can create edit history" ON public.comment_edit_history
  FOR INSERT WITH CHECK (true);

-- RLS Policies for spam_detection_logs
CREATE POLICY "Admins can view spam logs" ON public.spam_detection_logs
  FOR SELECT USING (is_admin());

CREATE POLICY "System can create spam logs" ON public.spam_detection_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for user_moderation
CREATE POLICY "Admins can manage user moderation" ON public.user_moderation
  FOR ALL USING (is_admin());

CREATE POLICY "Users can view their own moderation status" ON public.user_moderation
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for user_reputation
CREATE POLICY "Users can view all reputation data" ON public.user_reputation
  FOR SELECT USING (true);

CREATE POLICY "System can manage reputation" ON public.user_reputation
  FOR ALL USING (true);

-- RLS Policies for comment_bookmarks
CREATE POLICY "Users can manage their own bookmarks" ON public.comment_bookmarks
  FOR ALL USING (auth.uid() = user_id);

-- Create storage bucket for comment attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('comment-attachments', 'comment-attachments', true, 10485760); -- 10MB limit

-- Storage policies for comment attachments
CREATE POLICY "Users can view comment attachment files" ON storage.objects
  FOR SELECT USING (bucket_id = 'comment-attachments');

CREATE POLICY "Users can upload comment attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'comment-attachments' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own comment attachments" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'comment-attachments' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own comment attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'comment-attachments' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Functions for reputation management
CREATE OR REPLACE FUNCTION public.update_user_reputation(target_user_id UUID, score_change INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_reputation (user_id, reputation_score)
  VALUES (target_user_id, 100 + score_change)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    reputation_score = GREATEST(0, user_reputation.reputation_score + score_change),
    last_calculated_at = now(),
    updated_at = now();
END;
$$;

-- Function to check if user is shadowbanned
CREATE OR REPLACE FUNCTION public.is_user_shadowbanned(check_user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_moderation 
    WHERE user_id = check_user_id 
    AND moderation_type = 'shadowban' 
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- Function to create comment notification
CREATE OR REPLACE FUNCTION public.create_comment_notification(
  target_user_id UUID,
  comment_id UUID,
  notification_type TEXT,
  triggering_user_id UUID DEFAULT NULL,
  metadata JSONB DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Don't create notification if user is triggering their own action
  IF target_user_id = triggering_user_id THEN
    RETURN;
  END IF;
  
  INSERT INTO public.comment_notifications (
    user_id, comment_id, notification_type, triggering_user_id, metadata
  ) VALUES (
    target_user_id, comment_id, notification_type, triggering_user_id, metadata
  );
END;
$$;

-- Triggers for automatic reputation updates
CREATE OR REPLACE FUNCTION public.handle_comment_reaction_reputation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  comment_author_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get comment author
    SELECT user_id INTO comment_author_id 
    FROM comments WHERE id = NEW.comment_id
    UNION ALL
    SELECT user_id FROM series_comments WHERE id = NEW.comment_id;
    
    -- Update reputation for receiving a reaction
    IF comment_author_id IS NOT NULL THEN
      PERFORM public.update_user_reputation(comment_author_id, 1);
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Get comment author
    SELECT user_id INTO comment_author_id 
    FROM comments WHERE id = OLD.comment_id
    UNION ALL
    SELECT user_id FROM series_comments WHERE id = OLD.comment_id;
    
    -- Decrease reputation for losing a reaction
    IF comment_author_id IS NOT NULL THEN
      PERFORM public.update_user_reputation(comment_author_id, -1);
    END IF;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER comment_reaction_reputation_trigger
  AFTER INSERT OR DELETE ON public.comment_reactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_reaction_reputation();

-- Enable realtime for all new tables
ALTER TABLE public.comment_attachments REPLICA IDENTITY FULL;
ALTER TABLE public.comment_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.comment_mentions REPLICA IDENTITY FULL;
ALTER TABLE public.comment_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.comment_reports REPLICA IDENTITY FULL;
ALTER TABLE public.moderation_queue REPLICA IDENTITY FULL;
ALTER TABLE public.comment_edit_history REPLICA IDENTITY FULL;
ALTER TABLE public.user_reputation REPLICA IDENTITY FULL;
ALTER TABLE public.comment_bookmarks REPLICA IDENTITY FULL;