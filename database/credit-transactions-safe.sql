-- 积分系统事务安全函数
-- 在 Supabase Dashboard > SQL Editor 中执行

-- 1. 创建事务安全的积分增加函数（原子更新 + 别名 + 固定 search_path）
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
  -- 开始事务（函数内部自动事务）
  
  -- 1. 获取当前积分
  SELECT 
    COALESCE(credits_balance, 0),
    COALESCE(credits_total, 0),
    COALESCE(credits_spent, 0)
  INTO v_balance, v_total, v_spent
  FROM users 
  WHERE id = p_user_id;
  
  -- 检查用户是否存在
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id USING ERRCODE = 'P0005';
  END IF;
  
  -- 检查积分数量
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Credit amount must be positive: %', p_amount USING ERRCODE = 'P0003';
  END IF;
  
  -- 检查积分上限
  IF v_balance + p_amount > 50000 THEN
    RAISE EXCEPTION 'Credit balance would exceed limit: %', v_balance + p_amount USING ERRCODE = 'P0006';
  END IF;
  
  -- 2. 原子更新用户积分
  UPDATE users u
  SET 
    credits_balance = COALESCE(u.credits_balance, 0) + p_amount,
    credits_total   = COALESCE(u.credits_total, 0) + p_amount,
    updated_at      = NOW()
  WHERE u.id = p_user_id
  RETURNING u.credits_balance, u.credits_total, COALESCE(u.credits_spent, 0)
  INTO v_balance, v_total, v_spent;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to update user credits' USING ERRCODE = 'P0007';
  END IF;
  
  -- 3. 记录交易
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
  
  -- 4. 返回更新后的积分
  RETURN QUERY SELECT v_balance::INT, v_total::INT, v_spent::INT;
    
EXCEPTION
  WHEN OTHERS THEN
    -- 事务自动回滚
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. 创建事务安全的积分扣除函数（原子更新 + 别名 + 固定 search_path）
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
  -- 获取当前积分
  SELECT 
    COALESCE(credits_balance, 0),
    COALESCE(credits_total, 0),
    COALESCE(credits_spent, 0)
  INTO v_balance, v_total, v_spent
  FROM users 
  WHERE id = p_user_id;
  
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
  
  -- 原子扣除
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
  RETURN QUERY SELECT v_balance::INT, v_total::INT, v_spent::INT;
    
EXCEPTION
  WHEN OTHERS THEN
    -- 事务自动回滚
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. 创建积分退还函数（原子更新 + 别名 + 固定 search_path）
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
  -- 获取当前积分
  SELECT 
    COALESCE(credits_balance, 0),
    COALESCE(credits_spent, 0)
  INTO v_balance, v_spent
  FROM users 
  WHERE id = p_user_id;
  
  -- 检查用户是否存在
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id USING ERRCODE = 'P0005';
  END IF;
  
  -- 检查积分数量
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Refund amount must be positive: %', p_amount USING ERRCODE = 'P0003';
  END IF;
  
  -- 退还积分（原子更新）
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
  RETURN QUERY SELECT v_balance::INT, v_total::INT, v_spent::INT;
    
EXCEPTION
  WHEN OTHERS THEN
    -- 事务自动回滚
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. 创建权限策略
-- 删除已存在的策略（如果存在）
DROP POLICY IF EXISTS "Service role can manage credit transactions" ON credit_transactions;

-- 创建新的策略
CREATE POLICY "Service role can manage credit transactions" ON credit_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- 5. 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_reason ON credit_transactions(reason);

-- 6. 验证函数创建成功
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'credit_user_credits_transaction',
    'debit_user_credits_transaction', 
    'refund_user_credits'
  )
ORDER BY routine_name;
