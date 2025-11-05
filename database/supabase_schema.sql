-- Sora2 Studio 数据库表结构 - 使用 Supabase Auth
-- 在 Supabase SQL Editor 中运行此脚本

-- 1. 用户订阅表 (关联到 auth.users)
CREATE TABLE user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  full_name VARCHAR(255),
  plan_type VARCHAR(50) DEFAULT 'free', -- free, creator, studio, enterprise
  plan_status VARCHAR(50) DEFAULT 'active', -- active, canceled, past_due, trialing
  credits INTEGER DEFAULT 3, -- 新用户免费 3 个 credits
  total_credits INTEGER DEFAULT 3,
  credits_reset_date DATE,
  subscription_id VARCHAR(255), -- Creem 订阅 ID
  customer_id VARCHAR(255), -- Creem 客户 ID
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. 视频生成历史表
CREATE TABLE video_generations (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_id VARCHAR(255) UNIQUE NOT NULL,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  duration INTEGER NOT NULL, -- 秒数: 6, 8, 10
  resolution VARCHAR(10) NOT NULL, -- 720p, 1080p
  model VARCHAR(50) NOT NULL, -- veo3-fast, veo3-standard
  status VARCHAR(50) DEFAULT 'processing', -- processing, completed, failed
  credits_used DECIMAL(5,2) NOT NULL,
  video_url TEXT,
  thumbnail_url TEXT,
  file_size_mb DECIMAL(8,2),
  processing_time_seconds INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 3. API 密钥表
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  key_prefix VARCHAR(20) NOT NULL, -- 前缀如 "veo_sk_"
  name VARCHAR(100) DEFAULT 'Default API Key',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0
);

-- 4. 支付记录表
CREATE TABLE payment_records (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id VARCHAR(255) UNIQUE NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- subscription, one-time
  amount_cents INTEGER NOT NULL, -- 金额（分）
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL, -- pending, completed, failed, refunded
  product_type VARCHAR(50), -- creator-plan, studio-plan, starter-pack, etc.
  credits_purchased INTEGER DEFAULT 0,
  creem_payment_intent_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- 5. 使用统计表
CREATE TABLE usage_stats (
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

-- 6. 系统配置表
CREATE TABLE system_config (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认配置
INSERT INTO system_config (config_key, config_value, description) VALUES
('credits_8s_720p_sora2fast', '1.0', '8秒720p Sora2 Fast 消耗 credits'),
('credits_12s_720p_sora2fast', '1.3', '12秒720p Sora2 Fast 消耗 credits'),
('credits_16s_1080p_sora2fast', '1.6', '16秒1080p Sora2 Fast 消耗 credits'),
('credits_1080p_bonus', '0.5', '1080p 分辨率额外消耗 credits'),
('credits_sora2_highfidelity_multiplier', '0.5', 'Sora2 High Fidelity 每秒额外消耗 credits'),
('max_daily_generations_free', '3', '免费用户每日最大生成次数'),
('max_concurrent_generations', '5', '最大并发生成数量'),
('free_user_initial_credits', '3', '新用户注册时的免费 credits');

-- 7. 创建索引以优化查询性能
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_video_generations_user_id ON video_generations(user_id);
CREATE INDEX idx_video_generations_status ON video_generations(status);
CREATE INDEX idx_video_generations_created_at ON video_generations(created_at DESC);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_active ON api_keys(api_key) WHERE is_active = TRUE;
CREATE INDEX idx_payment_records_user_id ON payment_records(user_id);
CREATE INDEX idx_usage_stats_user_date ON usage_stats(user_id, stat_date);

-- 8. 创建更新时间的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_subscriptions_updated_at 
    BEFORE UPDATE ON user_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at 
    BEFORE UPDATE ON system_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. 创建用户统计视图
CREATE VIEW user_stats_view AS
SELECT 
    us.user_id,
    us.email,
    us.full_name,
    us.plan_type,
    us.plan_status,
    us.credits,
    COUNT(vg.id) as total_generations,
    COALESCE(SUM(vg.credits_used), 0) as total_credits_used,
    MAX(vg.created_at) as last_generation_at,
    us.created_at as user_created_at,
    au.email_confirmed_at,
    au.last_sign_in_at
FROM user_subscriptions us
LEFT JOIN video_generations vg ON us.user_id = vg.user_id
LEFT JOIN auth.users au ON us.user_id = au.id
GROUP BY us.user_id, us.email, us.full_name, us.plan_type, us.plan_status, 
         us.credits, us.created_at, au.email_confirmed_at, au.last_sign_in_at;

-- 10. 创建函数：新用户自动创建订阅记录
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：用户注册时自动创建订阅记录
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 11. 创建 RLS (行级安全) 策略
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can view own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own generations" ON video_generations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own API keys" ON api_keys
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payments" ON payment_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stats" ON usage_stats
  FOR SELECT USING (auth.uid() = user_id);

-- 系统配置表所有用户都可以读取
CREATE POLICY "Anyone can read system config" ON system_config
  FOR SELECT USING (true);

-- 12. 创建 API 密钥生成函数
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
DECLARE
    api_key TEXT;
    key_exists BOOLEAN := TRUE;
BEGIN
    WHILE key_exists LOOP
        -- 生成 API 密钥: veo_sk_ + 32位随机字符
        api_key := 'veo_sk_' || encode(gen_random_bytes(24), 'base64');
        api_key := replace(replace(replace(api_key, '+', ''), '/', ''), '=', '');
        api_key := substring(api_key, 1, 39); -- 限制长度
        
        -- 检查是否已存在
        SELECT EXISTS(SELECT 1 FROM api_keys WHERE api_key = api_key) INTO key_exists;
    END LOOP;
    
    RETURN api_key;
END;
$$ LANGUAGE plpgsql;

-- 13. 创建获取用户 Credits 的函数
CREATE OR REPLACE FUNCTION get_user_credits(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    user_credits INTEGER;
BEGIN
    SELECT credits INTO user_credits 
    FROM user_subscriptions 
    WHERE user_id = user_uuid;
    
    RETURN COALESCE(user_credits, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. 创建扣除 Credits 的函数
CREATE OR REPLACE FUNCTION deduct_user_credits(user_uuid UUID, credits_to_deduct DECIMAL)
RETURNS BOOLEAN AS $$
DECLARE
    current_credits INTEGER;
BEGIN
    -- 获取当前 credits
    SELECT credits INTO current_credits 
    FROM user_subscriptions 
    WHERE user_id = user_uuid;
    
    -- 检查余额是否足够
    IF current_credits IS NULL OR current_credits < credits_to_deduct THEN
        RETURN FALSE;
    END IF;
    
    -- 扣除 credits
    UPDATE user_subscriptions 
    SET credits = credits - credits_to_deduct,
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. 创建添加 Credits 的函数（购买/充值时使用）
CREATE OR REPLACE FUNCTION add_user_credits(user_uuid UUID, credits_to_add INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_subscriptions 
    SET credits = credits + credits_to_add,
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
