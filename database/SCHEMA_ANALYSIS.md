# 数据库 Schema 分析报告

## ⚠️ 发现的问题

### 1. **表名不一致**

| Schema 中定义 | 代码中实际使用 | 状态 |
|--------------|--------------|------|
| `video_generations` | `video_jobs` | ❌ 不匹配 |
| `payment_records` | `payments` | ❌ 不匹配 |
| `user_subscriptions` | `user_subscriptions` | ✅ 匹配 |
| `api_keys` | `api_keys` | ✅ 匹配（但代码中未使用） |
| `usage_stats` | `usage_stats` | ✅ 匹配 |

### 2. **缺失的表**

代码中使用了但 Schema 中没有定义的表：
- ❌ `users` - **关键表缺失**，代码多处使用
- ❌ `credit_transactions` - **关键表缺失**，用于追踪积分交易历史

### 3. **数据冗余问题**

`user_subscriptions` 表中存储了 `email` 和 `full_name`，但这些信息应该从 `auth.users` 获取，避免数据冗余和不一致。

### 4. **表结构问题**

#### `users` 表（缺失但代码中大量使用）
代码期望的字段：
- `id` (UUID, 关联 auth.users)
- `email`
- `full_name`
- `subscription_plan`
- `subscription_status`
- `subscription_end_date`
- `credits_balance` ⭐ **关键字段**
- `credits_total` ⭐ **关键字段**
- `credits_spent` ⭐ **关键字段**
- `created_at`
- `updated_at`

#### `video_jobs` vs `video_generations`
代码期望的字段（`video_jobs`）：
- `id`
- `user_id`
- `job_id` (UNIQUE)
- `status`
- `prompt`
- `image_url`
- `aspect_ratio`
- `quality`
- `duration`
- `result_url`
- `preview_url`
- `error_message`
- `cost_credits`
- `created_at`
- `updated_at`

Schema 中定义的字段（`video_generations`）：
- `generation_id` ❌ 应该是 `job_id`
- 缺少 `image_url`, `quality`, `preview_url` 等字段
- 字段类型不匹配

#### `credit_transactions` 表（缺失）
需要用于：
- 追踪积分增减历史
- 审计和调试
- 退款处理

应该包含的字段：
- `id`
- `user_id`
- `amount` (正数为增加，负数为扣除)
- `transaction_type` (credit/debit/refund)
- `reason` (purchase/subscription/refund/manual)
- `metadata` (JSONB)
- `created_at`

## 📋 修复建议

### 方案 1：统一使用代码中的表名（推荐）

1. **创建 `users` 表**（关联 auth.users）
2. **创建 `video_jobs` 表**（替换 video_generations）
3. **创建 `credit_transactions` 表**
4. **重命名或创建 `payments` 表**（替换 payment_records）
5. **保留 `user_subscriptions`** 但移除冗余字段（email, full_name）
6. **添加表之间的正确关联**

### 方案 2：修改代码以匹配 Schema（不推荐）

需要大量修改代码，风险高。

## 🎯 推荐的完整表结构

### 核心表

1. **users** - 用户基础信息和积分
2. **user_subscriptions** - 订阅信息（关联 users）
3. **video_jobs** - 视频生成任务
4. **credit_transactions** - 积分交易历史
5. **payments** - 支付记录
6. **api_keys** - API 密钥
7. **usage_stats** - 使用统计
8. **system_config** - 系统配置

### 表关系

```
auth.users (Supabase Auth)
    ↓
users (扩展信息 + 积分)
    ↓
user_subscriptions (订阅)
    ↓
payments (支付记录)
    ↓
credit_transactions (积分交易)
    ↓
video_jobs (生成任务)
```

## ⚠️ 关键问题总结

1. **`users` 表缺失** - 代码大量使用，必须创建
2. **`credit_transactions` 表缺失** - 积分系统需要审计追踪
3. **表名不一致** - 会导致查询失败
4. **数据冗余** - user_subscriptions 中不应存储 email/full_name
5. **字段不匹配** - video_generations 的字段与代码期望不符

## 🔧 下一步

需要我创建一个修正后的完整 schema 文件吗？


