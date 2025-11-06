# 积分系统问题检查报告

根据积分系统结构分析，发现以下问题：

## ⚠️ 发现的问题

### 1. 触发器初始化积分不完整（中等严重）

**位置**：`supabase_schema_fixed.sql` 第 264 行

**问题**：
```sql
INSERT INTO users (id, email, full_name, credits_balance, credits_total, credits_limit)
VALUES (
  NEW.id, 
  NEW.email,
  COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
  3,  -- credits_balance
  3,  -- credits_total
  50  -- credits_limit
)
```

**缺少**：`credits_spent` 字段没有设置

**影响**：
- 新用户注册时 `credits_spent` 可能是 `NULL` 而不是 `0`
- 虽然表定义有 `DEFAULT 0`，但显式插入时最好也设置

**修复**：
```sql
INSERT INTO users (id, email, full_name, credits_balance, credits_total, credits_spent, credits_limit)
VALUES (
  NEW.id, 
  NEW.email,
  COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
  3,  -- credits_balance
  3,  -- credits_total
  0,  -- credits_spent (新用户消费为 0)
  50  -- credits_limit
)
```

---

### 2. 函数版本冲突风险（需要确认）

**问题**：
- `credit-transactions-safe.sql` 中的函数返回 3 个字段：`{credits_balance, credits_total, credits_spent}`
- `split-credits-migration.sql` 中的函数返回 5 个字段：`{credits_balance, credits_total, credits_spent, subscription_credits_balance, flex_credits_balance}`

**当前状态**：
- 代码 `src/lib/credits.ts` 只使用前 3 个字段 ✅
- 如果执行了 `split-credits-migration.sql`，函数会被替换
- 但代码仍然可以工作（只使用前 3 个字段）

**建议**：
- 如果不需要区分订阅积分和灵活积分，使用 `credit-transactions-safe.sql`
- 如果需要区分，需要修改代码以支持 `subscription_credits_balance` 和 `flex_credits_balance`

**检查方法**：
```sql
-- 检查函数返回类型
SELECT 
  routine_name,
  pg_get_function_result(routine_name::regproc) as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'credit_user_credits_transaction';
```

---

### 3. 积分上限硬编码不一致（轻微）

**问题**：
- `credit-transactions-safe.sql` 中硬编码上限：`50000`
- `supabase_schema_fixed.sql` 中表定义：`credits_limit INTEGER DEFAULT 50`
- 触发器初始化：`credits_limit = 50`

**不一致**：
- 函数检查上限是 50000
- 表默认上限是 50
- 这两个值不一致

**建议**：
- 统一上限值，或从 `users.credits_limit` 字段读取
- 或者明确说明：函数上限是系统硬限制，表的 `credits_limit` 是用户个性化限制

---

### 4. credit_transactions 表 amount 字段语义不一致（轻微）

**问题**：
- `credit-transactions-safe.sql` 中注释：`amount` 正数=增加，负数=扣除
- 但实际插入时：
  - `credit_user_credits_transaction`: 插入 `+p_amount`（正数）✅
  - `debit_user_credits_transaction`: 插入 `+p_amount`（正数）❌ 应该是负数
  - `refund_user_credits`: 插入 `+p_amount`（正数）✅

**当前代码**：
```sql
-- credit_user_credits_transaction 中
INSERT INTO credit_transactions (..., amount, ...)
VALUES (..., p_amount, ...)  -- ✅ 正数，正确

-- debit_user_credits_transaction 中
INSERT INTO credit_transactions (..., amount, ...)
VALUES (..., p_amount, ...)  -- ❌ 应该是 -p_amount

-- refund_user_credits 中
INSERT INTO credit_transactions (..., amount, ...)
VALUES (..., p_amount, ...)  -- ✅ 正数，正确（因为是增加）
```

**影响**：
- 如果按注释理解，`debit` 的 `amount` 应该是负数
- 但当前代码是正数，需要看 `transaction_type` 来区分

**修复建议**：
保持一致性，要么：
- **方案 A**：所有 `amount` 都是正数，用 `transaction_type` 区分（当前方案）
- **方案 B**：`amount` 正数=增加，负数=扣除，修改 `debit_user_credits_transaction` 插入 `-p_amount`

**推荐**：方案 A（当前方案），因为更清晰，但需要修改注释。

---

### 5. 缺少积分校验函数（可选）

**问题**：
- 没有函数可以验证 `users.credits_balance` 是否正确
- 无法检查积分是否与 `credit_transactions` 记录一致

**建议**：
创建一个验证函数：
```sql
CREATE OR REPLACE FUNCTION verify_user_credits(p_user_id UUID)
RETURNS TABLE(
  calculated_balance INTEGER,
  stored_balance INTEGER,
  difference INTEGER,
  is_correct BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(amount), 0)::INTEGER as calculated_balance,
    u.credits_balance as stored_balance,
    (u.credits_balance - COALESCE(SUM(amount), 0))::INTEGER as difference,
    (u.credits_balance = COALESCE(SUM(amount), 0)) as is_correct
  FROM users u
  LEFT JOIN credit_transactions ct ON ct.user_id = u.id
  WHERE u.id = p_user_id
  GROUP BY u.id, u.credits_balance;
END;
$$ LANGUAGE plpgsql;
```

---

### 6. 并发安全检查（已实现 ✅）

**现状**：
- `debit_user_credits_transaction` 中使用了 `AND COALESCE(u.credits_balance, 0) >= p_amount` 在 WHERE 子句中
- 这提供了基本的并发保护 ✅

**建议**：
- 考虑使用 `SELECT ... FOR UPDATE` 锁定行（如果并发量很大）

---

## 📋 修复优先级

### 高优先级（必须修复）

1. **触发器初始化积分** - 添加 `credits_spent` 字段

### 中优先级（建议修复）

2. **amount 字段语义** - 统一注释或代码逻辑
3. **积分上限一致性** - 统一或明确说明

### 低优先级（可选）

4. **函数版本冲突** - 确认是否执行了 `split-credits-migration.sql`
5. **积分校验函数** - 用于调试和维护

---

## 🔧 修复 SQL

### 修复 1：触发器初始化积分

```sql
-- 修复 handle_new_user 触发器
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, full_name, credits_balance, credits_total, credits_spent, credits_limit)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    3,  -- 免费用户初始 3 个积分
    3,
    0,  -- 新用户消费为 0
    50  -- 默认积分上限
  )
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO user_subscriptions (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 修复 2：统一 amount 字段语义（可选）

如果选择方案 B（amount 正负表示增减）：

```sql
-- 修改 debit_user_credits_transaction 函数
-- 在 INSERT INTO credit_transactions 中
INSERT INTO credit_transactions (
  user_id,
  amount,
  transaction_type,
  reason,
  metadata
) VALUES (
  p_user_id,
  -p_amount,  -- 改为负数
  'debit',
  p_reason,
  COALESCE(p_metadata, '{}'::jsonb)
);
```

---

## ✅ 检查清单

运行以下 SQL 检查：

```sql
-- 1. 检查触发器是否设置了 credits_spent
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 2. 检查函数返回类型
SELECT 
  routine_name,
  pg_get_function_result(routine_name::regproc) as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'credit_user_credits_transaction',
    'debit_user_credits_transaction',
    'refund_user_credits'
  );

-- 3. 检查 credit_transactions 中的 amount 值
SELECT 
  transaction_type,
  COUNT(*) as count,
  MIN(amount) as min_amount,
  MAX(amount) as max_amount,
  AVG(amount) as avg_amount
FROM credit_transactions
GROUP BY transaction_type;
```

