-- PHASE A: Complete coins unlock system with missing RPCs and RLS
-- Note: Some tables already exist, only create missing ones

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_created ON coin_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chapter_access_lookup ON chapter_access (user_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_prices_lookup ON chapter_prices (chapter_id);

-- Drop existing functions to recreate with correct signatures
DROP FUNCTION IF EXISTS public.get_user_coin_balance(uuid);
DROP FUNCTION IF EXISTS public.user_has_chapter_access(uuid, uuid);
DROP FUNCTION IF EXISTS public.process_coin_transaction(uuid, integer, text, text, uuid, text, uuid);
DROP FUNCTION IF EXISTS public.unlock_chapter_with_coins(uuid, uuid);

-- 1. create_coin_wallet: Ensure wallet exists
CREATE OR REPLACE FUNCTION public.create_coin_wallet(user_id_param uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wallet_id UUID;
BEGIN
  INSERT INTO public.coin_wallets (user_id, balance, lifetime_earned, lifetime_spent)
  VALUES (user_id_param, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO wallet_id;
  
  -- Return existing wallet ID if conflict occurred
  IF wallet_id IS NULL THEN
    SELECT id INTO wallet_id FROM public.coin_wallets WHERE user_id = user_id_param;
  END IF;
  
  RETURN wallet_id;
END;
$$;

-- 2. get_user_coin_balance: Get current balance
CREATE FUNCTION public.get_user_coin_balance(user_id_param uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(balance, 0)
  FROM public.coin_wallets
  WHERE user_id = user_id_param;
$$;

-- 3. user_has_chapter_access: Check if user can access chapter
CREATE FUNCTION public.user_has_chapter_access(chapter_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_access BOOLEAN := false;
  is_premium BOOLEAN := false;
  is_chapter_locked BOOLEAN;
  chapter_price INTEGER;
BEGIN
  -- Check if user is admin
  IF is_admin(user_id_param) THEN
    RETURN true;
  END IF;
  
  -- Check if user has direct access
  SELECT EXISTS(
    SELECT 1 FROM public.chapter_access 
    WHERE user_id = user_id_param AND chapter_id = chapter_id_param
  ) INTO has_access;
  
  IF has_access THEN
    RETURN true;
  END IF;
  
  -- Check if chapter is locked
  SELECT is_locked INTO is_chapter_locked
  FROM public.chapters
  WHERE id = chapter_id_param;
  
  -- If chapter is not locked in main table, allow access
  IF NOT is_chapter_locked THEN
    -- Check if there's a coin cost
    SELECT COALESCE(coin_cost, 0) INTO chapter_price
    FROM public.chapter_prices
    WHERE chapter_id = chapter_id_param;
    
    -- If no coin cost, grant free access
    IF chapter_price = 0 THEN
      RETURN true;
    END IF;
  END IF;
  
  -- Check if user is premium and chapter allows premium access
  SELECT is_premium_user(user_id_param) INTO is_premium;
  
  IF is_premium THEN
    SELECT NOT COALESCE(premium_only, false) INTO has_access
    FROM public.chapter_prices
    WHERE chapter_id = chapter_id_param;
    
    IF has_access IS NULL THEN
      has_access := true; -- No pricing record means free for premium
    END IF;
  END IF;
  
  RETURN COALESCE(has_access, false);
END;
$$;

-- 4. process_coin_transaction: Handle coin transactions
CREATE FUNCTION public.process_coin_transaction(
  user_id_param uuid, 
  amount_param integer, 
  type_param text, 
  context_param text, 
  reference_id_param uuid, 
  description_param text, 
  admin_user_id_param uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
  wallet_exists BOOLEAN;
BEGIN
  -- Validate amount is not zero
  IF amount_param = 0 THEN
    RETURN false;
  END IF;
  
  -- Check if wallet exists, create if not
  SELECT EXISTS(SELECT 1 FROM public.coin_wallets WHERE user_id = user_id_param) INTO wallet_exists;
  
  IF NOT wallet_exists THEN
    PERFORM public.create_coin_wallet(user_id_param);
  END IF;
  
  -- Get current balance
  SELECT balance INTO current_balance
  FROM public.coin_wallets
  WHERE user_id = user_id_param;
  
  -- Check if user has enough coins for spending (negative amounts)
  IF amount_param < 0 AND current_balance < ABS(amount_param) THEN
    RETURN false;
  END IF;
  
  -- Create transaction record
  INSERT INTO public.coin_transactions (
    user_id, amount, type, context, reference_id, description, admin_user_id
  )
  VALUES (
    user_id_param, amount_param, type_param, context_param, 
    reference_id_param, description_param, admin_user_id_param
  );
  
  -- Update wallet balance and lifetime stats
  IF amount_param > 0 THEN
    -- Credit/earning
    UPDATE public.coin_wallets
    SET 
      balance = balance + amount_param,
      lifetime_earned = lifetime_earned + amount_param,
      updated_at = now()
    WHERE user_id = user_id_param;
  ELSE
    -- Debit/spending
    UPDATE public.coin_wallets
    SET 
      balance = balance + amount_param, -- amount_param is negative
      lifetime_spent = lifetime_spent + ABS(amount_param),
      updated_at = now()
    WHERE user_id = user_id_param;
  END IF;
  
  RETURN true;
END;
$$;

-- 5. unlock_chapter_with_coins: Main unlock function
CREATE FUNCTION public.unlock_chapter_with_coins(chapter_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  coin_cost INTEGER;
  user_balance INTEGER;
  access_exists BOOLEAN;
BEGIN
  -- Check if user already has access
  SELECT public.user_has_chapter_access(chapter_id_param, user_id_param) INTO access_exists;
  
  IF access_exists THEN
    RETURN true;
  END IF;
  
  -- Get chapter cost
  SELECT COALESCE(coin_cost, 0) INTO coin_cost
  FROM public.chapter_prices
  WHERE chapter_id = chapter_id_param;
  
  -- If no pricing record, chapter is not purchasable
  IF coin_cost IS NULL THEN
    RETURN false;
  END IF;
  
  -- If chapter is free, grant access
  IF coin_cost = 0 THEN
    INSERT INTO public.chapter_access (user_id, chapter_id)
    VALUES (user_id_param, chapter_id_param)
    ON CONFLICT (user_id, chapter_id) DO NOTHING;
    RETURN true;
  END IF;
  
  -- Ensure wallet exists
  PERFORM public.create_coin_wallet(user_id_param);
  
  -- Check user balance with row locking
  SELECT balance INTO user_balance
  FROM public.coin_wallets
  WHERE user_id = user_id_param
  FOR UPDATE;
  
  IF user_balance < coin_cost THEN
    RETURN false;
  END IF;
  
  -- Process coin transaction (negative amount for spending)
  IF public.process_coin_transaction(
    user_id_param, -coin_cost, 'spend', 'chapter_unlock', chapter_id_param,
    'Unlocked chapter with coins', NULL
  ) THEN
    -- Grant chapter access
    INSERT INTO public.chapter_access (user_id, chapter_id)
    VALUES (user_id_param, chapter_id_param)
    ON CONFLICT (user_id, chapter_id) DO NOTHING;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.create_coin_wallet(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_coin_balance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_chapter_access(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_coin_transaction(uuid, integer, text, text, uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_chapter_with_coins(uuid, uuid) TO authenticated;