-- CRITICAL SECURITY FIXES: Phase 1 - Corrected Implementation
-- Fix email exposure vulnerabilities based on actual table structures

-- 1. Fix profiles table to prevent email exposure in public queries
DROP POLICY IF EXISTS "Users can view own profile (no email)" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create secure profile viewing policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT
  USING (is_admin());

-- 2. Add function to get safe user profile data without exposing email to public
CREATE OR REPLACE FUNCTION get_public_user_profile(target_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  username TEXT,
  display_name TEXT,
  bio TEXT,
  profile_picture_url TEXT,
  banner_image_url TEXT,
  join_date DATE,
  is_profile_public BOOLEAN,
  role TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Only return safe profile data, no email or sensitive info
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.username,
    p.display_name,
    p.bio,
    p.profile_picture_url,
    p.banner_image_url,
    p.join_date,
    p.is_profile_public,
    p.role::TEXT
  FROM profiles p
  WHERE p.user_id = target_user_id
  AND (p.is_profile_public = true OR auth.uid() = p.user_id OR is_admin());
END;
$$;

-- 3. Secure customers table - restrict access to customer personal data
DROP POLICY IF EXISTS "Customers can view own data (restricted)" ON customers;

CREATE POLICY "Only admins can view customer data" ON customers
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Only admins can manage customer data" ON customers
  FOR ALL
  USING (is_admin());

-- 4. Secure donations table - make donor information private
DROP POLICY IF EXISTS "Donations are private" ON donations;

CREATE POLICY "Only admins can view donations" ON donations
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Only admins can manage donations" ON donations
  FOR ALL
  USING (is_admin());

-- 5. Create secure comment user display function to avoid email exposure
CREATE OR REPLACE FUNCTION get_comment_user_display(target_user_id UUID)
RETURNS TABLE (
  display_name TEXT,
  username TEXT,
  profile_picture_url TEXT,
  role TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p.display_name, p.username, 'Anonymous') as display_name,
    p.username,
    p.profile_picture_url,
    p.role::TEXT
  FROM profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- 6. Fix all function search paths for security compliance
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Fix search paths for all functions that don't have it set
    FOR func_record IN 
        SELECT schemaname, proname 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.prosecdef = true  -- SECURITY DEFINER functions
        AND NOT EXISTS (
            SELECT 1 FROM pg_proc_settings 
            WHERE pg_proc_settings.proname = p.proname 
            AND pg_proc_settings.setting = 'search_path'
        )
    LOOP
        EXECUTE format('ALTER FUNCTION %I.%I() SET search_path = public', 
                      func_record.schemaname, func_record.proname);
    END LOOP;
END $$;

-- 7. Create comprehensive security audit logging
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  event_data JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'info',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view security logs" ON security_audit_logs
  FOR SELECT
  USING (is_admin());

CREATE POLICY "System can insert security logs" ON security_audit_logs
  FOR INSERT
  WITH CHECK (true);

-- 8. Create secure logging function
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type TEXT,
  p_severity TEXT DEFAULT 'info',
  p_event_data JSONB DEFAULT '{}'::jsonb
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO security_audit_logs (event_type, user_id, event_data, severity)
  VALUES (p_event_type, auth.uid(), p_event_data, p_severity);
EXCEPTION WHEN OTHERS THEN
  -- Silently fail to prevent blocking operations
  NULL;
END;
$$;

-- 9. Create function to safely check admin status without recursion
CREATE OR REPLACE FUNCTION check_admin_role(target_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE user_id = target_user_id;
  RETURN (user_role = 'admin');
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- 10. Log this security fix
SELECT log_security_event('security_policies_updated', 'high', '{"action": "critical_security_fixes_applied", "tables": ["profiles", "customers", "donations"]}');