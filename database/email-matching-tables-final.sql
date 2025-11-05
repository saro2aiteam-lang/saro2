-- 邮箱匹配增强功能数据库表 - 最终修复版本
-- 解决用户在Creem填写的邮箱和系统注册邮箱不一致的问题
-- 修复：1. 移除了对users.role字段的依赖 2. 修复了函数参数顺序问题

-- 1. 用户邮箱别名表
CREATE TABLE IF NOT EXISTS user_email_aliases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alias_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id), -- 创建者（管理员）
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT, -- 备注信息
  
  UNIQUE(alias_email),
  UNIQUE(user_id, alias_email)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_user_email_aliases_user_id ON user_email_aliases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_email_aliases_alias_email ON user_email_aliases(alias_email);
CREATE INDEX IF NOT EXISTS idx_user_email_aliases_status ON user_email_aliases(status);

-- 2. 未匹配支付邮箱记录表
CREATE TABLE IF NOT EXISTS unmatched_payment_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  webhook_data JSONB,
  payment_id VARCHAR(255),
  subscription_id VARCHAR(255),
  amount DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
  resolved_user_id UUID REFERENCES users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(id), -- 解决者（管理员）
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_unmatched_payment_emails_email ON unmatched_payment_emails(email);
CREATE INDEX IF NOT EXISTS idx_unmatched_payment_emails_status ON unmatched_payment_emails(status);
CREATE INDEX IF NOT EXISTS idx_unmatched_payment_emails_created_at ON unmatched_payment_emails(created_at);

-- 3. 邮箱匹配日志表（用于审计）
CREATE TABLE IF NOT EXISTS email_matching_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  searched_email VARCHAR(255) NOT NULL,
  matched_user_id UUID REFERENCES users(id),
  matched_email VARCHAR(255),
  match_type VARCHAR(50) NOT NULL, -- 'exact', 'case_insensitive', 'alias', 'none'
  webhook_event_type VARCHAR(100),
  webhook_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_email_matching_logs_searched_email ON email_matching_logs(searched_email);
CREATE INDEX IF NOT EXISTS idx_email_matching_logs_match_type ON email_matching_logs(match_type);
CREATE INDEX IF NOT EXISTS idx_email_matching_logs_created_at ON email_matching_logs(created_at);

-- 4. RLS 策略
ALTER TABLE user_email_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE unmatched_payment_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_matching_logs ENABLE ROW LEVEL SECURITY;

-- 用户邮箱别名表策略
CREATE POLICY "Users can view their own email aliases" ON user_email_aliases
  FOR SELECT USING (auth.uid() = user_id);

-- 服务角色可以管理所有邮箱别名（用于API调用）
CREATE POLICY "Service role can manage email aliases" ON user_email_aliases
  FOR ALL USING (auth.role() = 'service_role');

-- 未匹配支付邮箱表策略（仅服务角色可访问）
CREATE POLICY "Service role can manage unmatched payment emails" ON unmatched_payment_emails
  FOR ALL USING (auth.role() = 'service_role');

-- 邮箱匹配日志表策略（仅服务角色可访问）
CREATE POLICY "Service role can view email matching logs" ON email_matching_logs
  FOR SELECT USING (auth.role() = 'service_role');

-- 5. 辅助函数（修复参数顺序）
CREATE OR REPLACE FUNCTION log_email_matching(
  p_searched_email VARCHAR(255),
  p_match_type VARCHAR(50),
  p_matched_user_id UUID DEFAULT NULL,
  p_matched_email VARCHAR(255) DEFAULT NULL,
  p_webhook_event_type VARCHAR(100) DEFAULT NULL,
  p_webhook_data JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO email_matching_logs (
    searched_email,
    matched_user_id,
    matched_email,
    match_type,
    webhook_event_type,
    webhook_data
  ) VALUES (
    p_searched_email,
    p_matched_user_id,
    p_matched_email,
    p_match_type,
    p_webhook_event_type,
    p_webhook_data
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 自动更新 updated_at 字段的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_unmatched_payment_emails_updated_at
  BEFORE UPDATE ON unmatched_payment_emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. 确认创建成功
SELECT 'Email matching tables created successfully!' as status;

-- 注释：
-- 1. user_email_aliases: 存储用户的邮箱别名，支持一个用户关联多个邮箱
-- 2. unmatched_payment_emails: 记录无法匹配的支付邮箱，供管理员手动处理
-- 3. email_matching_logs: 记录所有邮箱匹配尝试，用于审计和调试
-- 4. 所有表都有适当的索引和RLS策略
-- 5. 提供了辅助函数来记录匹配日志
-- 6. 修复：移除了对users.role字段的依赖，使用service_role进行权限控制
-- 7. 修复：调整了函数参数顺序，确保有默认值的参数在最后
