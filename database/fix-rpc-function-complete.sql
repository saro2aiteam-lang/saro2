-- 完整的 credit_user_credits_transaction RPC 函数修复
-- 解决所有问题：
-- 1. 没有 p_bucket 参数（从 metadata 中读取 bucket）
-- 2. 正确更新 subscription_credits_balance 和 flex_credits_balance
-- 3. 返回所有需要的字段
-- 在 Supabase Dashboard > SQL Editor 中执行

-- 删除所有旧版本的函数
DROP FUNCTION IF EXISTS credit_user_credits_transaction(UUID, INTEGER, TEXT, JSONB);
DROP FUNCTION IF EXISTS credit_user_credits_transaction(UUID, INTEGER, TEXT, JSONB, TEXT);
DROP FUNCTION IF EXISTS credit_user_credits_transaction(UUID, INTEGER, TEXT, JSONB, credit_bucket);

-- 确保 credit_bucket 类型存在
DO $$ BEGIN
  CREATE TYPE credit_bucket AS ENUM ('subscription','flex');
EXCEPTION WHEN duplicate_object THEN NULL; 
END $$;

-- 创建完整的函数（从 metadata 中读取 bucket，默认 flex）
CREATE OR REPLACE FUNCTION credit_user_credits_transaction(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(
  credits_balance INTEGER,
  credits_total INTEGER,
  credits_spent INTEGER,
  subscription_credits_balance INTEGER,
  flex_credits_balance INTEGER
) AS $$
DECLARE
  v_bucket credit_bucket;
  v_balance INTEGER;
  v_total INTEGER;
  v_spent INTEGER;
  v_sub_balance INTEGER;
  v_flex_balance INTEGER;
  max_allowed INTEGER := 100000;
BEGIN
  -- 检查参数
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Credit amount must be positive: %', p_amount;
  END IF;
  
  IF p_amount > max_allowed THEN
    RAISE EXCEPTION 'Amount too large: %', p_amount;
  END IF;
  
  -- 从 metadata 中读取 bucket，默认为 'flex'
  v_bucket := COALESCE(
    (p_metadata->>'bucket')::credit_bucket,
    'flex'::credit_bucket
  );
  
  -- 原子更新用户积分（使用表别名 u 避免歧义）
  UPDATE users u
  SET 
    subscription_credits_balance = COALESCE(u.subscription_credits_balance, 0) + 
      CASE WHEN v_bucket = 'subscription' THEN p_amount ELSE 0 END,
    flex_credits_balance = COALESCE(u.flex_credits_balance, 0) + 
      CASE WHEN v_bucket = 'flex' THEN p_amount ELSE 0 END,
    credits_total = COALESCE(u.credits_total, 0) + p_amount,
    updated_at = NOW()
  WHERE u.id = p_user_id
  RETURNING 
    u.credits_balance, 
    u.credits_total, 
    COALESCE(u.credits_spent, 0),
    u.subscription_credits_balance,
    u.flex_credits_balance
  INTO v_balance, v_total, v_spent, v_sub_balance, v_flex_balance;

  -- 检查是否更新成功
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;
  
  -- 记录交易（将 bucket 添加到 metadata 中）
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
    COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object('bucket', v_bucket::text)
  );
  
  -- 返回更新后的积分
  RETURN QUERY SELECT v_balance, v_total, v_spent, v_sub_balance, v_flex_balance;
    
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

