-- ============================================================
-- 修复 user_subscriptions 表字段名不一致问题
-- ============================================================
-- 问题：代码中使用了 creem_subscription_id，但 fixed schema 中只有 subscription_id
-- 解决方案：添加 creem_subscription_id 字段，保持向后兼容
-- ============================================================

-- 1. 添加 creem_subscription_id 字段（如果不存在）
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS creem_subscription_id VARCHAR(255);

-- 2. 将现有的 subscription_id 数据复制到 creem_subscription_id（如果为空）
UPDATE user_subscriptions 
SET creem_subscription_id = subscription_id 
WHERE creem_subscription_id IS NULL 
  AND subscription_id IS NOT NULL;

-- 3. 添加索引（优化查询性能）
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_creem_subscription_id 
ON user_subscriptions(creem_subscription_id);

-- 4. 验证字段已添加
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions' 
  AND table_schema = 'public'
  AND column_name IN ('subscription_id', 'creem_subscription_id')
ORDER BY column_name;

-- ============================================================
-- 完成！
-- ============================================================
-- 现在代码可以同时使用 subscription_id 和 creem_subscription_id
-- 动态检测函数 resolveSubscriptionIdColumn 会找到可用的字段
-- ============================================================

