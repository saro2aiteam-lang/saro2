# Sora2openai Setup Guide

## 概述

这是一个完整的 Sora2openai AI 视频生成平台前端应用，基于 Next.js + React + TypeScript 构建。

## 技术栈（当前）

- **框架**: Next.js 15（App Router）+ React 19 + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **主题**: next-themes（明/暗）
- **状态管理**: React Context + TanStack Query
- **用户认证**: Supabase（后端 API，由你将通过 kie.ai 网关调用）
- **后端即服务**: Supabase（Auth + Postgres + 存储）
- **支付**: Creem Billing（预集成）
- **样式**: Tailwind CSS + CSS Variables
- **构建工具**: Next.js 内置 + ESLint

## 环境配置（Next.js）

### 1. 复制环境变量文件

建议使用 Next.js 约定的本地开发环境文件：`.env.local`

### 2. 配置环境变量

示例环境变量：

```env
# kie.ai API 配置（仅服务器）
KIE_API_BASE_URL=https://api.kie.ai
KIE_API_KEY=your_kie_api_key
NEXT_PUBLIC_API_ENV=production

# Supabase（前端可见）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Creem 支付（如需）
NEXT_PUBLIC_CREEM_PUBLISHABLE_KEY=pk_live_your_creem_publishable_key_here
```

### 3. 安装依赖

```bash
npm install
```

### 4. 启动开发服务器（Next.js）

```bash
npm run dev
```

## 项目结构（当前）

```
app/
├── layout.tsx            # 根布局与全站 metadata
├── page.tsx              # 首页（SSR + 结构化数据）
├── providers.tsx         # 客户端 Providers（Query/Theme/Auth/Credits）
├── generate/page.tsx     # 生成页（CSR）
├── pricing/page.tsx      # 定价页（SSG/SSR）
├── blog/page.tsx         # 博客页（SSR）
├── account/page.tsx      # 账户中心（CSR）
└── auth/callback/page.tsx# 认证回调（CSR）

src/
├── components/           # UI 与业务组件
│   ├── home/             # 首页分区组件
│   ├── generate/         # 生成页组件
│   └── ui/               # shadcn/ui 基础组件
├── contexts/             # Auth/Credits 上下文
├── services/             # api.ts / jobsApi.ts
├── lib/                  # supabase.ts / utils.ts
├── hooks/                # 自定义 hooks
└── types/                # TS 类型
```

## 核心功能

### 1. 用户认证（Supabase）
- 基于 Supabase Auth（邮箱/密码/社交登录可选）
- 会话/JWT 管理由 Supabase SDK 负责
- 你将通过 kie.ai 网关调用 Supabase API（后端代理/安全网关）
- 前端上下文：`src/contexts/AuthContext.tsx`

### 2. Credits 系统
- 订阅计划管理
- 按用量付费模式
- 实时 Credits 余额显示
- 使用历史记录

### 3. 视频生成
- Sora2（含 Fast/Standard）模型支持
- 实时生成进度显示
- 参数配置 (时长/分辨率/模型)
- Credits 消耗计算

### 4. 支付集成 (Creem)
- 订阅计划支付
- 一次性 Credits 购买
- 支付流程管理
- 订阅状态同步

### 5. SEO 优化
- 针对目标关键词优化
- 结构化数据
- 博客系统
- 长尾关键词覆盖

## API 集成（前端）

### 开发环境

默认使用 Mock API，模拟后端响应：

```typescript
// 在 src/services/api.ts
export const api = process.env.NEXT_PUBLIC_API_ENV === 'development' ? mocksora2api : sora2Api;
```

### 生产环境

配置实际 API 端点：

```env
NEXT_PUBLIC_API_ENV=production
KIE_API_BASE_URL=https://api.kie.ai
KIE_API_KEY=your_kie_api_key
```


## Creem 支付配置

1. 在 Creem Dashboard 创建账户
2. 配置产品和订阅计划
3. 设置 Webhook 端点
4. 复制 API 密钥到环境变量

## 部署

### 构建（Next.js）

```bash
npm run build
```

### 部署到 Vercel

1. 连接 GitHub 仓库
2. 配置环境变量（NEXT_PUBLIC_*）
3. 构建命令: `npm run build`
4. 输出：Next.js（无需 `dist`）

## Credits 消耗规则

```typescript
// 基础消耗规则
let base = 1; // 6秒 720p Sora2 Fast

// 时长倍数
if (duration === 8) base = 1.3;
if (duration === 10) base = 1.6;

// 分辨率加成
if (resolution === '1080p') base += 0.5;

// 模型加成
if (model === 'sora2-standard') base += duration * 0.5;
```

## 定价策略

### 订阅计划
- **Creator Plan**: $39/月, 80 Credits ($0.49/credit)
- **Studio Plan**: $99/月, 250 Credits ($0.40/credit) 
- **Enterprise**: $299+/月, 800+ Credits ($0.37/credit)

### 一次性购买 (劝退定价)
- **Starter Pack**: $29, 10 Credits ($2.90/credit)
- **Creator Pack**: $69, 25 Credits ($2.76/credit)
- **Dev Team**: $149, 60 Credits ($2.48/credit)

## 开发注意事项

1. **环境变量**: 确保所有必需的环境变量都已配置
2. **API 密钥**: 不要将生产环境密钥提交到代码仓库
3. **类型安全**: 使用 TypeScript 严格模式
4. **状态管理**: 通过 Context 管理用户状态和 Credits
5. **错误处理**: 实现完整的 API 错误处理逻辑

## 后续开发

1. **实际 API 集成**: 替换 Mock API 为真实后端
2. **Webhook 处理**: 实现支付和订阅状态同步
3. **推送通知**: 视频生成完成通知
4. **分析统计**: 用户行为分析
5. **A/B 测试**: 定价策略优化

## 支持

如有问题，请查看：
- API 文档（待补充）
- 博客文章: `/blog`
- GitHub Issues
