# 修复 Google 登录 "Database error saving new user" 问题

## 问题描述

当用户通过 Google OAuth 登录时，Supabase 会触发 `handle_new_user()` 函数来创建用户记录。但是由于 RLS (Row Level Security) 策略缺少 INSERT 权限，导致触发器无法插入新用户记录，出现错误：

```
Database error saving new user
```

## 解决方案

在 Supabase Dashboard 的 SQL Editor 中执行 `database/fix-user-creation-trigger.sql` 脚本。

### 执行步骤

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 点击 **New Query**
5. 复制 `database/fix-user-creation-trigger.sql` 的内容
6. 粘贴到 SQL Editor
7. 点击 **Run** 执行

### 脚本做了什么

1. **更新触发器函数** `handle_new_user()`：
   - 确保函数正确处理用户创建
   - 使用 `SECURITY DEFINER` 以系统权限运行
   - 添加 `ON CONFLICT` 处理，避免重复插入错误

2. **重新创建触发器**：
   - 确保触发器正确附加到 `auth.users` 表

3. **添加 RLS INSERT 策略**：
   - 为 `users` 表添加允许触发器插入新用户的策略
   - 为 `user_subscriptions` 表添加允许触发器插入新订阅的策略

### 验证修复

执行脚本后，可以：

1. **检查策略是否创建成功**：
```sql
SELECT * FROM pg_policies WHERE tablename = 'users';
SELECT * FROM pg_policies WHERE tablename = 'user_subscriptions';
```

应该看到：
- `users` 表有 3 个策略：SELECT、UPDATE、INSERT
- `user_subscriptions` 表有相应的策略

2. **测试 Google 登录**：
   - 尝试使用 Google OAuth 登录
   - 应该不再出现数据库错误
   - 用户记录应该自动创建

### 如果问题仍然存在

如果执行脚本后问题仍然存在，可以：

1. **手动检查触发器**：
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

2. **检查函数定义**：
```sql
SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'handle_new_user';
```

3. **查看 Supabase 日志**：
   - 进入 Supabase Dashboard → Logs → Database Logs
   - 查看详细的错误信息

4. **使用 fix-missing API**：
   - 如果用户已经登录但记录缺失，可以调用 `/api/users/fix-missing` API
   - Callback 页面会自动调用这个 API 来修复缺失的记录

## 相关文件

- `database/fix-user-creation-trigger.sql` - 修复脚本
- `app/auth/callback/page.tsx` - 处理登录回调，自动修复缺失记录
- `app/api/users/fix-missing/route.ts` - 手动修复缺失用户记录的 API

