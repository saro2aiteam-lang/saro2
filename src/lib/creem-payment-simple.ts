// 简化版 Creem Payment - 动态创建 checkout
import { Creem } from 'creem';
import crypto from 'crypto';

const creem = new Creem();
const apiKey = process.env.CREEM_API_KEY || '';
const webhookSecret = process.env.CREEM_WEBHOOK_SECRET || '';

// 简化的订阅计划（只需要价格，不需要 Product ID）
export const subscriptionPlans = {
  basic: {
    monthly: { price: 4900, interval: 'month', name: 'Basic - Monthly' },
    yearly: { price: 48000, interval: 'year', name: 'Basic - Yearly' }
  },
  creator: {
    monthly: { price: 12900, interval: 'month', name: 'Creator - Monthly' },
    yearly: { price: 120000, interval: 'year', name: 'Creator - Yearly' }
  },
  pro: {
    monthly: { price: 39900, interval: 'month', name: 'Pro - Monthly' },
    yearly: { price: 360000, interval: 'year', name: 'Pro - Yearly' }
  }
};

// 动态创建产品和 checkout（按需创建）
export async function createCheckoutSession(params: {
  userId: string;
  userEmail?: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  successUrl: string;
  cancelUrl: string;
}) {
  const plan = subscriptionPlans[params.planId as keyof typeof subscriptionPlans];
  if (!plan) {
    throw new Error('Invalid plan');
  }

  const planInfo = plan[params.billingCycle];

  // 先创建产品（或者使用已存在的）
  let productId = '';
  
  try {
    // 方式 1：每次创建新产品（简单但不推荐）
    const productResult = await creem.createProduct({
      xApiKey: apiKey,
      createProductRequest: {
        name: planInfo.name,
        price: planInfo.price,
        interval: planInfo.interval,
        currency: 'usd',
      },
    });

    if (productResult.ok && productResult.value) {
      productId = productResult.value.id || '';
    }
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }

  // 创建 checkout session
  const result = await creem.createCheckout({
    xApiKey: apiKey,
    createCheckoutRequest: {
      productId: productId,
      units: 1,
      customer: {
        id: params.userId,
        email: params.userEmail,
      },
      metadata: {
        planId: params.planId,
        billingCycle: params.billingCycle,
      },
    },
  });

  if (!result.ok) {
    throw new Error(`Checkout creation failed: ${result.error}`);
  }

  return {
    id: result.value.id || '',
    checkoutUrl: result.value.url || '',
    status: 'pending',
  };
}

// Webhook 签名验证
export function verifyWebhookSignature(body: string, signature: string | null): boolean {
  if (!signature || !webhookSecret) return false;

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

export { creem };

