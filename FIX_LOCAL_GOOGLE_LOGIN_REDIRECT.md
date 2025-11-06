# 修复本地 Google 登录跳转到生产环境的问题

## 问题描述

在本地开发环境（`http://localhost:3000`）使用 Google 登录时，登录成功后跳转到了生产环境 `https://saro2.ai/?code=...`，而不是本地的 callback URL。

## 问题原因

Supabase 的 OAuth 流程会验证 `redirectTo` URL 是否在允许的列表中。如果 Supabase Dashboard 中没有配置本地开发 URL，Supabase 会忽略 `redirectTo` 参数，使用默认的 Site URL（通常是生产环境）。

## 解决方案

### 1. 配置 Supabase Dashboard

在 Supabase Dashboard 中添加本地开发 URL 到允许的重定向列表：

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Authentication** → **URL Configuration**
4. 在 **Redirect URLs** 中添加：
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/**
   ```
5. 在 **Site URL** 中：
   - 开发环境：可以设置为 `http://localhost:3000`
   - 或者保持生产环境 URL，但确保 Redirect URLs 包含本地 URL

### 2. 验证代码配置

代码已经正确配置，在开发环境会使用 `window.location.origin`（即 `http://localhost:3000`）。

检查浏览器控制台日志，应该看到：
```
🔐 Google OAuth Configuration: {
  isProduction: false,
  baseUrl: "http://localhost:3000",
  redirectUrl: "http://localhost:3000/auth/callback",
  ...
}
```

### 3. 如果问题仍然存在

如果配置后问题仍然存在，检查：

1. **Supabase Dashboard 配置**：
   - 确保 Redirect URLs 包含 `http://localhost:3000/auth/callback`
   - 确保没有通配符限制

2. **环境变量**：
   - 确保 `.env.local` 中没有设置 `NEXT_PUBLIC_APP_URL`（或设置为 `http://localhost:3000`）
   - 确保 `NODE_ENV=development`

3. **清除浏览器缓存**：
   - 清除浏览器缓存和 cookies
   - 或者使用无痕模式测试

4. **检查 Supabase 日志**：
   - 在 Supabase Dashboard → Logs → Auth Logs 中查看详细日志
   - 查看是否有重定向 URL 验证失败的错误

### 4. 临时解决方案

如果暂时无法修改 Supabase Dashboard 配置，可以：

1. **使用 ngrok 等工具**：
   - 使用 ngrok 将本地端口暴露为公网 URL
   - 在 Supabase Dashboard 中添加 ngrok URL
   - 在代码中使用 ngrok URL 作为 redirectTo

2. **手动修改 redirectTo**：
   - 临时在代码中硬编码本地 URL（不推荐，仅用于测试）

## 验证修复

配置完成后：

1. 清除浏览器缓存
2. 访问 `http://localhost:3000`
3. 点击 Google 登录
4. 登录成功后应该跳转到 `http://localhost:3000/auth/callback`
5. 然后自动重定向到应用内页面（如 `/text-to-video`）

## 相关文件

- `src/contexts/AuthContext.tsx` - Google 登录逻辑
- `app/auth/callback/page.tsx` - 登录回调处理
- `src/lib/auth-utils.ts` - URL 工具函数

