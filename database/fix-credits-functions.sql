-- 创建正确的积分管理存储过程
-- 这些存储过程应该返回积分快照信息

-- 1. 创建积分扣除存储过程
CREATE OR REPLACE FUNCTION debit_user_credits(
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
  current_credits INTEGER;
  new_balance INTEGER;
BEGIN
  -- 获取当前积分
  SELECT COALESCE(credits_balance, 0) INTO current_credits 
  FROM users 
  WHERE id = p_user_id;
  
  -- 检查余额是否足够
  IF current_credits < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits balance' USING ERRCODE = 'P0001';
  END IF;
  
  -- 扣除积分
  UPDATE users 
  SET 
    credits_balance = credits_balance - p_amount,
    credits_spent = COALESCE(credits_spent, 0) + p_amount,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- 记录交易
  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    reason,
    metadata
  ) VALUES (
    p_user_id,
    -p_amount,
    'debit',
    p_reason,
    p_metadata
  );
  
  -- 返回更新后的积分快照
  RETURN QUERY
  SELECT 
    COALESCE(u.credits_balance, 0)::INTEGER as credits_balance,
    COALESCE(u.credits_total, 0)::INTEGER as credits_total,
    COALESCE(u.credits_spent, 0)::INTEGER as credits_spent
  FROM users u
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 创建积分增加存储过程
CREATE OR REPLACE FUNCTION credit_user_credits(
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
BEGIN
  -- 增加积分
  UPDATE users 
  SET 
    credits_balance = COALESCE(credits_balance, 0) + p_amount,
    credits_total = COALESCE(credits_total, 0) + p_amount,
    updated_at = NOW()
  WHERE id = p_user_id;
  
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
    p_metadata
  );
  
  -- 返回更新后的积分快照
  RETURN QUERY
  SELECT 
    COALESCE(u.credits_balance, 0)::INTEGER as credits_balance,
    COALESCE(u.credits_total, 0)::INTEGER as credits_total,
    COALESCE(u.credits_spent, 0)::INTEGER as credits_spent
  FROM users u
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 确保credit_transactions表存在
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);

-- 5. 添加RLS策略
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果存在）
DROP POLICY IF EXISTS "Users can view own credit transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Service role can manage credit transactions" ON credit_transactions;

-- 创建新的策略
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage credit transactions" ON credit_transactions
  FOR ALL USING (auth.role() = 'service_role');
