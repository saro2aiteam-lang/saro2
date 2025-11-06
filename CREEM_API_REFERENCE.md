# Creem API 集成参考

根据 [Creem API 官方文档](https://docs.creem.io/api-reference/introduction)，以下是关键 API 端点的使用说明。

## API 基础信息

- **Base URL**: `https://api.creem.io`
- **认证方式**: 在请求头中添加 `x-api-key`
- **测试环境**: 使用测试 API Key (`creem_test_...` 或 `pk_test_...`)

## 主要 API 端点

### 1. Create Checkout Session

**端点**: `POST /v1/checkouts`

**文档**: https://docs.creem.io/api-reference/endpoint/create-checkout

**请求示例**:
```json
{
  "product_id": "prod_1234567890",
  "request_id": "checkout_123",
  "units": 1,
  "customer": {
    "id": "cust_1234567890",
    "email": "user@example.com"
  },
  "success_url": "https://example.com/success",
  "metadata": {
    "userId": "user_123"
  }
}
```

**响应示例**:
```json
{
  "id": "checkout_123",
  "checkout_url": "https://checkout.creem.io/...",
  "status": "pending",
  "product": "prod_1234567890"
}
```

### 2. Get Checkout Session

**端点**: `GET /v1/checkouts?checkout_id=<checkout_id>`

**文档**: https://docs.creem.io/api-reference/endpoint/get-checkout

### 3. Create Product

**端点**: `POST /v1/products`

**文档**: https://docs.creem.io/api-reference/endpoint/create-product

**请求示例**:
```json
{
  "name": "Basic - Monthly",
  "price": 1900,
  "currency": "usd",
  "description": "Perfect for getting started",
  "billing_type": "recurring",
  "billing_period": "every-month"
}
```

**一次性包示例**:
```json
{
  "name": "Starter Pack",
  "price": 990,
  "currency": "usd",
  "description": "Pay once, use anytime",
  "billing_type": "one-time"
}
```

**响应示例**:
```json
{
  "id": "prod_1234567890",
  "name": "Basic - Monthly",
  "price": 1900,
  "currency": "usd",
  "billing_type": "recurring",
  "billing_period": "every-month",
  "status": "active"
}
```

### 4. Get Product

**端点**: `GET /v1/products/<product_id>`

**文档**: https://docs.creem.io/api-reference/endpoint/get-product

### 5. Search Products

**端点**: `GET /v1/products` (带查询参数)

**文档**: https://docs.creem.io/api-reference/endpoint/search-products

## 错误代码

根据 [Creem API 文档](https://docs.creem.io/api-reference/introduction):

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 参数错误，请检查请求参数 |
| 401 | API Key 缺失 |
| 403 | API Key 无效 |
| 404 | 资源未找到 |
| 429 | 超出速率限制 |
| 500 | Creem 服务器错误 |

## 当前实现状态

### ✅ 已实现

1. **Create Checkout Session** (`src/lib/creem-payment.ts`)
   - 支持 `product_id`, `request_id`, `customer`, `success_url`, `metadata`
   - 有 SDK 和 REST API 备用方案

2. **Webhook 处理** (`app/api/webhooks/creem/route.ts`)
   - 支持所有主要事件类型
   - 签名验证
   - 数据库记录

### ⚠️ 需要改进

1. **Create Product** (`scripts/create-creem-products.ts`)
   - 当前返回 403 错误
   - 建议在 Dashboard 手动创建产品

2. **Get Checkout Session**
   - 可以添加用于查询 checkout 状态的函数

3. **Get Product / Search Products**
   - 可以添加用于验证产品 ID 的函数

## 使用建议

1. **产品创建**: 在 Creem Dashboard 手动创建产品，然后复制产品 ID
2. **Checkout 创建**: 使用 `createCheckoutForProduct` 函数
3. **Webhook**: 确保配置正确的 webhook URL 和 secret

## 参考链接

- [API 介绍](https://docs.creem.io/api-reference/introduction)
- [Create Checkout](https://docs.creem.io/api-reference/endpoint/create-checkout)
- [Get Checkout](https://docs.creem.io/api-reference/endpoint/get-checkout)
- [Create Product](https://docs.creem.io/api-reference/endpoint/create-product)
- [Get Product](https://docs.creem.io/api-reference/endpoint/get-product)
- [Search Products](https://docs.creem.io/api-reference/endpoint/search-products)

