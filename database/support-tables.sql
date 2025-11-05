-- 支持表结构
-- 在 Supabase Dashboard > SQL Editor 中执行

-- 1. Webhook失败记录表
CREATE TABLE IF NOT EXISTS webhook_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id VARCHAR(255),
  customer_id VARCHAR(255),
  plan_id VARCHAR(255),
  webhook_data JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  last_retry_at TIMESTAMP,
  processed_at TIMESTAMP
);

-- 2. 待匹配积分表（用户匹配失败时使用）
CREATE TABLE IF NOT EXISTS pending_user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id VARCHAR(255),
  customer_email VARCHAR(255),
  payment_id VARCHAR(255),
  plan_id VARCHAR(255),
  credit_amount INTEGER,
  webhook_data JSONB,
  status VARCHAR(50) DEFAULT 'pending_match',
  matched_user_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

-- 3. 失败生成任务表（需要退款的任务）
CREATE TABLE IF NOT EXISTS failed_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT,
  duration INTEGER,
  resolution VARCHAR(20),
  model VARCHAR(50),
  credits_deducted INTEGER,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  last_retry_at TIMESTAMP,
  processed_at TIMESTAMP
);

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_webhook_failures_status ON webhook_failures(status);
CREATE INDEX IF NOT EXISTS idx_webhook_failures_created_at ON webhook_failures(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_failures_payment_id ON webhook_failures(payment_id);

CREATE INDEX IF NOT EXISTS idx_pending_user_credits_status ON pending_user_credits(status);
CREATE INDEX IF NOT EXISTS idx_pending_user_credits_created_at ON pending_user_credits(created_at);
CREATE INDEX IF NOT EXISTS idx_pending_user_credits_customer_email ON pending_user_credits(customer_email);

CREATE INDEX IF NOT EXISTS idx_failed_generations_user_id ON failed_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_failed_generations_status ON failed_generations(status);
CREATE INDEX IF NOT EXISTS idx_failed_generations_created_at ON failed_generations(created_at);

-- 5. 启用行级安全
ALTER TABLE webhook_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_generations ENABLE ROW LEVEL SECURITY;

-- 6. 创建RLS策略
-- Webhook失败表 - 只有service role可以访问
CREATE POLICY "Service role can manage webhook failures" ON webhook_failures
  FOR ALL USING (auth.role() = 'service_role');

-- 待匹配积分表 - 只有service role可以访问
CREATE POLICY "Service role can manage pending credits" ON pending_user_credits
  FOR ALL USING (auth.role() = 'service_role');

-- 失败生成表 - 用户只能查看自己的记录，service role可以管理所有
CREATE POLICY "Users can view own failed generations" ON failed_generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage failed generations" ON failed_generations
  FOR ALL USING (auth.role() = 'service_role');

-- 7. 创建手动处理函数
-- 手动处理webhook失败
CREATE OR REPLACE FUNCTION process_failed_webhook(p_failure_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  failure_record webhook_failures%ROWTYPE;
  credit_amount INTEGER;
  plan_config RECORD;
BEGIN
  SELECT * INTO failure_record FROM webhook_failures WHERE id = p_failure_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Webhook failure record not found: %', p_failure_id;
  END IF;
  
  -- 获取积分数量（这里需要根据实际的计划配置调整）
  -- 暂时使用固定值，实际应该从creem_plans表或配置中获取
  credit_amount := CASE failure_record.plan_id
    WHEN 'starter' THEN 300
    WHEN 'creator_pack' THEN 1500
    WHEN 'dev_team' THEN 6000
    ELSE 0
  END;
  
  IF credit_amount = 0 THEN
    RAISE EXCEPTION 'Unknown plan_id: %', failure_record.plan_id;
  END IF;
  
  -- 发放积分
  PERFORM credit_user_credits_transaction(
    failure_record.customer_id::UUID,
    credit_amount,
    'webhook_retry',
    jsonb_build_object('original_failure_id', p_failure_id)
  );
  
  -- 标记为已处理
  UPDATE webhook_failures 
  SET status = 'processed', processed_at = NOW()
  WHERE id = p_failure_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 手动匹配用户积分
CREATE OR REPLACE FUNCTION manual_user_match(
  p_pending_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  pending_record pending_user_credits%ROWTYPE;
BEGIN
  SELECT * INTO pending_record FROM pending_user_credits WHERE id = p_pending_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending credit record not found: %', p_pending_id;
  END IF;
  
  -- 发放积分
  PERFORM credit_user_credits_transaction(
    p_user_id,
    pending_record.credit_amount,
    'manual_match',
    jsonb_build_object(
      'original_payment_id', pending_record.payment_id,
      'matched_by', 'admin'
    )
  );
  
  -- 更新状态
  UPDATE pending_user_credits 
  SET 
    status = 'processed',
    matched_user_id = p_user_id,
    processed_at = NOW()
  WHERE id = p_pending_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 验证表创建成功
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'webhook_failures',
    'pending_user_credits',
    'failed_generations'
  )
ORDER BY table_name;
