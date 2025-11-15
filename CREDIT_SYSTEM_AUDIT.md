# 积分系统全面检查报告

## 📊 检查结果摘要

### ✅ 正常的部分
1. **credit_user_credits_transaction** - 函数存在且正常工作
2. **debit_user_credits_transaction** - 函数存在，但需要修复列名歧义
3. **credit_transactions 表** - 表存在且结构正确
4. **函数返回类型** - 统一返回 3 个字段（credits_balance, credits_total, credits_spent）

### ❌ 发现的问题

#### 1. 列名歧义错误
- **debit_user_credits_transaction**: SELECT 语句中未使用表别名，导致 `column reference "credits_balance" is ambiguous`
- **refund_user_credits**: 同样存在列名歧义问题

#### 2. 数据库字段不一致
- `subscription_credits_balance` 和 `flex_credits_balance` 字段不存在
- 说明未执行 `split-credits-migration.sql`（这是可选的，如果不需要 split credits 功能）

#### 3. API 使用不一致
- 部分 API 直接调用 RPC 函数（如 `app/api/kie/generate/route.ts`）
- 部分 API 使用 `src/lib/credits.ts` 中的封装函数（如 `app/api/videos/generate/route.ts`）
- **建议**: 统一使用 `src/lib/credits.ts` 中的函数，便于维护和错误处理

## 🔧 修复方案

### 立即修复（必需）

1. **执行修复 SQL**
   ```sql
   -- 在 Supabase Dashboard > SQL Editor 中执行
   -- database/fix-all-credit-functions.sql
   ```
   这将修复：
   - `debit_user_credits_transaction` 的列名歧义
   - `refund_user_credits` 的列名歧义

### 可选优化

2. **统一 API 使用方式**
   - 将所有直接调用 RPC 的 API 改为使用 `src/lib/credits.ts` 中的函数
   - 好处：统一的错误处理、更好的日志记录、更容易测试

3. **如果需要 Split Credits 功能**
   - 执行 `database/split-credits-migration.sql`
   - 更新相关代码以支持 subscription_credits_balance 和 flex_credits_balance

## 📁 相关文件

### 数据库函数定义
- `database/credit-transactions-safe.sql` - 基础函数（有列名歧义问题）
- `database/fix-all-credit-functions.sql` - **修复版本（推荐使用）**
- `database/fix-debit-function.sql` - 只修复 debit 函数
- `database/split-credits-migration.sql` - Split credits 功能（可选）

### 代码文件
- `src/lib/credits.ts` - 积分系统封装函数（推荐使用）
- `app/api/kie/generate/route.ts` - 直接调用 RPC（需要统一）
- `app/api/videos/generate/route.ts` - 使用 credits.ts（正确方式）
- `app/api/storyboard/generate/route.ts` - 直接调用 RPC（需要统一）

## 🎯 修复步骤

1. **立即执行**（修复当前错误）:
   ```bash
   # 在 Supabase Dashboard > SQL Editor 中执行
   database/fix-all-credit-functions.sql
   ```

2. **验证修复**:
   ```bash
   npx tsx scripts/check-credit-system.ts
   ```

3. **测试生成视频**:
   - 尝试生成一个视频
   - 应该不再出现 "Credit system error"

4. **后续优化**（可选）:
   - 统一 API 使用 `src/lib/credits.ts` 中的函数
   - 添加更多错误处理和日志

## 📝 函数签名

### debit_user_credits_transaction
```sql
RETURNS TABLE(
  credits_balance INTEGER,
  credits_total INTEGER,
  credits_spent INTEGER
)
```

### credit_user_credits_transaction
```sql
RETURNS TABLE(
  credits_balance INTEGER,
  credits_total INTEGER,
  credits_spent INTEGER
)
```

### refund_user_credits
```sql
RETURNS TABLE(
  credits_balance INTEGER,
  credits_total INTEGER,
  credits_spent INTEGER
)
```

## ⚠️ 注意事项

1. **函数返回类型**: 所有函数统一返回 3 个字段，与 `src/lib/credits.ts` 中的 `CreditSnapshot` 接口匹配

2. **错误代码**:
   - `P0003`: 积分数量无效（必须 > 0）
   - `P0005`: 用户不存在
   - `P0007`: 更新失败
   - `P0008`: 余额不足

3. **事务安全**: 所有函数都使用 `SECURITY DEFINER` 和 `SET search_path = public`，确保安全执行

4. **列名歧义**: 所有 SELECT 和 UPDATE 语句都使用表别名 `u` 来避免歧义

## ✅ 检查清单

- [x] 检查函数是否存在
- [x] 检查函数返回类型
- [x] 检查列名歧义问题
- [x] 检查 credit_transactions 表
- [x] 检查 users 表字段
- [x] 检查代码一致性
- [ ] 执行修复 SQL（需要手动执行）
- [ ] 验证修复结果
- [ ] 统一 API 使用方式（可选）

