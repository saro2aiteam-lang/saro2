-- 修复所有积分系统 RPC 函数
-- 解决列名歧义和其他问题
-- 在 Supabase Dashboard > SQL Editor 中执行

-- ============================================
-- 1. 修复 debit_user_credits_transaction
-- ============================================
DROP FUNCTION IF EXISTS debit_user_credits_transaction(UUID, INTEGER, TEXT, JSONB);
DROP FUNCTION IF EXISTS debit_user_credits_transaction(UUID, INTEGER, TEXT, JSONB, TEXT);
DROP FUNCTION IF EXISTS debit_user_credits_transaction(UUID, INTEGER, TEXT, JSONB, credit_bucket);

CREATE OR REPLACE FUNCTION debit_user_credits_transaction(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(
  credits_balance INTEGER,
  credits_total INTEGER,
  credits_spent INTEGER
) AS $$
DECLARE
  v_balance INTEGER;
  v_total   INTEGER;
  v_spent   INTEGER;
BEGIN
  -- 获取当前积分（使用表别名 u 避免歧义）
  SELECT 
    COALESCE(u.credits_balance, 0),
    COALESCE(u.credits_total, 0),
    COALESCE(u.credits_spent, 0)
  INTO v_balance, v_total, v_spent
  FROM users u
  WHERE u.id = p_user_id;
  
  -- 检查用户是否存在
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id USING ERRCODE = 'P0005';
  END IF;
  
  -- 检查积分余额
  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits: % (available: %)', p_amount, v_balance USING ERRCODE = 'P0008';
  END IF;
  
  -- 检查积分数量
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Credit amount must be positive: %', p_amount USING ERRCODE = 'P0003';
  END IF;
  
  -- 原子扣除（使用表别名 u 避免歧义）
  UPDATE users u
  SET 
    credits_balance = u.credits_balance - p_amount,
    credits_spent   = COALESCE(u.credits_spent, 0) + p_amount,
    updated_at      = NOW()
  WHERE u.id = p_user_id
    AND COALESCE(u.credits_balance, 0) >= p_amount
  RETURNING u.credits_balance, COALESCE(u.credits_total, 0), COALESCE(u.credits_spent, 0)
  INTO v_balance, v_total, v_spent;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to update user credits' USING ERRCODE = 'P0007';
  END IF;
  
  -- 记录交易
  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    reason,
    metadata
  ) VALUES (
    p_user_id,
    p_amount,
    'debit',
    p_reason,
    COALESCE(p_metadata, '{}'::jsonb)
  );
  
  -- 返回更新后的积分
  RETURN QUERY SELECT v_balance, v_total, v_spent;
    
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 2. 修复 refund_user_credits
-- ============================================
DROP FUNCTION IF EXISTS refund_user_credits(UUID, INTEGER, TEXT, JSONB);

CREATE OR REPLACE FUNCTION refund_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(
  credits_balance INTEGER,
  credits_total INTEGER,
  credits_spent INTEGER
) AS $$
DECLARE
  v_balance INTEGER;
  v_total   INTEGER;
  v_spent   INTEGER;
BEGIN
  -- 获取当前积分（使用表别名 u 避免歧义）
  SELECT 
    COALESCE(u.credits_balance, 0),
    COALESCE(u.credits_total, 0),
    COALESCE(u.credits_spent, 0)
  INTO v_balance, v_total, v_spent
  FROM users u
  WHERE u.id = p_user_id;
  
  -- 检查用户是否存在
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id USING ERRCODE = 'P0005';
  END IF;
  
  -- 检查积分数量
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Refund amount must be positive: %', p_amount USING ERRCODE = 'P0003';
  END IF;
  
  -- 退还积分（原子更新，使用表别名 u 避免歧义）
  UPDATE users u
  SET 
    credits_balance = COALESCE(u.credits_balance, 0) + p_amount,
    credits_spent   = GREATEST(COALESCE(u.credits_spent, 0) - p_amount, 0), -- 不能小于0
    updated_at      = NOW()
  WHERE u.id = p_user_id
  RETURNING u.credits_balance, COALESCE(u.credits_total, 0), COALESCE(u.credits_spent, 0)
  INTO v_balance, v_total, v_spent;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to refund user credits' USING ERRCODE = 'P0007';
  END IF;
  
  -- 记录退还交易
  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    reason,
    metadata
  ) VALUES (
    p_user_id,
    p_amount,
    'credit',
    'refund_' || p_reason,
    COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'refund_reason', p_reason,
      'refund_timestamp', NOW()
    )
  );
  
  -- 返回更新后的积分
  RETURN QUERY SELECT v_balance, v_total, v_spent;
    
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 3. 确保 credit_user_credits_transaction 正确
-- ============================================
-- 如果 credit 函数也有问题，可以取消下面的注释来修复
/*
DROP FUNCTION IF EXISTS credit_user_credits_transaction(UUID, INTEGER, TEXT, JSONB);
DROP FUNCTION IF EXISTS credit_user_credits_transaction(UUID, INTEGER, TEXT, JSONB, TEXT);
DROP FUNCTION IF EXISTS credit_user_credits_transaction(UUID, INTEGER, TEXT, JSONB, credit_bucket);

CREATE OR REPLACE FUNCTION credit_user_credits_transaction(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(
  credits_balance INTEGER,
  credits_total INTEGER,
  credits_spent INTEGER
) AS $$
DECLARE
  v_balance INTEGER;
  v_total   INTEGER;
  v_spent   INTEGER;
BEGIN
  -- 检查参数
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Credit amount must be positive: %', p_amount;
  END IF;
  
  -- 原子更新用户积分（使用表别名 u 避免歧义）
  UPDATE users u
  SET 
    credits_balance = COALESCE(u.credits_balance, 0) + p_amount,
    credits_total   = COALESCE(u.credits_total, 0) + p_amount,
    updated_at      = NOW()
  WHERE u.id = p_user_id
  RETURNING 
    u.credits_balance, 
    u.credits_total, 
    COALESCE(u.credits_spent, 0)
  INTO v_balance, v_total, v_spent;

  -- 检查是否更新成功
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;
  
  -- 记录交易
  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    reason,
    metadata
  ) VALUES (
    p_user_id,
    p_amount,
    'credit',
    p_reason,
    COALESCE(p_metadata, '{}'::jsonb)
  );
  
  -- 返回更新后的积分
  RETURN QUERY SELECT v_balance, v_total, v_spent;
    
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
*/

-- ============================================
-- 4. 验证函数创建成功
-- ============================================
SELECT 
  'Functions fixed successfully' as status,
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname IN ('debit_user_credits_transaction', 'refund_user_credits')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

