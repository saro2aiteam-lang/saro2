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
    const isTestKey = creemConfig.apiKey.includes('_test_') || creemConfig.apiKey.startsWith('pk_test_');
    
    if (isTestKey) {
      const error = new Error(
        '🚨 安全错误：生产环境不应使用测试密钥！\n' +
        `当前密钥: ${creemConfig.apiKey.substring(0, 20)}...\n` +
        '请在 Vercel 环境变量中配置正确的生产密钥。'
      );
      error.name = 'SecurityError';
      console.error('[Creem] Security check failed:', error.message);
      throw error;
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
// 根据 Creem 文档：https://docs.creem.io/learn/webhooks/verify-webhook-requests
export function verifyWebhookSignature(
  body: string,
  signature: string | null,
  timestamp?: string | null
): boolean {
  if (!signature) {
    console.error('[WEBHOOK] No signature provided for webhook verification');
    return false;
  }

  if (!creemConfig.webhookSecret) {
    console.error('[WEBHOOK] Webhook secret not configured');
    return false;
  }

  try {
    let expectedSignature: string;
    
    // 如果提供了时间戳，使用 timestamp.payload 格式（某些 webhook 服务使用这种方式）
    // 否则直接使用 body（Creem 的标准方式）
    if (timestamp) {
      const payload = `${timestamp}.${body}`;
      expectedSignature = crypto
        .createHmac('sha256', creemConfig.webhookSecret)
        .update(payload)
        .digest('hex');
      
      console.log('[WEBHOOK] Using timestamp-based signature verification');
    } else {
      // 标准方式：直接使用 body
      expectedSignature = crypto
        .createHmac('sha256', creemConfig.webhookSecret)
        .update(body)
        .digest('hex');
      
      console.log('[WEBHOOK] Using body-only signature verification');
    }
    
    // 清理签名字符串（移除可能的空格、换行等）
    const cleanedSignature = signature.trim();
    const cleanedExpected = expectedSignature.trim();
    
    console.log('[WEBHOOK] Signature verification:', {
      hasTimestamp: !!timestamp,
      timestamp: timestamp || 'N/A',
      receivedLength: cleanedSignature.length,
      expectedLength: cleanedExpected.length,
      receivedPrefix: cleanedSignature.substring(0, 16) + '...',
      expectedPrefix: cleanedExpected.substring(0, 16) + '...',
      match: cleanedSignature === cleanedExpected
    });
    
    // 使用时序安全比较以防止时序攻击
    // 如果长度不同，直接返回 false（避免 timingSafeEqual 抛出错误）
    if (cleanedSignature.length !== cleanedExpected.length) {
      console.error('[WEBHOOK] Signature length mismatch:', {
        received: cleanedSignature.length,
        expected: cleanedExpected.length
      });
      return false;
    }
    
    return crypto.timingSafeEqual(
      Buffer.from(cleanedSignature),
      Buffer.from(cleanedExpected)
    );
  } catch (error) {
    console.error('[WEBHOOK] Error verifying webhook signature:', error);
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

/**
 * 创建 Creem Checkout Session
 * 根据官方 API 文档: https://docs.creem.io/api-reference/endpoint/create-checkout
 */
export async function createCheckoutForProduct(params: {
  productId: string;
  customerId: string;
  customerEmail?: string | null;
  successUrl?: string;
  cancelUrl?: string;
  requestId?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}) {
  // 先检查 API Key，提供更清晰的错误信息
  if (!creemConfig.apiKey) {
    console.error('[Creem] API key not configured');
    throw new Error('Creem API key not configured');
  }

  // 安全检查：在生产环境检测测试密钥
  try {
    checkKeySecurityRuntime();
  } catch (securityError) {
    console.error('[Creem] Security check failed:', securityError instanceof Error ? securityError.message : String(securityError));
    throw securityError;
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

  // 构建符合官方 API 规范的请求体
  // 参考: https://docs.creem.io/api-reference/endpoint/create-checkout
  const checkoutRequest: any = {
    product_id: params.productId, // API 使用 product_id (snake_case)
    units: 1,
  };

  if (params.requestId) {
    checkoutRequest.request_id = params.requestId;
  }

  if (params.customerEmail) {
    // 根据 Creem API 文档，只支持 customer.email
    // 参考: https://docs.creem.io/learn/checkout-session/introduction
    checkoutRequest.customer = {
      email: params.customerEmail,
    };
    // 注意：Creem API 不支持 customer.id，只在 metadata 中传递 customerId
  }

  if (params.successUrl) {
    checkoutRequest.success_url = params.successUrl;
  }

  // 注意：Creem API 不支持 cancel_url 参数
  // 参考: https://docs.creem.io/learn/checkout-session/introduction
  // cancel_url 功能可能需要在产品设置中配置，而不是在 checkout session 中传递

  if (metadata) {
    checkoutRequest.metadata = metadata;
  }

  try {
    // 记录请求详情
    console.log('[Creem] Creating checkout:', {
      productId: params.productId,
      hasApiKey: !!creemConfig.apiKey,
      apiKeyPrefix: creemConfig.apiKey?.substring(0, 20),
      hasSuccessUrl: !!params.successUrl,
      requestBody: JSON.stringify(checkoutRequest, null, 2),
    });

    // 优先使用 SDK，如果失败则使用 REST API
    let result: any;
    
    try {
      console.log('[Creem] Attempting SDK checkout...');
      
      result = await creem.createCheckout({
        xApiKey: creemConfig.apiKey,
        createCheckoutRequest: checkoutRequest,
      } as any) as any;
      
      console.log('[Creem] SDK call completed:', {
        hasResult: !!result,
        resultType: typeof result,
        resultKeys: result ? Object.keys(result) : [],
      });
    } catch (sdkError) {
      const sdkErrorMessage = sdkError instanceof Error ? sdkError.message : String(sdkError);
      console.warn('[Creem] SDK failed, falling back to REST API:', {
        error: sdkErrorMessage,
        errorName: sdkError instanceof Error ? sdkError.name : 'Unknown',
        productId: params.productId,
      });
      
      // 使用 REST API 作为备用方案
      const baseUrl = creemConfig.baseUrl || 'https://api.creem.io';
      const apiUrl = `${baseUrl}/v1/checkouts`;
      
      console.log('[Creem] Calling REST API:', apiUrl);
      
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': creemConfig.apiKey,
          },
          body: JSON.stringify(checkoutRequest),
        });

        console.log('[Creem] REST API response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Creem] REST API error:', {
            status: response.status,
            statusText: response.statusText,
            errorText,
            productId: params.productId,
          });
          throw new Error(`Creem API error: ${response.status} ${errorText}`);
        }

        const responseData = await response.json();
        console.log('[Creem] REST API success:', {
          hasData: !!responseData,
          dataKeys: responseData ? Object.keys(responseData) : [],
        });
        result = { ok: true, value: responseData };
      } catch (fetchError) {
        console.error('[Creem] REST API fetch failed:', {
          error: fetchError instanceof Error ? fetchError.message : String(fetchError),
          errorName: fetchError instanceof Error ? fetchError.name : 'Unknown',
        });
        throw fetchError;
      }
    }

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
// 使用新的环境变量命名：NEXT_PUBLIC_CREEM_PLAN_*_ID
export const subscriptionPlans: Record<string, SubscriptionPlan> = {
  basic: {
    monthly: { 
      price: 1900, // $19/月, 100 credits ($0.19/credit)
      interval: 'month',
      productId: process.env.NEXT_PUBLIC_CREEM_PLAN_BASIC_MONTHLY_ID || 'prod_basic_monthly'
    },
    yearly: { 
      price: 19200, // $192/年 (相当于 $16/月)
      interval: 'year',
      productId: process.env.NEXT_PUBLIC_CREEM_PLAN_BASIC_YEARLY_ID || 'prod_basic_yearly'
    }
  },
  creator: {
    monthly: { 
      price: 4900, // $49/月, 300 credits ($0.16/credit)
      interval: 'month',
      productId: process.env.NEXT_PUBLIC_CREEM_PLAN_CREATOR_MONTHLY_ID || 'prod_creator_monthly'
    },
    yearly: { 
      price: 49920, // $499.20/年 (相当于 $41.60/月)
      interval: 'year',
      productId: process.env.NEXT_PUBLIC_CREEM_PLAN_CREATOR_YEARLY_ID || 'prod_creator_yearly'
    }
  },
  pro: {
    monthly: { 
      price: 14900, // $149/月, 1000 credits ($0.15/credit)
      interval: 'month',
      productId: process.env.NEXT_PUBLIC_CREEM_PLAN_PRO_MONTHLY_ID || 'prod_pro_monthly'
    },
    yearly: { 
      price: 152064, // $1,520.64/年 (相当于 $126.72/月)
      interval: 'year',
      productId: process.env.NEXT_PUBLIC_CREEM_PLAN_PRO_YEARLY_ID || 'prod_pro_yearly'
    }
  }
};

// 导出配置和实例
export { creem, creemConfig };
