-- Fix the constraint issue and continue with enhanced comment system setup

-- Create user levels/XP system (if not exists)
CREATE TABLE IF NOT EXISTS public.user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  level INTEGER DEFAULT 1,
  current_xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  likes_received INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add pinned_by column to comments tables if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'pinned_by') THEN
    ALTER TABLE public.comments ADD COLUMN pinned_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'series_comments' AND column_name = 'pinned_by') THEN
    ALTER TABLE public.series_comments ADD COLUMN pinned_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Create moderation queue table
CREATE TABLE IF NOT EXISTS public.comment_moderation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL,
  comment_type TEXT NOT NULL CHECK (comment_type IN ('chapter', 'series')),
  moderator_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('pending', 'approved', 'rejected', 'auto_approved')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on tables that need it
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_moderation ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_levels
DROP POLICY IF EXISTS "Users can view all user levels" ON public.user_levels;
CREATE POLICY "Users can view all user levels"
ON public.user_levels
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "System can update user levels" ON public.user_levels;
CREATE POLICY "System can update user levels"
ON public.user_levels
FOR ALL
USING (true);

-- RLS Policies for comment_moderation
DROP POLICY IF EXISTS "Admins can manage moderation" ON public.comment_moderation;
CREATE POLICY "Admins can manage moderation"
ON public.comment_moderation
FOR ALL
USING (is_admin());

DROP POLICY IF EXISTS "Anyone can view approved moderation status" ON public.comment_moderation;
CREATE POLICY "Anyone can view approved moderation status"
ON public.comment_moderation
FOR SELECT
USING (action = 'approved');

-- Enable realtime for comments (if not already enabled)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.series_comments;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_likes;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.series_comment_likes;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Set replica identity for realtime
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER TABLE public.series_comments REPLICA IDENTITY FULL;
ALTER TABLE public.comment_likes REPLICA IDENTITY FULL;
ALTER TABLE public.series_comment_likes REPLICA IDENTITY FULL;

-- Create function to automatically create user level when profile is created
CREATE OR REPLACE FUNCTION public.create_user_level()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_levels (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create user levels (drop if exists first)
DROP TRIGGER IF EXISTS create_user_level_trigger ON public.profiles;
CREATE TRIGGER create_user_level_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_level();

-- Function to update user XP and level
CREATE OR REPLACE FUNCTION public.update_user_xp(target_user_id UUID, xp_gain INTEGER)
RETURNS VOID AS $$
DECLARE
  new_total_xp INTEGER;
  new_level INTEGER;
BEGIN
  -- Update XP
  UPDATE public.user_levels 
  SET 
    current_xp = current_xp + xp_gain,
    total_xp = total_xp + xp_gain,
    updated_at = NOW()
  WHERE user_id = target_user_id
  RETURNING total_xp INTO new_total_xp;
  
  -- Calculate new level (every 100 XP = 1 level)
  new_level := LEAST(FLOOR(new_total_xp / 100) + 1, 100);
  
  -- Update level if changed
  UPDATE public.user_levels 
  SET level = new_level
  WHERE user_id = target_user_id AND level != new_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update comment counts and XP when comments are created
CREATE OR REPLACE FUNCTION public.handle_comment_xp()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Give XP for posting comment
    PERFORM public.update_user_xp(NEW.user_id, 10);
    
    -- Update comment count
    UPDATE public.user_levels 
    SET comments_count = comments_count + 1
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove XP and update count when comment is deleted
    PERFORM public.update_user_xp(OLD.user_id, -10);
    
    UPDATE public.user_levels 
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE user_id = OLD.user_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for XP system (drop if exists first)
DROP TRIGGER IF EXISTS handle_comment_xp_trigger ON public.comments;
CREATE TRIGGER handle_comment_xp_trigger
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_comment_xp();

DROP TRIGGER IF EXISTS handle_series_comment_xp_trigger ON public.series_comments;
CREATE TRIGGER handle_series_comment_xp_trigger
  AFTER INSERT OR DELETE ON public.series_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_comment_xp();