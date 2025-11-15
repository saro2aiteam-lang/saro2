-- 修复 debit_user_credits_transaction RPC 函数
-- 解决 "column reference credits_balance is ambiguous" 错误
-- 在 Supabase Dashboard > SQL Editor 中执行

-- 删除旧版本的函数（如果有）
DROP FUNCTION IF EXISTS debit_user_credits_transaction(UUID, INTEGER, TEXT, JSONB);
DROP FUNCTION IF EXISTS debit_user_credits_transaction(UUID, INTEGER, TEXT, JSONB, TEXT);
DROP FUNCTION IF EXISTS debit_user_credits_transaction(UUID, INTEGER, TEXT, JSONB, credit_bucket);

-- 创建修复后的函数（使用表别名避免歧义）
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
    -- 事务自动回滚
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 验证函数创建成功
SELECT 
  'Function created successfully' as status,
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'debit_user_credits_transaction' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

