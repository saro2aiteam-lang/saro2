# Supabase 配置指南

本文档将指导你如何配置 Supabase 来支持登录和数据库功能。

## 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并登录
2. 点击 "New Project" 创建新项目
3. 填写项目信息：
   - **Name**: 你的项目名称
   - **Database Password**: 设置一个强密码（保存好，以后无法查看）
   - **Region**: 选择离你最近的区域
4. 等待项目创建完成（通常需要 2-3 分钟）

## 2. 获取 Supabase 配置信息

项目创建完成后，进入 **Settings** → **API**，你需要以下信息：

- **Project URL**: 例如 `https://xxxxx.supabase.co`
- **anon/public key**: 这是一个公开的 API 密钥，用于客户端
- **service_role key**: 这是一个私密密钥，**永远不要暴露到客户端**，仅用于服务端

## 3. 配置环境变量

在项目根目录创建 `.env.local` 文件（如果还没有）：

```bash
cp env.example .env.local
```

然后编辑 `.env.local`，填入你的 Supabase 配置：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_anon_key
SUPABASE_SERVICE_ROLE_KEY=你的_service_role_key
```

⚠️ **重要**：
- `NEXT_PUBLIC_*` 开头的变量会被暴露到客户端，只填入公开安全的密钥
- `SUPABASE_SERVICE_ROLE_KEY` 是私密密钥，**永远不要提交到 Git**

## 4. 设置数据库 Schema

### 方法 1: 使用 SQL Editor（推荐）

1. 在 Supabase Dashboard 中，进入 **SQL Editor**
2. 点击 **New Query**
3. 复制 `database/supabase_schema.sql` 文件的内容
4. 粘贴到 SQL Editor 中
5. 点击 **Run** 执行

### 方法 2: 使用 Migration Tool

如果你熟悉 Supabase CLI，可以使用 migration 工具：

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 链接到你的项目
supabase link --project-ref your-project-ref

# 应用 migration
supabase db push
```

## 5. 配置 Supabase Auth

### 5.1 设置认证提供者

1. 进入 **Authentication** → **Providers**
2. 启用你需要的认证方式：
   - **Email**: 默认启用，用于邮箱密码登录和 Magic Link
   - **Google**: 如果需要 Google OAuth，需要配置 Google OAuth 凭据

### 5.2 配置 Google OAuth（可选）

如果需要 Google 登录：

1. 在 **Authentication** → **Providers** 中启用 Google
2. 在 Google Cloud Console 创建 OAuth 2.0 凭据：
   - 访问 [Google Cloud Console](https://console.cloud.google.com/)
   - 创建新项目或选择现有项目
   - 进入 **APIs & Services** → **Credentials**
   - 点击 **Create Credentials** → **OAuth client ID**
   - 选择 **Web application**
   - 添加授权重定向 URI: `https://xxxxx.supabase.co/auth/v1/callback`
3. 在 Supabase Dashboard 中填入：
   - **Client ID (for OAuth)**
   - **Client Secret (for OAuth)**
4. 在 `.env.local` 中添加：
   ```env
   GOOGLE_CLIENT_ID=你的_google_client_id
   GOOGLE_CLIENT_SECRET=你的_google_client_secret
   ```

### 5.3 配置邮件模板（可选）

1. 进入 **Authentication** → **Email Templates**
2. 可以自定义确认邮件和密码重置邮件的模板
3. 在 **Settings** → **Auth** 中配置：
   - **Site URL**: 你的应用 URL（例如 `http://localhost:3000` 或 `https://yourdomain.com`）
   - **Redirect URLs**: 添加你的回调 URL（例如 `http://localhost:3000/auth/callback`）

## 6. 配置 Row Level Security (RLS)

数据库 schema 已经包含了 RLS 策略，确保：

1. 进入 **Authentication** → **Policies**
2. 确认所有表都启用了 RLS
3. 检查策略是否正确：
   - 用户只能查看和修改自己的数据
   - 系统配置表对所有用户可读

## 7. 测试配置

### 7.1 测试连接

启动开发服务器：

```bash
npm run dev
```

访问登录页面，尝试：
- 邮箱注册
- 邮箱登录
- Google 登录（如果已配置）

### 7.2 检查数据库连接

在 Supabase Dashboard 中：
1. 进入 **Table Editor**
2. 查看 `user_subscriptions` 表
3. 注册新用户后，应该能看到新记录自动创建

### 7.3 检查日志

如果遇到问题，查看：
- **Supabase Dashboard** → **Logs** → **Postgres Logs**（数据库错误）
- **Supabase Dashboard** → **Logs** → **Auth Logs**（认证错误）
- 浏览器控制台（客户端错误）
- 终端输出（服务端错误）

## 8. 常见问题

### Q: 注册后没有收到确认邮件？

**A**: 检查以下设置：
1. Supabase Dashboard → **Authentication** → **Settings** → **SMTP Settings**
2. 默认使用 Supabase 的邮件服务，但有限制
3. 生产环境建议配置自定义 SMTP（如 SendGrid、Mailgun）

### Q: 数据库查询失败，提示权限错误？

**A**: 检查：
1. RLS 策略是否正确配置
2. 用户是否已登录（检查 `auth.users` 表）
3. 是否正确使用了服务端客户端（`getSupabaseAdmin()`）进行管理操作

### Q: 服务端 API 路由无法获取用户？

**A**: 确保：
1. 使用 `createServerClient` 从 `@supabase/ssr` 创建客户端
2. 正确传递 cookies
3. 中间件已正确配置（检查 `middleware.ts`）

### Q: Google OAuth 重定向失败？

**A**: 检查：
1. Google OAuth 重定向 URI 必须完全匹配：`https://xxxxx.supabase.co/auth/v1/callback`
2. 在应用的 `.env.local` 中配置了正确的 `NEXT_PUBLIC_APP_URL`
3. 在 Supabase Auth Settings 中添加了应用的回调 URL

## 9. 生产环境配置

### 9.1 环境变量

在 Vercel（或其他平台）中设置环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_CLIENT_ID`（如果使用）
- `GOOGLE_CLIENT_SECRET`（如果使用）

### 9.2 配置自定义域名（可选）

1. 在 Supabase Dashboard → **Settings** → **API** 中配置自定义域名
2. 更新环境变量中的 `NEXT_PUBLIC_SUPABASE_URL`

### 9.3 配置 Rate Limiting

Supabase 有默认的 rate limiting，如果需要在应用层添加：
- 检查 `src/lib/rate-limiter.ts`
- 配置适合你的限制策略

## 10. 数据库维护

### 备份

Supabase 自动备份数据库，但你也可以手动备份：
1. 进入 **Database** → **Backups**
2. 可以下载 SQL 转储

### 监控

1. 进入 **Database** → **Reports** 查看性能指标
2. 进入 **Logs** 查看查询日志和错误

## 完成！

现在你的 Supabase 已经配置完成，可以支持：
- ✅ 用户注册和登录（邮箱密码）
- ✅ Google OAuth 登录（如果已配置）
- ✅ Magic Link 登录
- ✅ 用户数据存储
- ✅ 视频生成历史记录
- ✅ 订阅和积分管理
- ✅ API 密钥管理

如果遇到问题，请查看：
- [Supabase 官方文档](https://supabase.com/docs)
- [Next.js + Supabase 集成指南](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

