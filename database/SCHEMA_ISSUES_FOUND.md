# 数据库 Schema 检查结果

## ✅ 已修复的问题（Fixed Schema 已解决）

1. ✅ `users` 表 - 正确关联 `auth.users`，包含所有积分字段
2. ✅ `credit_transactions` 表 - 已创建
3. ✅ `video_jobs` 表 - 字段完整（包含 `params`, `model`, `credit_cost`）
4. ✅ `payments` 表 - 字段完整（包含 `payment_id`, `product_type`, `credits_purchased`）
5. ✅ RLS 策略 - 所有表都已启用
6. ✅ 索引 - 关键字段都有索引
7. ✅ 触发器 - 自动更新 `updated_at` 和创建新用户记录

## ⚠️ 发现的问题

### 1. `user_subscriptions` 表字段名不一致（中等严重）

**问题**：
- Fixed schema 中只有 `subscription_id` 字段
- 代码中 `webhooks/creem/route.ts:375` 使用 `creem_subscription_id` 插入
- 代码中 `subscriptions/create/route.ts:98` 使用 `subscription_id` 插入
- 代码中有动态检测函数 `resolveSubscriptionIdColumn` 会尝试两个字段名

**影响**：
- 如果使用 `creem_subscription_id` 插入会失败（字段不存在）
- 查询时可能找不到记录

**解决方案**：
有两个选择：

**方案 A：添加 `creem_subscription_id` 字段（推荐）**
```sql
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS creem_subscription_id VARCHAR(255);
```

**方案 B：统一使用 `subscription_id`**
修改代码 `webhooks/creem/route.ts:375`，将 `creem_subscription_id` 改为 `subscription_id`

### 2. 积分函数可能未创建（需要确认）

**检查**：
- `credit_user_credits_transaction` 
- `debit_user_credits_transaction`
- `refund_user_credits`

**解决方案**：
如果未创建，需要执行 `database/credit-transactions-safe.sql`

### 3. `user_subscriptions` 表缺少 `plan_id` 字段（可选）

**说明**：
- 代码中 webhook 处理时使用了 `plan_id`（来自 Creem）
- 但 fixed schema 中没有这个字段
- 当前代码将 `plan_id` 转换为 `plan_type` 存储

**影响**：
- 如果未来需要保存原始 `plan_id`，需要添加字段
- 当前功能不受影响

## 📋 验证步骤

1. **运行验证脚本**：
   ```sql
   -- 在 Supabase SQL Editor 中执行
   -- database/verify-schema.sql
   ```

2. **检查字段名问题**：
   ```sql
   -- 检查 user_subscriptions 表的字段
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'user_subscriptions' 
   AND column_name IN ('subscription_id', 'creem_subscription_id');
   ```

3. **检查积分函数**：
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name IN (
     'credit_user_credits_transaction',
     'debit_user_credits_transaction', 
     'refund_user_credits'
   );
   ```

## 🎯 建议的修复顺序

1. **立即修复**：添加 `creem_subscription_id` 字段或统一字段名
2. **确认**：积分函数是否已创建
3. **可选**：考虑是否添加 `plan_id` 字段

## 📝 修复 SQL

如果需要添加 `creem_subscription_id` 字段：

```sql
-- 添加 creem_subscription_id 字段（如果不存在）
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS creem_subscription_id VARCHAR(255);

-- 将现有的 subscription_id 数据复制到 creem_subscription_id（如果为空）
UPDATE user_subscriptions 
SET creem_subscription_id = subscription_id 
WHERE creem_subscription_id IS NULL AND subscription_id IS NOT NULL;

-- 添加索引（可选）
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_creem_subscription_id 
ON user_subscriptions(creem_subscription_id);
```

