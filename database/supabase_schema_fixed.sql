-- ============================================================
-- 修正后的 Supabase 数据库 Schema
-- ============================================================
-- ⚠️ 重要：这是修正后的完整 schema，解决了表名不一致和缺失表的问题
-- 执行前请先查看 database/SCHEMA_ANALYSIS.md 了解问题详情
-- ============================================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. 用户表（关联 auth.users，存储积分信息）
-- ============================================================
-- ⚠️ 关键表：代码中大量使用，必须创建
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  subscription_plan VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(50) DEFAULT 'active',
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  credits_balance INTEGER DEFAULT 0,          -- ⭐ 当前可用积分
  credits_total INTEGER DEFAULT 0,            -- ⭐ 累计获得积分
  credits_spent INTEGER DEFAULT 0,             -- ⭐ 累计消费积分
  credits_limit INTEGER DEFAULT 50,            -- ⭐ 积分上限（代码中使用）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. 用户订阅表（关联 users，存储订阅详情）
-- ============================================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) DEFAULT 'free',        -- free, creator, studio, enterprise
  plan_status VARCHAR(50) DEFAULT 'active',     -- active, canceled, past_due, trialing
  credits INTEGER DEFAULT 3,                    -- 订阅包含的积分（可与 users.credits_balance 合并）
  total_credits INTEGER DEFAULT 3,
  credits_reset_date DATE,
  subscription_id VARCHAR(255),                 -- Creem 订阅 ID
  customer_id VARCHAR(255),                     -- Creem 客户 ID
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- 3. 视频生成任务表（代码中使用 video_jobs）
-- ============================================================
-- ⚠️ 表名：video_jobs（不是 video_generations）
CREATE TABLE IF NOT EXISTS video_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id VARCHAR(255) UNIQUE NOT NULL,          -- ⭐ 外部系统返回的任务 ID
  status VARCHAR(50) DEFAULT 'pending',         -- pending, processing, completed, failed, canceled, PENDING, RUNNING, SUCCEEDED, FAILED
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'canceled', 'PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED')),
  prompt TEXT,
  image_url TEXT,                               -- 输入图片 URL（图片生成视频时）
  aspect_ratio VARCHAR(10),                     -- 16:9, 9:16, 1:1
  quality VARCHAR(20),                          -- fast, standard, high
  duration INTEGER DEFAULT 10,                   -- 秒数
  result_url TEXT,                               -- 生成结果视频 URL
  preview_url TEXT,                             -- 预览图 URL
  error_message TEXT,
  cost_credits INTEGER DEFAULT 20,              -- 消耗的积分（标准字段名）
  credit_cost INTEGER,                           -- 消耗的积分（代码中使用的别名，与 cost_credits 相同）
  progress INTEGER DEFAULT 0,                    -- 进度百分比（0-100）
  CONSTRAINT valid_progress CHECK (progress >= 0 AND progress <= 100),
  visibility VARCHAR(20) DEFAULT 'private',      -- private, public
  model VARCHAR(50),                             -- 使用的模型：veo3, veo3_fast, sora-2-pro-storyboard 等
  params JSONB,                                 -- ⭐ 额外参数（JSON 格式存储复杂参数）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 4. 积分交易记录表（用于审计和追踪）
-- ============================================================
-- ⚠️ 关键表：缺失但代码中需要使用
CREATE TABLE IF NOT EXISTS credit_transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,                      -- 正数=增加，负数=扣除
  transaction_type VARCHAR(20) NOT NULL,        -- credit, debit, refund
  reason VARCHAR(100),                          -- purchase, subscription, refund, manual, generation
  metadata JSONB DEFAULT '{}',                   -- 额外信息
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 5. 支付记录表（代码中使用 payments）
-- ============================================================
-- ⚠️ 表名：payments（不是 payment_records）
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES user_subscriptions(id),
  payment_id VARCHAR(255) UNIQUE NOT NULL,
  payment_method VARCHAR(50) NOT NULL,           -- subscription, one-time
  amount INTEGER NOT NULL,                      -- 金额（分）
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL,                  -- pending, completed, failed, refunded
  product_type VARCHAR(50),                      -- creator-plan, studio-plan, starter-pack, etc.
  credits_purchased INTEGER DEFAULT 0,
  creem_payment_intent_id VARCHAR(255),
  creem_payment_id VARCHAR(255),
  invoice_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- 6. API 密钥表
-- ============================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  key_prefix VARCHAR(20) NOT NULL,              -- 显示用：veo_sk_1234...
  name VARCHAR(100) DEFAULT 'Default API Key',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0
);

-- ============================================================
-- 7. 使用统计表
-- ============================================================
CREATE TABLE IF NOT EXISTS usage_stats (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL,
  api_calls INTEGER DEFAULT 0,
  videos_generated INTEGER DEFAULT 0,
  credits_consumed DECIMAL(10,2) DEFAULT 0,
  total_processing_time_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, stat_date)
);

-- ============================================================
-- 8. 用户邮箱别名表（用于支付系统邮箱匹配）
-- ============================================================
CREATE TABLE IF NOT EXISTS user_email_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alias_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  UNIQUE(alias_email),
  UNIQUE(user_id, alias_email)
);

-- ============================================================
-- 9. 未匹配支付邮箱记录表（用于处理邮箱不一致的情况）
-- ============================================================
CREATE TABLE IF NOT EXISTS unmatched_payment_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  webhook_data JSONB,
  payment_id VARCHAR(255),
  subscription_id VARCHAR(255),
  amount DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
  resolved_user_id UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 10. 系统配置表
-- ============================================================
CREATE TABLE IF NOT EXISTS system_config (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 11. 创建索引（优化查询性能）
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_video_jobs_user_id ON video_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_video_jobs_status ON video_jobs(status);
CREATE INDEX IF NOT EXISTS idx_video_jobs_created_at ON video_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_jobs_job_id ON video_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_video_jobs_model ON video_jobs(model);
CREATE INDEX IF NOT EXISTS idx_video_jobs_params ON video_jobs USING gin(params);
CREATE INDEX IF NOT EXISTS idx_user_email_aliases_user_id ON user_email_aliases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_email_aliases_email ON user_email_aliases(alias_email);
CREATE INDEX IF NOT EXISTS idx_unmatched_payment_emails_email ON unmatched_payment_emails(email);
CREATE INDEX IF NOT EXISTS idx_unmatched_payment_emails_status ON unmatched_payment_emails(status);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(api_key) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_date ON usage_stats(user_id, stat_date);

-- ============================================================
-- 12. 创建更新时间触发器
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 删除已存在的触发器（如果存在）
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
DROP TRIGGER IF EXISTS update_video_jobs_updated_at ON video_jobs;
DROP TRIGGER IF EXISTS update_system_config_updated_at ON system_config;
DROP TRIGGER IF EXISTS update_unmatched_payment_emails_updated_at ON unmatched_payment_emails;

-- 创建触发器
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at 
    BEFORE UPDATE ON user_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_jobs_updated_at 
    BEFORE UPDATE ON video_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at 
    BEFORE UPDATE ON system_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unmatched_payment_emails_updated_at 
    BEFORE UPDATE ON unmatched_payment_emails 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 13. 创建新用户自动创建记录触发器
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- 创建 users 表记录
  INSERT INTO users (id, email, full_name, credits_balance, credits_total, credits_limit)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    3,  -- 免费用户初始 3 个积分
    3,
    50  -- 默认积分上限
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- 创建 user_subscriptions 记录
  INSERT INTO user_subscriptions (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 创建新触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 14. 启用 Row Level Security (RLS)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_email_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE unmatched_payment_emails ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 15. 创建 RLS 策略
-- ============================================================
-- 删除已存在的策略（如果存在），避免重复创建错误
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can view own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can view own generations" ON video_jobs;
DROP POLICY IF EXISTS "Users can create own generations" ON video_jobs;
DROP POLICY IF EXISTS "Users can update own generations" ON video_jobs;
DROP POLICY IF EXISTS "Users can view own transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can view own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can view own stats" ON usage_stats;
DROP POLICY IF EXISTS "Anyone can read system config" ON system_config;
DROP POLICY IF EXISTS "Users can view own email aliases" ON user_email_aliases;
DROP POLICY IF EXISTS "No public access to unmatched emails" ON unmatched_payment_emails;

-- Users 表策略
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- User subscriptions 策略
CREATE POLICY "Users can view own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Video jobs 策略
CREATE POLICY "Users can view own generations" ON video_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own generations" ON video_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generations" ON video_jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- Credit transactions 策略（用户只能查看自己的）
CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Payments 策略
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- API keys 策略
CREATE POLICY "Users can view own API keys" ON api_keys
  FOR ALL USING (auth.uid() = user_id);

-- Usage stats 策略
CREATE POLICY "Users can view own stats" ON usage_stats
  FOR SELECT USING (auth.uid() = user_id);

-- System config 所有用户可读
CREATE POLICY "Anyone can read system config" ON system_config
  FOR SELECT USING (true);

-- Email aliases 策略（用户只能查看自己的）
CREATE POLICY "Users can view own email aliases" ON user_email_aliases
  FOR SELECT USING (auth.uid() = user_id);

-- Unmatched payment emails（仅管理员可访问，普通用户无权限）
CREATE POLICY "No public access to unmatched emails" ON unmatched_payment_emails
  FOR SELECT USING (false);

-- ============================================================
-- 16. 插入默认系统配置
-- ============================================================
INSERT INTO system_config (config_key, config_value, description) VALUES
('credits_8s_720p_sora2fast', '1.0', '8秒720p Sora2 Fast 消耗 credits'),
('credits_12s_720p_sora2fast', '1.3', '12秒720p Sora2 Fast 消耗 credits'),
('credits_16s_1080p_sora2fast', '1.6', '16秒1080p Sora2 Fast 消耗 credits'),
('credits_1080p_bonus', '0.5', '1080p 分辨率额外消耗 credits'),
('credits_sora2_highfidelity_multiplier', '0.5', 'Sora2 High Fidelity 每秒额外消耗 credits'),
('max_daily_generations_free', '3', '免费用户每日最大生成次数'),
('max_concurrent_generations', '5', '最大并发生成数量'),
('free_user_initial_credits', '3', '新用户注册时的免费 credits')
ON CONFLICT (config_key) DO NOTHING;

-- ============================================================
-- 17. 创建 API 密钥生成函数
-- ============================================================
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
DECLARE
    api_key TEXT;
    key_exists BOOLEAN := TRUE;
BEGIN
    WHILE key_exists LOOP
        -- 生成 API 密钥: veo_sk_ + 随机字符
        api_key := 'veo_sk_' || encode(gen_random_bytes(24), 'base64');
        api_key := replace(replace(replace(api_key, '+', ''), '/', ''), '=', '');
        api_key := substring(api_key, 1, 39); -- 限制长度
        
        -- 检查是否已存在
        SELECT EXISTS(SELECT 1 FROM api_keys WHERE api_key = api_key) INTO key_exists;
    END LOOP;
    
    RETURN api_key;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 完成！
-- ============================================================
-- 现在你的数据库 schema 已经与代码完全匹配
-- 所有表名、字段都与代码中使用的一致
-- ============================================================

