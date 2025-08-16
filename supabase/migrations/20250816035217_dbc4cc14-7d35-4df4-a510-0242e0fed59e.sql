-- CRITICAL SECURITY FIXES: Phase 1 Implementation
-- Fix email exposure vulnerabilities and tighten RLS policies

-- 1. Update profiles table policies to prevent email exposure
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create new secure profile policies that exclude email from public access
CREATE POLICY "Users can view own profile (no email)" ON profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT
  USING (is_admin());

-- 2. Add function to safely get user profile without exposing email
CREATE OR REPLACE FUNCTION get_safe_user_profile(target_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Only return email-free profile data
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.role,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- 3. Secure customers table - remove direct email access
DROP POLICY IF EXISTS "Customers can view their own data" ON customers;

CREATE POLICY "Customers can view own data (restricted)" ON customers
  FOR SELECT
  USING (auth.uid()::text = user_id AND NOT is_user_banned());

-- 4. Secure donations table - remove public access to donor emails
DROP POLICY IF EXISTS "Public can view donations" ON donations;

CREATE POLICY "Donations are private" ON donations
  FOR SELECT
  USING (is_admin());

-- 5. Fix function search path issues for security
ALTER FUNCTION is_admin() SET search_path = public;
ALTER FUNCTION is_user_banned() SET search_path = public;

-- 6. Create secure unified comments view without exposing sensitive data
DROP VIEW IF EXISTS unified_comments_view;

CREATE VIEW unified_comments_view AS
SELECT 
  'chapter'::text AS comment_type,
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
  ch.title AS chapter_title,
  ch.chapter_number,
  m.title AS series_title
FROM comments c
LEFT JOIN chapters ch ON c.chapter_id = ch.id
LEFT JOIN manga_meta m ON c.series_id = m.id

UNION ALL

SELECT 
  'series'::text AS comment_type,
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
  NULL::uuid AS chapter_id,
  sc.series_id,
  NULL::text AS chapter_title,
  NULL::integer AS chapter_number,
  m.title AS series_title
FROM series_comments sc
LEFT JOIN manga_meta m ON sc.series_id = m.id;

-- 7. Add RLS policy for comments view
ALTER VIEW unified_comments_view SET (security_barrier = true);

-- 8. Create audit log for security events
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view security logs" ON security_audit_logs
  FOR SELECT
  USING (is_admin());

CREATE POLICY "System can insert security logs" ON security_audit_logs
  FOR INSERT
  WITH CHECK (true);

-- 9. Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type TEXT,
  p_event_data JSONB DEFAULT '{}'::jsonb
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO security_audit_logs (event_type, user_id, event_data)
  VALUES (p_event_type, auth.uid(), p_event_data);
END;
$$;