# 支付链接创建失败 - 故障排除指南

## 🔍 快速诊断

如果看到 "Failed to create payment link" 错误，按以下步骤排查：

### 步骤 1: 查看详细错误信息

在生产环境访问购买页面时，在 URL 后添加 `?debug=1` 参数：
```
https://your-domain.com/plans?debug=1
```

然后点击购买，查看浏览器控制台的错误响应，会包含详细的调试信息。

### 步骤 2: 检查 Vercel 函数日志

1. 登录 Vercel Dashboard
2. 进入项目 → Functions → 查看 `/api/checkout` 的日志
3. 查找包含 `[API] Creem checkout failed` 或 `[Creem]` 的日志条目

### 步骤 3: 验证环境变量配置

在 Vercel Dashboard → Settings → Environment Variables 中检查：

#### 必需的环境变量

**生产环境必须配置：**

1. `CREEM_API_KEY`
   - ✅ 格式：`creem_live_xxxxx` 或 `pk_live_xxxxx`
   - ❌ 不能是：`creem_test_xxxxx` 或 `pk_test_xxxxx`
   - 从 Creem Dashboard → Settings → API Keys 获取

2. 所有产品 ID（必须全部配置）：
   ```
   NEXT_PUBLIC_CREEM_PLAN_BASIC_MONTHLY_ID
   NEXT_PUBLIC_CREEM_PLAN_BASIC_YEARLY_ID
   NEXT_PUBLIC_CREEM_PLAN_CREATOR_MONTHLY_ID
   NEXT_PUBLIC_CREEM_PLAN_CREATOR_YEARLY_ID
   NEXT_PUBLIC_CREEM_PLAN_PRO_MONTHLY_ID
   NEXT_PUBLIC_CREEM_PLAN_PRO_YEARLY_ID
   NEXT_PUBLIC_CREEM_PACK_STARTER_ID
   NEXT_PUBLIC_CREEM_PACK_CREATOR_ID
   NEXT_PUBLIC_CREEM_PACK_DEV_ID
   ```
   - 从 Creem Dashboard → Products 获取每个产品的 ID
   - 确保 ID 与 Creem Dashboard 中的完全匹配

### 步骤 4: 常见错误及解决方案

#### 错误 1: "Creem API key not configured"
**原因**: `CREEM_API_KEY` 未设置或为空

**解决**:
1. 在 Vercel 环境变量中添加 `CREEM_API_KEY`
2. 确保选择 "Production" 环境
3. 重新部署应用

#### 错误 2: "安全错误：生产环境不应使用测试密钥"
**原因**: 生产环境配置了测试密钥

**解决**:
1. 从 Creem Dashboard 获取生产密钥（`creem_live_...` 或 `pk_live_...`）
2. 在 Vercel 中更新 `CREEM_API_KEY` 为生产密钥
3. 重新部署

#### 错误 3: "Plan productId not configured"
**原因**: 某个计划的产品 ID 未配置

**解决**:
1. 检查 Vercel 环境变量中是否缺少对应的 `NEXT_PUBLIC_CREEM_PLAN_*_ID`
2. 从 Creem Dashboard 获取产品 ID
3. 添加到 Vercel 环境变量
4. 重新部署

#### 错误 4: "Creem API error: 401" 或 "403"
**原因**: API Key 无效或权限不足

**解决**:
1. 验证 API Key 是否正确
2. 检查 API Key 是否有创建 checkout 的权限
3. 在 Creem Dashboard 中重新生成 API Key

#### 错误 5: "Creem API error: 404"
**原因**: Product ID 不存在或错误

**解决**:
1. 在 Creem Dashboard → Products 中验证产品 ID
2. 确保产品 ID 与 Vercel 环境变量中的完全匹配（区分大小写）
3. 确保产品在 Creem Dashboard 中是激活状态

### 步骤 5: 运行诊断脚本

在本地运行诊断脚本（需要先配置 `.env.local`）：
```bash
npx tsx scripts/check-production-creem.ts
```

### 步骤 6: 验证修复

修复后：
1. 重新部署应用
2. 清除浏览器缓存
3. 再次尝试购买
4. 如果仍有问题，查看 Vercel 函数日志获取最新错误信息

## 📞 需要帮助？

如果以上步骤都无法解决问题，请提供：
1. Vercel 函数日志（包含 `[API]` 或 `[Creem]` 的条目）
2. 浏览器控制台的错误响应（使用 `?debug=1` 参数）
3. 环境变量配置截图（隐藏敏感信息）

