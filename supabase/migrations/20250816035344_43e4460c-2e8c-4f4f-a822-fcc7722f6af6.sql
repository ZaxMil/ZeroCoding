-- CRITICAL SECURITY FIXES: Phase 1 - Simplified Implementation
-- Fix the most critical email exposure vulnerabilities

-- 1. Fix profiles table policies to prevent email exposure
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create new secure policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = user_id AND NOT is_user_banned());

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT
  USING (is_admin());

-- 2. Create function to get safe user profile data (email-free)
CREATE OR REPLACE FUNCTION get_public_user_profile(target_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  username TEXT,
  display_name TEXT,
  bio TEXT,
  profile_picture_url TEXT,
  role TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.username,
    p.display_name,
    p.bio,
    p.profile_picture_url,
    p.role::TEXT
  FROM profiles p
  WHERE p.user_id = target_user_id
  AND (p.is_profile_public = true OR auth.uid() = p.user_id OR is_admin());
END;
$$;

-- 3. Secure customers table completely - admin only access
DROP POLICY IF EXISTS "Admins can manage customers" ON customers;
DROP POLICY IF EXISTS "Customers can view their own data" ON customers;

CREATE POLICY "Only admins can access customer data" ON customers
  FOR ALL
  USING (is_admin());

-- 4. Secure donations table completely - admin only access  
DROP POLICY IF EXISTS "Admins can view all donations" ON donations;
DROP POLICY IF EXISTS "System can insert donations" ON donations;

CREATE POLICY "Only admins can view donations" ON donations
  FOR SELECT
  USING (is_admin());

CREATE POLICY "System can insert donations" ON donations
  FOR INSERT
  WITH CHECK (true);

-- 5. Create security audit table for logging
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  event_data JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'info',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view security logs" ON security_audit_logs
  FOR SELECT
  USING (is_admin());

CREATE POLICY "System can log security events" ON security_audit_logs
  FOR INSERT
  WITH CHECK (true);

-- 6. Create secure comment display function
CREATE OR REPLACE FUNCTION get_comment_author_safe(target_user_id UUID)
RETURNS TABLE (
  display_name TEXT,
  username TEXT,
  profile_picture_url TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p.display_name, p.username, 'Anonymous') as display_name,
    p.username,
    p.profile_picture_url
  FROM profiles p
  WHERE p.user_id = target_user_id;
END;
$$;