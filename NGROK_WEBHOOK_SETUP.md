# 使用 ngrok 设置本地 Webhook URL

## 快速开始

### 1. 安装 ngrok

```bash
# macOS (使用 Homebrew)
brew install ngrok

# 或使用 npm
npm install -g ngrok

# 或直接下载
# 访问 https://ngrok.com/download 下载对应平台的安装包
```

### 2. 注册 ngrok 账户（可选但推荐）

免费账户可以：
- 使用固定域名（需要注册）
- 查看请求日志
- 更多功能

```bash
# 注册后获取 authtoken
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### 3. 启动本地开发服务器

```bash
# 在项目根目录
npm run dev
# 或
yarn dev
# 或
pnpm dev

# 确保服务器运行在 http://localhost:3000
```

### 4. 启动 ngrok（新终端窗口）

```bash
# 暴露本地 3000 端口
ngrok http 3000
```

### 5. 获取 Webhook URL

ngrok 启动后会显示类似输出：

```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

你的 Webhook URL 就是：
```
https://abc123.ngrok-free.app/api/webhooks/creem
```

### 6. 配置到 Creem Dashboard

1. 登录 [Creem Dashboard](https://creem.io)
2. 进入 **Settings → Webhooks**
3. 在 **Webhook URL** 字段填入：
   ```
   https://你的ngrok域名.ngrok-free.app/api/webhooks/creem
   ```
4. 选择要接收的事件类型：
   - ✅ `checkout.completed`
   - ✅ `subscription.active`
   - ✅ `subscription.paid`
   - ✅ `subscription.update`
   - ✅ `subscription.canceled`
   - ✅ `subscription.expired`
   - ✅ `subscription.trialing`
   - ✅ `subscription.paused`
   - ✅ `refund.created`
   - ✅ `dispute.created`
5. 点击 **Save** 保存

### 7. 测试 Webhook

在 Creem Dashboard 中：
1. 点击 **Send Test Webhook** 按钮
2. 选择事件类型（如 `checkout.completed`）
3. 检查你的本地服务器日志，应该能看到 webhook 请求

## 使用固定域名（推荐）

免费账户可以使用固定域名，避免每次重启 ngrok 都要更新 URL：

```bash
# 启动时指定固定域名（需要先注册 ngrok 账户）
ngrok http 3000 --domain=your-fixed-domain.ngrok-free.app
```

## 查看 Webhook 请求

### 方法 1：ngrok Web Interface

启动 ngrok 后，访问：
```
http://localhost:4040
```

这里可以看到：
- 所有 HTTP 请求
- 请求和响应详情
- 重放请求功能

### 方法 2：本地服务器日志

查看你的 Next.js 开发服务器输出，应该能看到：
```
[WEBHOOK] Starting webhook processing...
[WEBHOOK] Event type: checkout.completed
[WEBHOOK] Signature verified successfully
```

## 常见问题

### Q: ngrok URL 每次启动都变化？

A: 使用固定域名功能（需要注册 ngrok 账户）：
```bash
ngrok http 3000 --domain=your-fixed-domain.ngrok-free.app
```

### Q: ngrok 连接被拒绝？

A: 确保：
1. 本地服务器正在运行（`npm run dev`）
2. 服务器运行在正确的端口（默认 3000）
3. 防火墙没有阻止连接

### Q: Webhook 签名验证失败？

A: 检查：
1. `CREEM_WEBHOOK_SECRET` 环境变量是否正确设置
2. ngrok 是否使用了 HTTPS（必须）
3. 签名头名称是否正确（`creem-signature`）

### Q: 如何同时运行多个服务？

A: 使用不同的端口：
```bash
# 终端 1: Next.js (端口 3000)
npm run dev

# 终端 2: ngrok for Next.js
ngrok http 3000

# 终端 3: 其他服务 (端口 3001)
# ngrok http 3001 --domain=other-service.ngrok-free.app
```

## 完整示例脚本

创建一个 `scripts/start-ngrok.sh` 文件：

```bash
#!/bin/bash

# 检查 ngrok 是否安装
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok 未安装"
    echo "安装方法: brew install ngrok 或 npm install -g ngrok"
    exit 1
fi

# 检查本地服务器是否运行
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "⚠️  警告: 本地服务器未运行在 http://localhost:3000"
    echo "请先运行: npm run dev"
    read -p "是否继续? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "🚀 启动 ngrok..."
echo "📋 Webhook URL 格式: https://[你的域名].ngrok-free.app/api/webhooks/creem"
echo ""

# 启动 ngrok
ngrok http 3000
```

使用：
```bash
chmod +x scripts/start-ngrok.sh
./scripts/start-ngrok.sh
```

## 注意事项

1. **免费账户限制**：
   - 每次启动 URL 会变化（除非使用固定域名）
   - 有连接数限制
   - 适合开发测试

2. **生产环境**：
   - 不要在生产环境使用 ngrok
   - 使用固定的域名和 HTTPS

3. **安全性**：
   - ngrok URL 是公开的，任何人都可以访问
   - 确保 webhook 签名验证正常工作
   - 不要在 ngrok URL 中暴露敏感信息

4. **测试模式**：
   - 确保使用 Creem 测试模式的 Webhook Secret
   - 测试模式不会产生真实扣款

