// Creem Payment integration with official SDK
import { Creem } from 'creem';
import crypto from 'crypto';

interface CreemPaymentConfig {
  apiKey: string;
  webhookSecret: string;
}

interface SubscriptionPlan {
  monthly: { price: number; interval: string; productId: string };
  yearly: { price: number; interval: string; productId: string };
}

// Creem Payment 配置
const creemConfig: CreemPaymentConfig = {
  apiKey: process.env.CREEM_API_KEY || '',
  webhookSecret: process.env.CREEM_WEBHOOK_SECRET || '',
};

// 安全检查函数：只在运行时检查，不在构建时检查
// 使用 VERCEL_ENV 而不是 NODE_ENV 来判断真正的部署环境
function checkKeySecurityRuntime() {
  if (creemConfig.apiKey && process.env.VERCEL_ENV === 'production') {
    const isTestKey = creemConfig.apiKey.includes('_test_');
    
    if (isTestKey) {
      throw new Error(
        '🚨 安全错误：生产环境不应使用测试密钥！\n' +
        `当前密钥: ${creemConfig.apiKey.substring(0, 20)}...\n` +
        '请在 Vercel 环境变量中配置正确的生产密钥。'
      );
    }
  }
}

// 验证必要的环境变量
if (!creemConfig.apiKey) {
  console.error('缺少 CREEM_API_KEY 环境变量');
}

if (!creemConfig.webhookSecret) {
  console.error('缺少 CREEM_WEBHOOK_SECRET 环境变量');
}

// 初始化 Creem SDK
const creem = new Creem();

// Webhook 签名验证函数
export function verifyWebhookSignature(
  body: string,
  signature: string | null
): boolean {
  if (!signature) {
    console.error('No signature provided for webhook verification');
    return false;
  }

  if (!creemConfig.webhookSecret) {
    console.error('Webhook secret not configured');
    return false;
  }

  try {
    // 使用 HMAC-SHA256 生成预期签名
    // 根据 Creem 文档：使用 webhook secret 作为 key，request payload 作为 message
    const expectedSignature = crypto
      .createHmac('sha256', creemConfig.webhookSecret)
      .update(body)
      .digest('hex');
    
    console.log('[WEBHOOK] Signature verification:', {
      received: signature.substring(0, 8) + '...',
      expected: expectedSignature.substring(0, 8) + '...',
      match: signature === expectedSignature
    });
    
    // 使用时序安全比较以防止时序攻击
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// 创建订阅（使用 Creem SDK）
export async function createSubscription(params: {
  customerId: string;
  customerEmail?: string;
  planId: string;
  billingCycle: string;
  successUrl: string;
  cancelUrl: string;
}) {
  checkKeySecurityRuntime();
  
  if (!creemConfig.apiKey) {
    throw new Error('Creem API key not configured');
  }

  try {
    // 使用 Creem SDK 创建 checkout session
    const result = await creem.createCheckout({
      xApiKey: creemConfig.apiKey,
      createCheckoutRequest: {
        productId: params.planId,
        units: 1, // 订阅数量
        customer: {
          id: params.customerId,
          email: params.customerEmail,
        },
        metadata: {
          billingCycle: params.billingCycle,
          customerId: params.customerId,
          planId: params.planId,
        },
        successUrl: params.successUrl,
      },
    }) as any; // SDK type definitions are incomplete

    // 检查结果并提取数据
    if (!result.ok || !result.value) {
      throw new Error(`Checkout creation failed: ${result.error || 'Unknown error'}`);
    }

    const checkout = result.value;
    return {
      id: checkout.id || '',
      checkoutUrl: checkout.url || '',
      status: 'pending',
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

// 备用方案：使用 REST API
export async function createSubscriptionViaAPI(params: {
  customerId: string;
  planId: string;
  billingCycle: string;
  successUrl: string;
  cancelUrl: string;
}) {
  checkKeySecurityRuntime();
  
  if (!creemConfig.apiKey) {
    throw new Error('Creem API key not configured');
  }

  try {
    const response = await fetch('https://api.creem.io/v1/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': creemConfig.apiKey,
      },
      body: JSON.stringify({
        productId: params.planId,
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
        metadata: {
          customerId: params.customerId,
          billingCycle: params.billingCycle,
          planId: params.planId,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Subscription creation failed: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    
    return {
      id: data.id,
      checkoutUrl: data.url,
      status: 'pending',
    };
  } catch (error) {
    console.error('Error creating subscription via API:', error);
    throw error;
  }
}

export async function createCheckoutForProduct(params: {
  productId: string;
  customerId: string;
  customerEmail?: string | null;
  successUrl?: string;
  cancelUrl?: string;
  requestId?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}) {
  checkKeySecurityRuntime();

  if (!creemConfig.apiKey) {
    throw new Error('Creem API key not configured');
  }

  if (!params.productId) {
    throw new Error('Creem product ID is required');
  }

  const metadata: Record<string, string> | undefined = params.metadata
    ? Object.fromEntries(
        Object.entries(params.metadata)
          .filter(([, value]) => value !== undefined && value !== null)
          .map(([key, value]) => [key, String(value)])
      )
    : undefined;

  try {
    const result = await creem.createCheckout({
      xApiKey: creemConfig.apiKey,
      createCheckoutRequest: {
        productId: params.productId,
        units: 1,
        customer: params.customerEmail ? {
          email: params.customerEmail,
        } : undefined,
        metadata,
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
        requestId: params.requestId, // 添加 request_id 支持
      },
    } as any) as any;

    console.log('Creem SDK result:', JSON.stringify(result, null, 2));

    // More flexible result checking - handle different SDK response formats
    let checkoutData = null;
    
    if (result.ok && result.value) {
      checkoutData = result.value;
    } else if (result.data) {
      // Alternative response format
      checkoutData = result.data;
    } else if (result.id || result.url) {
      // Direct response format
      checkoutData = result;
    } else {
      console.error('Creem SDK failed:', {
        ok: result.ok,
        value: result.value,
        data: result.data,
        error: result.error,
        fullResult: result
      });
      throw new Error(`Checkout creation failed: ${result.error || result.message || 'Unknown error'}`);
    }

    console.log('Extracted checkoutData:', JSON.stringify(checkoutData, null, 2));

    return {
      id: checkoutData.id || '',
      checkoutUrl: checkoutData.checkout_url || checkoutData.url || checkoutData.checkoutUrl || checkoutData.payment_url || '',
      status: checkoutData.status || 'pending',
    };
  } catch (error) {
    console.error('Error creating Creem checkout:', error);
    throw error;
  }
}

// 订阅计划定义
// TODO: 从 Creem Dashboard 获取实际的产品 ID 并替换下面的值
export const subscriptionPlans: Record<string, SubscriptionPlan> = {
  basic: {
    monthly: { 
      price: 1900, // $19/月, 100 credits ($0.19/credit)
      interval: 'month',
      productId: process.env.CREEM_PRODUCT_BASIC_MONTHLY || 'prod_basic_monthly' // 替换为实际的 Creem 产品 ID
    },
    yearly: { 
      price: 19200, // $192/年 (相当于 $16/月)
      interval: 'year',
      productId: process.env.CREEM_PRODUCT_BASIC_YEARLY || 'prod_basic_yearly'
    }
  },
  creator: {
    monthly: { 
      price: 4900, // $49/月, 300 credits ($0.16/credit)
      interval: 'month',
      productId: process.env.CREEM_PRODUCT_CREATOR_MONTHLY || 'prod_creator_monthly'
    },
    yearly: { 
      price: 49920, // $499.20/年 (相当于 $41.60/月)
      interval: 'year',
      productId: process.env.CREEM_PRODUCT_CREATOR_YEARLY || 'prod_creator_yearly'
    }
  },
  pro: {
    monthly: { 
      price: 14900, // $149/月, 1000 credits ($0.15/credit)
      interval: 'month',
      productId: process.env.CREEM_PRODUCT_PRO_MONTHLY || 'prod_pro_monthly'
    },
    yearly: { 
      price: 152064, // $1,520.64/年 (相当于 $126.72/月)
      interval: 'year',
      productId: process.env.CREEM_PRODUCT_PRO_YEARLY || 'prod_pro_yearly'
    }
  }
};

// 导出配置和实例
export { creem, creemConfig };
