# 查看 Vercel 日志中的具体错误

根据你的 Vercel 日志截图，`/api/checkout` 返回 500 错误，并且显示 "No outgoing requests"。

## 🔍 查看具体错误消息

在 Vercel Dashboard 中：

1. **点击那个红色的 `POST 500 /api/checkout` 日志条目**
2. **在右侧面板中，展开 "Logs" 部分**
3. **查找包含以下关键词的日志**：
   - `[API ERROR]`
   - `[Creem]`
   - `Security check failed`
   - `API key not configured`
   - `productId not configured`

## 🎯 最可能的原因

根据 "No outgoing requests"，错误发生在调用 Creem API 之前。最可能是：

### 情况 1: CREEM_API_KEY 未配置
**错误消息会包含**: `Creem API key not configured` 或 `Payment service not configured`

**解决方案**:
1. Vercel Dashboard → Settings → Environment Variables
2. 确保 Production 环境有 `CREEM_API_KEY`
3. 值应该是生产密钥：`creem_live_...` 或 `pk_live_...`

### 情况 2: 使用了测试密钥
**错误消息会包含**: `安全错误：生产环境不应使用测试密钥` 或 `Security check failed`

**解决方案**:
1. 从 Creem Dashboard 获取生产密钥
2. 在 Vercel 中更新 `CREEM_API_KEY` 为生产密钥
3. 确保不是 `creem_test_...` 或 `pk_test_...`

### 情况 3: Product ID 未配置
**错误消息会包含**: `Plan productId not configured`

**解决方案**:
1. 检查 Vercel 环境变量中是否缺少对应的 `NEXT_PUBLIC_CREEM_PLAN_*_ID`
2. 从 Creem Dashboard → Products 获取产品 ID
3. 添加到 Vercel 环境变量

## 📋 快速检查清单

在 Vercel Dashboard → Settings → Environment Variables 中确认：

- [ ] **Production 环境**已选择
- [ ] `CREEM_API_KEY` 已配置
- [ ] `CREEM_API_KEY` 是生产密钥（`creem_live_...` 或 `pk_live_...`）
- [ ] 所有 9 个 Product ID 都已配置：
  - `NEXT_PUBLIC_CREEM_PLAN_BASIC_MONTHLY_ID`
  - `NEXT_PUBLIC_CREEM_PLAN_BASIC_YEARLY_ID`
  - `NEXT_PUBLIC_CREEM_PLAN_CREATOR_MONTHLY_ID`
  - `NEXT_PUBLIC_CREEM_PLAN_CREATOR_YEARLY_ID`
  - `NEXT_PUBLIC_CREEM_PLAN_PRO_MONTHLY_ID`
  - `NEXT_PUBLIC_CREEM_PLAN_PRO_YEARLY_ID`
  - `NEXT_PUBLIC_CREEM_PACK_STARTER_ID`
  - `NEXT_PUBLIC_CREEM_PACK_CREATOR_ID`
  - `NEXT_PUBLIC_CREEM_PACK_DEV_ID`

## 🚀 修复步骤

1. **查看日志中的具体错误消息**（在 Vercel Dashboard 中点击日志条目，查看 Logs 部分）
2. **根据错误消息修复配置**
3. **重新部署应用**
4. **测试购买流程**

## 💡 提示

如果日志中没有显示具体的错误消息，可以：
1. 在生产环境访问 `https://saro2.ai/plans?debug=1`
2. 点击购买按钮
3. 打开浏览器控制台（F12）
4. 查看 `[Checkout Error]` 日志，会显示详细的错误信息

