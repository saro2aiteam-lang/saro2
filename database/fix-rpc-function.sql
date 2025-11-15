-- 修复 credit_user_credits_transaction RPC 函数
-- 解决 "column reference credits_balance is ambiguous" 错误
-- 在 Supabase Dashboard > SQL Editor 中执行

-- 删除旧版本的函数（如果有）
DROP FUNCTION IF EXISTS credit_user_credits_transaction(UUID, INTEGER, TEXT, JSONB);
DROP FUNCTION IF EXISTS credit_user_credits_transaction(UUID, INTEGER, TEXT, JSONB, TEXT);
DROP FUNCTION IF EXISTS credit_user_credits_transaction(UUID, INTEGER, TEXT, JSONB, credit_bucket);

-- 创建修复后的函数（使用表别名避免歧义）
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
  
  -- 记录交易（RPC 函数会自动插入 transaction_type='credit'）
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

-- 验证函数创建成功
SELECT 
  'Function created successfully' as status,
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'credit_user_credits_transaction' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

