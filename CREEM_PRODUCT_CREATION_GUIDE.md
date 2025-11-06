# Creem 产品创建指南

## 问题说明

脚本返回 `403 Forbidden` 错误，根据 [Creem API 文档](https://docs.creem.io/api-reference/introduction)，这表示：
- **403**: The API key used was invalid（使用的 API Key 无效）

## 解决方案

### 方案 1：在 Creem Dashboard 手动创建产品（推荐）

这是最可靠的方法，因为：
- ✅ 不需要 API 权限
- ✅ 可以设置所有产品属性
- ✅ 可以立即看到产品 ID

**步骤**：

1. 登录 [Creem Dashboard](https://creem.io)
2. 进入 **Products** 页面
3. 点击 **Create Product** 或 **+ New Product**
4. 填写产品信息：
   - **Name**: 产品名称（如 "Basic - Monthly"）
   - **Price**: 价格（以分为单位，如 $19 = 1900）
   - **Currency**: USD
   - **Billing Type**: 
     - 订阅产品选择 "Recurring" → 选择 "Monthly" 或 "Yearly"
     - 一次性包选择 "One-time"
   - **Description**: 产品描述（可选）
5. 点击 **Create** 或 **Save**
6. 创建后，在产品列表中：
   - 点击产品名称进入详情页
   - 或者点击产品右侧的 **...** 菜单
   - 选择 **Copy ID** 复制产品 ID
7. 将产品 ID 添加到 `.env.local`：

```bash
# 订阅计划
NEXT_PUBLIC_CREEM_PLAN_BASIC_MONTHLY_ID=prod_xxxxx
NEXT_PUBLIC_CREEM_PLAN_BASIC_YEARLY_ID=prod_xxxxx
NEXT_PUBLIC_CREEM_PLAN_CREATOR_MONTHLY_ID=prod_xxxxx
NEXT_PUBLIC_CREEM_PLAN_CREATOR_YEARLY_ID=prod_xxxxx
NEXT_PUBLIC_CREEM_PLAN_PRO_MONTHLY_ID=prod_xxxxx
NEXT_PUBLIC_CREEM_PLAN_PRO_YEARLY_ID=prod_xxxxx

# 一次性包
NEXT_PUBLIC_CREEM_PACK_STARTER_ID=prod_xxxxx
NEXT_PUBLIC_CREEM_PACK_CREATOR_ID=prod_xxxxx
NEXT_PUBLIC_CREEM_PACK_DEV_ID=prod_xxxxx
```

### 方案 2：检查并更新 API Key

如果必须使用 API 创建产品：

1. **检查 API Key 权限**：
   - 登录 Creem Dashboard
   - 进入 **Settings** → **API Keys**
   - 确认 API Key 有创建产品的权限
   - 如果权限不足，创建新的 API Key 或联系 Creem 支持

2. **验证 API Key 格式**：
   - 测试模式：`creem_test_xxxxx` 或 `pk_test_xxxxx`
   - 生产模式：`creem_live_xxxxx` 或 `pk_live_xxxxx`
   - 确保 API Key 完整且未过期

3. **测试 API Key**：
   ```bash
   curl https://api.creem.io/v1/products \
     -H "x-api-key: YOUR_API_KEY" \
     -H "Content-Type: application/json"
   ```
   - 如果返回 401/403，说明 API Key 无效
   - 如果返回 200，说明 API Key 有效，但可能没有创建权限

### 方案 3：使用 Creem SDK（如果可用）

如果 Creem SDK 支持产品创建，可以尝试：

```typescript
import { Creem } from 'creem';

const creem = new Creem();
const result = await creem.createProduct({
  xApiKey: 'your-api-key',
  createProductRequest: {
    name: 'Product Name',
    price: 1900,
    currency: 'usd',
    interval: 'month', // 仅订阅产品需要
  },
});
```

## 需要创建的产品列表

### 订阅计划（6个）

| 产品名称 | 价格 | 周期 | 环境变量名 |
|---------|------|------|-----------|
| Basic - Monthly | $19 | Monthly | `NEXT_PUBLIC_CREEM_PLAN_BASIC_MONTHLY_ID` |
| Basic - Yearly | $192 | Yearly | `NEXT_PUBLIC_CREEM_PLAN_BASIC_YEARLY_ID` |
| Creator - Monthly | $49 | Monthly | `NEXT_PUBLIC_CREEM_PLAN_CREATOR_MONTHLY_ID` |
| Creator - Yearly | $499.20 | Yearly | `NEXT_PUBLIC_CREEM_PLAN_CREATOR_YEARLY_ID` |
| Pro - Monthly | $149 | Monthly | `NEXT_PUBLIC_CREEM_PLAN_PRO_MONTHLY_ID` |
| Pro - Yearly | $1,520.64 | Yearly | `NEXT_PUBLIC_CREEM_PLAN_PRO_YEARLY_ID` |

### 一次性包（3个）

| 产品名称 | 价格 | 类型 | 环境变量名 |
|---------|------|------|-----------|
| Starter Pack | $9.9 | One-time | `NEXT_PUBLIC_CREEM_PACK_STARTER_ID` |
| Creator Pack | $49 | One-time | `NEXT_PUBLIC_CREEM_PACK_CREATOR_ID` |
| Professional Pack | $199 | One-time | `NEXT_PUBLIC_CREEM_PACK_DEV_ID` |

## 验证配置

创建所有产品后，运行：

```bash
npm run dev
```

然后检查：
- 产品是否在 Creem Dashboard 中显示
- 环境变量是否正确配置
- 应用是否能正常使用产品 ID

## 参考文档

- [Creem API 文档](https://docs.creem.io/api-reference/introduction)
- [Creem Dashboard](https://creem.io)

