import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/creem-payment';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { creditCredits } from '@/lib/credits';
import { creemPlansById } from '@/config/creemPlans';

export const runtime = 'nodejs';

const SENSITIVE_HEADERS = new Set(['authorization', 'x-creem-signature', 'creem-signature']);

type SubscriptionIdColumn = 'subscription_id' | 'creem_subscription_id';
let subscriptionIdColumnCache: SubscriptionIdColumn | null = null;

async function resolveSubscriptionIdColumn(client = getSupabaseAdmin()): Promise<SubscriptionIdColumn> {
  if (subscriptionIdColumnCache) {
    return subscriptionIdColumnCache;
  }

  for (const column of ['subscription_id', 'creem_subscription_id'] as const) {
    const { error } = await client
      .from('user_subscriptions')
      .select(column)
      .limit(1);

    if (!error) {
      subscriptionIdColumnCache = column;
      return column;
    }

    const message = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase();
    const isMissingColumn =
      error.code === '42703' ||
      error.code === 'PGRST102' ||
      error.code === 'PGRST201' ||
      message.includes('column') && message.includes('does not exist');

    if (!isMissingColumn) {
      console.error('[WEBHOOK] Unexpected error probing user_subscriptions columns', { column, error });
      throw error;
    }
  }

  throw new Error('user_subscriptions table does not expose subscription identifier column');
}

class WebhookProcessingError extends Error {
  status: number;
  cause?: unknown;

  constructor(message: string, status = 500, cause?: unknown) {
    super(message);
    this.name = 'WebhookProcessingError';
    this.status = status;
    this.cause = cause;
  }
}

const sanitizeHeaders = (headers: Headers) => {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = SENSITIVE_HEADERS.has(key.toLowerCase()) ? '***redacted***' : value;
  });
  return result;
};

// 记录未匹配的邮箱用于后续处理
async function logUnmatchedEmail(email: string, webhookData: any) {
  try {
    const { error } = await getSupabaseAdmin()
      .from('unmatched_payment_emails')
      .insert({
        email: email.toLowerCase().trim(),
        webhook_data: webhookData,
        created_at: new Date().toISOString(),
        status: 'pending'
      });
    
    if (error) {
      console.error('[WEBHOOK] Failed to log unmatched email:', error);
    } else {
      console.log('[WEBHOOK] Logged unmatched email for manual review:', email);
    }
  } catch (error) {
    console.error('[WEBHOOK] Exception logging unmatched email:', error);
  }
}

// 查找用户邮箱的通用函数
async function findUserByEmail(email: string): Promise<string | null> {
  console.log('[WEBHOOK] Finding user by email:', email);
  
  // 1. 精确匹配
  let { data: user, error } = await getSupabaseAdmin()
    .from('users')
    .select('id, email')
    .eq('email', email)
    .maybeSingle();
  
  if (error) {
    console.error('[WEBHOOK] Failed to lookup user by email:', error);
    return null;
  }
  
  if (user) {
    console.log('[WEBHOOK] Found user by exact email match:', { email, userId: user.id });
    return user.id;
  }
  
  // 2. 尝试忽略大小写的匹配
  console.log('[WEBHOOK] Trying case-insensitive email match...');
  const { data: userCI, error: errorCI } = await getSupabaseAdmin()
    .from('users')
    .select('id, email')
    .ilike('email', email)
    .maybeSingle();
  
  if (errorCI) {
    console.error('[WEBHOOK] Failed to lookup user by case-insensitive email:', errorCI);
  } else if (userCI) {
    console.log('[WEBHOOK] Found user by case-insensitive email match:', { 
      searchedEmail: email, 
      foundEmail: userCI.email, 
      userId: userCI.id 
    });
    return userCI.id;
  }
  
  // 3. 手动邮箱映射已移除，直接使用数据库匹配
  
  console.log('[WEBHOOK] No user found with email:', email);
  return null;
}

// 记录邮箱匹配日志
async function logEmailMatching(
  searchedEmail: string,
  matchType: string,
  matchedUserId: string | null,
  matchedEmail: string | null,
  eventType: string,
  webhookData: any
) {
  try {
    const { error } = await getSupabaseAdmin().rpc('log_email_matching', {
      p_searched_email: searchedEmail,
      p_match_type: matchType,
      p_matched_user_id: matchedUserId,
      p_matched_email: matchedEmail,
      p_webhook_event_type: eventType,
      p_webhook_data: webhookData
    });
    
    if (error) {
      console.error('[WEBHOOK] Failed to log email matching:', error);
    }
  } catch (error) {
    console.error('[WEBHOOK] Exception logging email matching:', error);
  }
}

const summarizeEventForLog = (event: any) => ({
  type: event?.type ?? 'unknown',
  paymentId: event?.data?.payment_id ?? event?.data?.id ?? null,
  subscriptionId: event?.data?.subscription_id ?? event?.data?.subscriptionId ?? null,
  customerId: event?.data?.customer_id ?? event?.data?.metadata?.customerId ?? null,
  metadataKeys:
    event?.data?.metadata && typeof event.data.metadata === 'object'
      ? Object.keys(event.data.metadata)
      : [],
});

// 支持 GET 方法用于测试和健康检查
export async function GET(request: NextRequest) {
  const testId = `test_${Date.now()}`;
  console.log(`[WEBHOOK-TEST-${testId}] ========================================`);
  console.log(`[WEBHOOK-TEST-${testId}] 🧪 Test endpoint called`);
  console.log(`[WEBHOOK-TEST-${testId}] Timestamp: ${new Date().toISOString()}`);
  console.log(`[WEBHOOK-TEST-${testId}] This is a test log to verify logging works`);
  console.log(`[WEBHOOK-TEST-${testId}] ========================================`);
  
  return NextResponse.json(
    { 
      message: 'Creem webhook endpoint is active',
      methods: ['POST'],
      timestamp: new Date().toISOString(),
      testId,
      note: 'Check Vercel logs for [WEBHOOK-TEST- logs to verify logging works'
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  // 🔥 测试日志 - 确保能看到输出
  console.log(">>> CREEM WEBHOOK TRIGGERED <<<");
  console.log(">>> RUNTIME CHECK: Node.js Runtime");
  console.log(">>> TIMESTAMP:", new Date().toISOString());
  
  const webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const debugInfo: any[] = [];
  
  debugInfo.push(`[${new Date().toISOString()}] 🚀 Starting webhook processing...`);
  debugInfo.push(`[${new Date().toISOString()}] Webhook ID: ${webhookId}`);
  
  console.log(`[WEBHOOK-${webhookId}] ========================================`);
  console.log(`[WEBHOOK-${webhookId}] 🚀 Starting webhook processing...`);
  console.log(`[WEBHOOK-${webhookId}] Timestamp: ${new Date().toISOString()}`);
  
  // 🔍 关键检查 1: Supabase 配置
  console.log(`[WEBHOOK-${webhookId}] 🔍 Supabase Config Check:`, {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) || 'NOT SET',
    serviceRoleKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) || 'NOT SET',
  });
  
  try {
    // 测试 Supabase 连接
    try {
      const testClient = getSupabaseAdmin();
      console.log(`[WEBHOOK-${webhookId}] ✅ Supabase admin client created successfully`);
    } catch (supabaseError) {
      console.error(`[WEBHOOK-${webhookId}] ❌❌❌ CRITICAL: Failed to create Supabase admin client:`, supabaseError);
      throw supabaseError;
    }
    
    const body = await request.text();
    console.log(`[WEBHOOK-${webhookId}] Received webhook request`, {
      headers: sanitizeHeaders(request.headers),
      bodyLength: body.length,
      bodyPreview: body.substring(0, 500), // 前500字符用于调试
    });
    
    // 检查 Creem 使用的签名头名称（支持多种可能的头名称）
    // 根据 Creem 文档：https://docs.creem.io/learn/webhooks/verify-webhook-requests
    // Creem 可能使用: creem-signature, x-creem-signature, X-Creem-Signature 等
    const signature = 
      request.headers.get('creem-signature') ||
      request.headers.get('x-creem-signature') ||
      request.headers.get('X-Creem-Signature') ||
      request.headers.get('Creem-Signature');
    
    // 检查时间戳头（某些 webhook 服务需要）
    const timestamp = 
      request.headers.get('x-creem-timestamp') ||
      request.headers.get('creem-timestamp') ||
      request.headers.get('X-Creem-Timestamp');
    
    console.log(`[WEBHOOK-${webhookId}] Signature header check:`, {
      'creem-signature': request.headers.get('creem-signature') ? 'present' : 'missing',
      'x-creem-signature': request.headers.get('x-creem-signature') ? 'present' : 'missing',
      'X-Creem-Signature': request.headers.get('X-Creem-Signature') ? 'present' : 'missing',
      'Creem-Signature': request.headers.get('Creem-Signature') ? 'present' : 'missing',
      'x-creem-timestamp': request.headers.get('x-creem-timestamp') ? 'present' : 'missing',
      signatureFound: signature ? 'yes' : 'no',
      timestampFound: timestamp ? 'yes' : 'no',
    });
    console.log(`[WEBHOOK-${webhookId}] All headers:`, Object.fromEntries(request.headers.entries()));

    // 验证Webhook签名（根据Creem文档要求）
    // 根据 Creem 文档，签名验证可能需要时间戳
    const signatureValid = verifyWebhookSignature(body, signature, timestamp);
    
    if (!signatureValid) {
      console.error(`[WEBHOOK-${webhookId}] ❌❌❌ Invalid signature - rejecting webhook`, {
        hasSignature: !!signature,
        bodyLength: body.length,
        signaturePrefix: signature?.substring(0, 20) || 'N/A',
        headers: Object.fromEntries(request.headers.entries())
      });
      
      // 即使签名验证失败，也记录事件类型以便调试
      try {
        const event = JSON.parse(body);
        const eventType = event?.eventType || event?.type || event?.event_type || 'unknown';
        console.error(`[WEBHOOK-${webhookId}] Event type was: ${eventType}`);
        console.error(`[WEBHOOK-${webhookId}] Full event:`, JSON.stringify(event, null, 2));
      } catch (e) {
        console.error(`[WEBHOOK-${webhookId}] Could not parse event body`);
      }
      
      return NextResponse.json(
        { error: 'Invalid webhook signature', webhookId },
        { status: 401 }
      );
    }
    
    console.log(`[WEBHOOK-${webhookId}] ✅ Signature verified successfully`);

    console.log(`[WEBHOOK-${webhookId}] Parsing event body...`);
    const event = JSON.parse(body);
    console.log(`[WEBHOOK-${webhookId}] ✅ Event parsed successfully`);
    
    // Normalize event type and payload shape from Creem
    // According to Creem docs: events have "eventType" field and "object" payload
    const eventType = event?.eventType || event?.type || event?.event_type || 'unknown';
    const payload = event?.object || event?.data || null;
    const eventId = event?.id || null;
    const createdAt = event?.created_at || null;
    
    console.log(`[WEBHOOK-${webhookId}] 📋 Event Details:`, {
      eventType,
      eventId,
      createdAt,
      hasPayload: !!payload,
      payloadKeys: payload && typeof payload === 'object' ? Object.keys(payload) : null,
    });
    console.log(`[WEBHOOK-${webhookId}] Event summary:`, summarizeEventForLog({ type: eventType, data: payload }));
    
    // 打印完整 payload（用于调试）
    console.log(`[WEBHOOK-${webhookId}] Full payload:`, JSON.stringify(payload, null, 2));
    console.log(`[WEBHOOK-${webhookId}] Full event object:`, JSON.stringify(event, null, 2));

    console.log(`[WEBHOOK-${webhookId}] 🔀 Routing to event handler for: ${eventType}`);
    switch (eventType) {
      case 'subscription.active': {
        // According to Creem docs: Use only for synchronization
        // We encourage using subscription.paid for activating access
        // However, if subscription.paid doesn't arrive, we should still activate credits
        console.log('[WEBHOOK] Processing subscription.active event...');
        try {
          const sub = payload;
          const email = sub?.customer?.email;
          if (!email) {
            console.error('[WEBHOOK] subscription.active missing customer email');
            break;
          }
          
          const userId = await findUserByEmail(String(email));
          if (!userId) {
            await logUnmatchedEmail(String(email), event);
            break;
          }
          
          // Check if credits have already been activated for this subscription
          // If not, activate them (in case subscription.paid didn't arrive)
          let shouldActivateCredits = false;
          if (sub?.id) {
            const { data: existingTx } = await getSupabaseAdmin()
              .from('credit_transactions')
              .select('id')
              .eq('user_id', userId)
              .eq('metadata->>subscriptionId', sub.id)
              .eq('reason', 'subscription_created')
              .maybeSingle();
            
            if (!existingTx) {
              // No credits activated yet, check if we should activate
              const metadataCredits = sub?.metadata?.credits;
              const hasCreditsInMetadata = metadataCredits && Number(metadataCredits) > 0;
              
              // If metadata has credits or this is a new active subscription, activate credits
              if (hasCreditsInMetadata || sub?.status === 'active') {
                shouldActivateCredits = true;
                console.log('[WEBHOOK] subscription.active: Credits not yet activated, will activate now', {
                  subscriptionId: sub.id,
                  hasMetadataCredits: hasCreditsInMetadata,
                  metadataCredits
                });
              }
            } else {
              console.log('[WEBHOOK] subscription.active: Credits already activated, skipping', {
                subscriptionId: sub.id
              });
            }
          }
          
          // 优先从 metadata 中获取 planId，其次使用 product.id
          const planIdFromMetadata = sub?.metadata?.planId;
          const plan_id = planIdFromMetadata || sub?.product?.id;
          
          console.log('[WEBHOOK] subscription.active - plan identification:', {
            planIdFromMetadata,
            productId: sub?.product?.id,
            finalPlanId: plan_id
          });
          
          await handleSubscriptionCreated({
            subscription_id: sub?.id,
            customer_id: userId,
            plan_id: plan_id, // 优先使用 metadata 中的 planId
            status: sub?.status ?? 'active',
            current_period_start: sub?.current_period_start_date ?? sub?.current_period_start ?? null,
            current_period_end: sub?.current_period_end_date ?? sub?.current_period_end ?? null,
            skipCredits: !shouldActivateCredits, // Activate credits if not already done
            metadata: sub?.metadata, // Pass metadata so credits can be read from it
          });
        } catch (error) {
          console.error('[WEBHOOK] Error in subscription.active handler:', error);
          throw error;
        }
        break;
      }
      
      case 'subscription.paid': {
        // According to Creem docs: Recommended event for activating access
        // A subscription transaction was paid by the customer
        console.log('[WEBHOOK] Processing subscription.paid event (activate access)...');
        try {
          const sub = payload;
          const email = sub?.customer?.email;
          if (!email) {
            console.error('[WEBHOOK] subscription.paid missing customer email');
            break;
          }
          
          const userId = await findUserByEmail(String(email));
          if (!userId) {
            await logUnmatchedEmail(String(email), event);
            break;
          }
          
          // 优先从 metadata 中获取 planId，其次使用 product.id
          const planIdFromMetadata = sub?.metadata?.planId;
          const plan_id = planIdFromMetadata || sub?.product?.id;
          
          console.log('[WEBHOOK] subscription.paid - plan identification:', {
            planIdFromMetadata,
            productId: sub?.product?.id,
            finalPlanId: plan_id
          });
          
          // Activate subscription and credits
          await handleSubscriptionCreated({
            subscription_id: sub?.id,
            customer_id: userId,
            plan_id: plan_id, // 优先使用 metadata 中的 planId
            status: sub?.status ?? 'active',
            current_period_start: sub?.current_period_start_date ?? sub?.current_period_start ?? null,
            current_period_end: sub?.current_period_end_date ?? sub?.current_period_end ?? null,
            skipCredits: false, // Activate credits for paid event
            metadata: sub?.metadata, // Pass metadata so credits can be read from it
          });
          
          // Also handle as payment succeeded for payment record
          const normalized = {
            subscription_id: sub?.id,
            payment_id: sub?.last_transaction_id ?? sub?.last_transaction?.id,
            amount: sub?.last_transaction?.amount,
            currency: sub?.last_transaction?.currency ?? 'USD',
            customer_id: userId,
            metadata: {
              customerId: userId,
              planId: plan_id, // 使用确定的 planId
              productId: sub?.product?.id, // 也包含 productId 用于查找
            }
          };
          await handlePaymentSucceeded(normalized);
        } catch (error) {
          console.error('[WEBHOOK] Error in subscription.paid handler:', error);
          throw error;
        }
        break;
      }
      
      case 'subscription.update': {
        // According to Creem docs: A subscription object was updated
        const sub = payload;
        await handleSubscriptionUpdated({
          subscription_id: sub?.id,
          status: sub?.status,
          current_period_start: sub?.current_period_start_date ?? sub?.current_period_start ?? null,
          current_period_end: sub?.current_period_end_date ?? sub?.current_period_end ?? null,
        });
        break;
      }

      case 'subscription.canceled':
      case 'subscription.cancelled': {
        const sub = payload;
        await handleSubscriptionCanceled({ subscription_id: sub?.id });
        break;
      }
      
      case 'subscription.expired': {
        const sub = payload;
        console.log('[WEBHOOK] Subscription expired:', sub?.id);
        await handleSubscriptionExpired({ subscription_id: sub?.id });
        break;
      }
      
      case 'subscription.trialing': {
        // According to Creem docs: A subscription started a trial period
        const sub = payload;
        console.log('[WEBHOOK] Subscription trialing:', sub?.id);
        const email = sub?.customer?.email;
        if (email) {
          const userId = await findUserByEmail(String(email));
          if (userId) {
            // 优先从 metadata 中获取 planId，其次使用 product.id
            const planIdFromMetadata = sub?.metadata?.planId;
            const plan_id = planIdFromMetadata || sub?.product?.id;
            
            console.log('[WEBHOOK] subscription.trialing - plan identification:', {
              planIdFromMetadata,
              productId: sub?.product?.id,
              finalPlanId: plan_id
            });
            
            await handleSubscriptionCreated({
              subscription_id: sub?.id,
              customer_id: userId,
              plan_id: plan_id, // 优先使用 metadata 中的 planId
              status: 'trialing',
              current_period_start: sub?.current_period_start_date ?? sub?.current_period_start ?? null,
              current_period_end: sub?.current_period_end_date ?? sub?.current_period_end ?? null,
              skipCredits: false, // Activate trial credits
              metadata: sub?.metadata, // Pass metadata so credits can be read from it
            });
          }
        }
        break;
      }
      
      case 'subscription.paused': {
        // According to Creem docs: A subscription was paused
        const sub = payload;
        console.log('[WEBHOOK] Subscription paused:', sub?.id);
        await handleSubscriptionUpdated({
          subscription_id: sub?.id,
          status: 'paused',
          current_period_end: sub?.current_period_end_date ?? sub?.current_period_end ?? null,
        });
        break;
      }
      
      case 'dispute.created': {
        const dispute = payload;
        console.log('[WEBHOOK] Dispute created:', dispute?.id);
        await handleDisputeCreated(dispute);
        break;
      }
      
      case 'checkout.completed': {
        // According to Creem docs: A checkout session was completed
        // Returns all information about payment and order
        console.log(`[WEBHOOK-${webhookId}] 🛒 Processing checkout.completed event`);
        console.log(`[WEBHOOK-${webhookId}] Payload structure:`, {
          hasOrder: !!payload?.order,
          hasProduct: !!payload?.product,
          hasCustomer: !!payload?.customer,
          hasSubscription: !!payload?.subscription,
          hasMetadata: !!payload?.metadata,
        });
        console.log(`[WEBHOOK-${webhookId}] Full payload for checkout.completed:`, JSON.stringify(payload, null, 2));
        
        try {
          const result = await handleCheckoutCompleted(payload);
          console.log(`[WEBHOOK-${webhookId}] ✅ checkout.completed processed successfully`);
          console.log(`[WEBHOOK-${webhookId}] Handler returned:`, result);
        } catch (error) {
          console.error(`[WEBHOOK-${webhookId}] ❌❌❌ CRITICAL ERROR processing checkout.completed:`, error);
          console.error(`[WEBHOOK-${webhookId}] Error details:`, {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : 'UnknownError'
          });
          // 不抛出错误，而是记录并继续，这样至少能看到错误日志
          // throw error;
        }
        break;
      }
      
      case 'payment.succeeded':
        // Legacy event type, may still be used
        await handlePaymentSucceeded(payload);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;
      
      case 'refund.created': {
        // According to Creem docs: A refund was created
        await handleRefundCreated(payload);
        break;
      }
      
      default:
        console.log(`[WEBHOOK-${webhookId}] ⚠️ Unhandled event type:`, eventType);
        console.log(`[WEBHOOK-${webhookId}] Full event data:`, JSON.stringify({ eventType, payload }, null, 2));
    }

    console.log(`[WEBHOOK-${webhookId}] ✅ Webhook processing completed successfully`);
    console.log(`[WEBHOOK-${webhookId}] ========================================`);
    
    // 🔥 在响应中包含调试信息，这样即使看不到日志也能知道发生了什么
    return NextResponse.json({ 
      received: true, 
      webhookId, 
      eventType,
      timestamp: new Date().toISOString(),
      debug: debugInfo.slice(-20), // 只返回最后20条调试信息
      note: 'Check Supabase database for payment and credit records'
    });

  } catch (error) {
    console.error(`[WEBHOOK-${webhookId}] ❌❌❌ WEBHOOK ERROR:`, error);
    console.error(`[WEBHOOK-${webhookId}] Error details:`, {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'UnknownError'
    });
    
    if (error instanceof WebhookProcessingError) {
      console.error(`[WEBHOOK-${webhookId}] WebhookProcessingError - Status: ${error.status}`);
      return NextResponse.json(
        { error: error.message, webhookId },
        { status: error.status }
      );
    }
    
    console.error(`[WEBHOOK-${webhookId}] Returning 500 error response`);
    return NextResponse.json(
      { error: 'Webhook processing failed', webhookId },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(data: any) {
  const { subscription_id, customer_id, plan_id, status, skipCredits = false } = data;
  const supabaseAdmin = getSupabaseAdmin();
  
  console.log('[WEBHOOK] Processing subscription.created:', {
    subscription_id,
    customer_id,
    plan_id,
    status,
    skipCredits
  });

  // 获取计划配置以确定积分数量
  const planConfig = plan_id
    ? (creemPlansById[plan_id] || Object.values(creemPlansById).find(p => p.productId === plan_id))
    : undefined;
  
  // 优先使用metadata中的credits，如果没有则使用planConfig中的credits
  const metadataCredits = data?.metadata?.credits;
  const parsedMetadataCredits = metadataCredits ? Number(metadataCredits) : 0;
  const creditAmount = parsedMetadataCredits > 0 
    ? parsedMetadataCredits 
    : (planConfig?.credits ?? 0);
  
  console.log('[WEBHOOK] Plan config:', planConfig ? { id: planConfig.id, name: planConfig.name, credits: planConfig.credits } : 'null');
  console.log('[WEBHOOK] Credit amount:', { 
    fromMetadata: parsedMetadataCredits, 
    fromPlanConfig: planConfig?.credits ?? 0, 
    final: creditAmount 
  });

  // 1. 创建或更新订阅记录（使用UPSERT）
  console.log('[WEBHOOK] Upserting subscription record...');
  const subscriptionIdColumn = await resolveSubscriptionIdColumn(supabaseAdmin);
  
  // 先检查是否已存在订阅记录
  const { data: existingSubscription } = await supabaseAdmin
    .from('user_subscriptions')
    .select('id')
    .eq('user_id', customer_id)
    .maybeSingle();

  let subscriptionData;
  let subscriptionError;

  if (existingSubscription) {
    // 更新现有订阅
    console.log('[WEBHOOK] Updating existing subscription record...');
    const updateData: any = {
      plan_status: status,
      plan_type: planConfig?.groupId || 'basic',
      current_period_start: data.current_period_start ? new Date(data.current_period_start) : null,
      current_period_end: data.current_period_end ? new Date(data.current_period_end) : null,
      updated_at: new Date().toISOString()
    };
    
    // 如果提供了subscription_id，更新它
    if (subscription_id) {
      updateData[subscriptionIdColumn] = subscription_id;
    }

    const result = await supabaseAdmin
      .from('user_subscriptions')
      .update(updateData)
      .eq('id', existingSubscription.id)
      .select()
      .single();
    
    subscriptionData = result.data;
    subscriptionError = result.error;
  } else {
    // 创建新订阅
    console.log('[WEBHOOK] Creating new subscription record...');
    const insertData: any = {
      user_id: customer_id,
      plan_status: status,
      plan_type: planConfig?.groupId || 'basic',
      current_period_start: data.current_period_start ? new Date(data.current_period_start) : null,
      current_period_end: data.current_period_end ? new Date(data.current_period_end) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    if (subscription_id) {
      insertData[subscriptionIdColumn] = subscription_id;
    }

    const result = await supabaseAdmin
      .from('user_subscriptions')
      .insert(insertData)
      .select()
      .single();
    
    subscriptionData = result.data;
    subscriptionError = result.error;
  }

  if (subscriptionError) {
    console.error('[WEBHOOK] Failed to upsert subscription:', subscriptionError);
    console.error('[WEBHOOK] Subscription error details:', {
      code: subscriptionError.code,
      message: subscriptionError.message,
      details: subscriptionError.details,
      hint: subscriptionError.hint
    });
    // 不抛出异常，记录错误但继续处理
    console.log('[WEBHOOK] Continuing despite subscription upsert error');
  } else {
    console.log('[WEBHOOK] Subscription upserted successfully:', subscriptionData);
  }

  // 2. 更新用户表的订阅信息
  const { data: userUpdateData, error: userUpdateError } = await supabaseAdmin
    .from('users')
    .update({
      subscription_plan: planConfig?.groupId || planConfig?.id || 'basic',
      subscription_status: status,
      subscription_end_date: data.current_period_end ? new Date(data.current_period_end) : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', customer_id)
    .select()
    .single();

  if (userUpdateError) {
    console.error('[WEBHOOK] Failed to update user subscription:', userUpdateError);
    // 不抛出异常，记录错误但继续处理
    console.log('[WEBHOOK] Continuing despite user update error');
  } else {
    console.log('[WEBHOOK] User updated:', userUpdateData);
  }

  // 3. 发放订阅积分（如果未跳过）
  console.log('[WEBHOOK] Credit activation check:', {
    skipCredits,
    creditAmount,
    willActivate: !skipCredits && creditAmount > 0
  });
  
  if (!skipCredits && creditAmount > 0) {
    try {
      // 避免重复发放：检查是否在短时间内（24小时）已经为该订阅发放过积分
      // 注意：如果用户升级订阅计划，应该允许加新计划的积分
      let alreadyCredited = false;
      if (subscription_id) {
        const { data: existingTx, error: txCheckError } = await supabaseAdmin
          .from('credit_transactions')
          .select('id, amount, metadata, created_at')
          .eq('user_id', customer_id)
          .eq('reason', 'subscription_created')
          .eq('metadata->>subscriptionId', subscription_id)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (txCheckError) {
          console.error('[WEBHOOK] Failed to check existing subscription credit transaction:', txCheckError);
        } else if (existingTx) {
          // 检查是否是相同的计划（通过 planId 或 credits 数量）
          const existingPlanId = existingTx.metadata?.planId;
          const existingCredits = existingTx.amount;
          
          // 如果是相同的计划且积分数量相同，则认为是重复
          if (existingPlanId === planConfig?.id && existingCredits === creditAmount) {
            alreadyCredited = true;
            console.log('[WEBHOOK] Duplicate subscription credit detected (same plan and amount), skipping', { 
              subscription_id, 
              userId: customer_id,
              planId: existingPlanId,
              credits: existingCredits
            });
          } else {
            // 如果是不同的计划或不同的积分数量，可能是升级/降级，允许加积分
            console.log('[WEBHOOK] Subscription plan changed or credits amount different, will credit new amount', {
              subscription_id,
              userId: customer_id,
              existingPlanId,
              newPlanId: planConfig?.id,
              existingCredits,
              newCredits: creditAmount
            });
          }
        }
      }

      if (alreadyCredited) {
        // 已跳过，不需要处理
      } else {
        console.log('[WEBHOOK] Crediting subscription:', {
          userId: customer_id,
          amount: creditAmount,
          planId: plan_id,
        });

        // 使用事务安全 RPC 发放积分
        console.log('[WEBHOOK] Attempting to credit subscription credits via RPC:', {
          userId: customer_id,
          amount: creditAmount,
          subscriptionId: subscription_id,
          planId: plan_id
        });

        let creditResult;
        let creditErr;
        
        // 首先尝试使用 p_bucket 参数（新版本函数）
        const rpcCall = await supabaseAdmin.rpc('credit_user_credits_transaction', {
          p_user_id: customer_id,
          p_amount: creditAmount,
          p_reason: 'subscription_created',
          p_metadata: {
            planId: planConfig?.id,
            planCategory: planConfig?.category,
            subscriptionId: subscription_id,
            source: 'webhook',
            eventType: 'subscription.created'
          },
          p_bucket: 'subscription'
        });
        
        creditResult = rpcCall.data;
        creditErr = rpcCall.error;

        // 如果失败且错误提示参数不匹配，尝试不带 p_bucket 参数（旧版本函数）
        if (creditErr) {
          const errorMessage = creditErr.message || String(creditErr);
          const isParameterError = errorMessage.includes('parameter') || 
                                   errorMessage.includes('does not exist') ||
                                   errorMessage.includes('unknown') ||
                                   creditErr.code === '42883' || // function does not exist
                                   creditErr.code === '42P01';   // undefined function
          
          if (isParameterError) {
            console.log('[WEBHOOK] RPC call with p_bucket failed, trying without p_bucket parameter...');
            const fallbackCall = await supabaseAdmin.rpc('credit_user_credits_transaction', {
              p_user_id: customer_id,
              p_amount: creditAmount,
              p_reason: 'subscription_created',
              p_metadata: {
                planId: planConfig?.id,
                planCategory: planConfig?.category,
                subscriptionId: subscription_id,
                source: 'webhook',
                eventType: 'subscription.created',
                bucket: 'subscription' // Store bucket in metadata instead
              }
            });
            
            creditResult = fallbackCall.data;
            creditErr = fallbackCall.error;
          }
        }

        if (creditErr) {
          console.error('[WEBHOOK] ❌ Failed to credit subscription via RPC:', {
            error: creditErr,
            code: creditErr.code,
            message: creditErr.message,
            details: creditErr.details,
            hint: creditErr.hint,
            userId: customer_id,
            amount: creditAmount,
            subscriptionId: subscription_id
          });
          // 不抛出异常，但记录详细错误以便排查
        } else {
          const snapshot = Array.isArray(creditResult) ? (creditResult as any[])[0] : null;
          console.log('[WEBHOOK] ✅ Subscription credits credited via RPC', {
            userId: customer_id,
            amount: creditAmount,
            subscriptionId: subscription_id,
            snapshot: snapshot ? {
              credits_balance: snapshot.credits_balance,
              credits_total: snapshot.credits_total,
              subscription_credits_balance: snapshot.subscription_credits_balance,
              flex_credits_balance: snapshot.flex_credits_balance
            } : null
          });
        }
      }
    } catch (error) {
      console.error('[WEBHOOK] Exception updating credits:', error);
      // 不抛出错误，避免影响订阅创建
    }
  }
}

async function handleSubscriptionUpdated(data: any) {
  const { subscription_id, status, current_period_start, current_period_end } = data;
  const supabaseAdmin = getSupabaseAdmin();
  const subscriptionIdColumn = await resolveSubscriptionIdColumn(supabaseAdmin);
  
  await supabaseAdmin
    .from('user_subscriptions')
    .update({
      plan_status: status,
      current_period_start: current_period_start ? new Date(current_period_start) : undefined,
      current_period_end: current_period_end ? new Date(current_period_end) : undefined,
      updated_at: new Date().toISOString()
    })
    .eq(subscriptionIdColumn, subscription_id);

  // Update user subscription status
  const { data: subscription } = await supabaseAdmin
    .from('user_subscriptions')
    .select('user_id')
    .eq(subscriptionIdColumn, subscription_id)
    .single();

  if (subscription) {
    await supabaseAdmin
      .from('users')
      .update({
        subscription_status: status,
        subscription_end_date: current_period_end ? new Date(current_period_end) : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.user_id);
  }
}

async function handleSubscriptionCanceled(data: any) {
  const { subscription_id } = data;
  const supabaseAdmin = getSupabaseAdmin();
  const subscriptionIdColumn = await resolveSubscriptionIdColumn(supabaseAdmin);
  
  // Get subscription details first
  const { data: subscription } = await supabaseAdmin
    .from('user_subscriptions')
    .select('user_id, current_period_end')
    .eq(subscriptionIdColumn, subscription_id)
    .single();

  if (!subscription) {
    console.error('[WEBHOOK] Subscription not found for cancellation:', subscription_id);
    return;
  }

  // Update subscription status
  await supabaseAdmin
    .from('user_subscriptions')
    .update({
      plan_status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq(subscriptionIdColumn, subscription_id);

  // Update user subscription status with end date
  await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'canceled',
      subscription_end_date: subscription.current_period_end || new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', subscription.user_id);

  console.log('[WEBHOOK] Subscription canceled successfully:', {
    subscription_id,
    user_id: subscription.user_id,
    end_date: subscription.current_period_end
  });
}

async function handlePaymentSucceeded(data: any) {
  console.log('[WEBHOOK] Processing payment.succeeded event');
  console.log('[WEBHOOK] Raw data received:', JSON.stringify(data, null, 2));
  
  const supabaseAdmin = getSupabaseAdmin();
  const subscriptionIdColumn = await resolveSubscriptionIdColumn(supabaseAdmin);
  
  const subscriptionId = data?.subscription_id ?? data?.subscriptionId ?? null;
  const paymentId = data?.payment_id ?? data?.id ?? null;
  const planId = data?.metadata?.planId ?? data?.plan_id ?? null;
  const customerId = data?.customer_id ?? data?.metadata?.customerId ?? null;
  const paymentMethod = data?.payment_method ?? data?.method ?? null;
  const amountRaw = data?.amount ?? null;
  const currency = (data?.currency ?? 'USD') as string;

  console.log('[WEBHOOK] Extracted fields:', {
    subscriptionId,
    paymentId,
    planId,
    customerId,
    paymentMethod,
    amountRaw,
    currency
  });

  let subscriptionRecord: { id: string; user_id: string } | null = null;

  if (subscriptionId) {
    const { data: subscription, error } = await supabaseAdmin
      .from('user_subscriptions')
      .select('id, user_id')
      .eq(subscriptionIdColumn, subscriptionId)
      .maybeSingle();

    if (error) {
      console.error('[Webhook] Failed to load subscription for payment.succeeded', error);
    }

    if (subscription) {
      subscriptionRecord = subscription;
    }
  }

  const userId = customerId ?? subscriptionRecord?.user_id ?? null;

  // 增强的用户匹配机制 - 支持多种邮箱匹配策略
  let finalUserId = userId;
  
  if (!finalUserId) {
    console.log('[WEBHOOK] Trying enhanced email matching for user...');
    
    // 尝试通过 customer_email 查找用户
    const customerEmail = data?.customer_email ?? data?.metadata?.customerEmail ?? null;
    
    if (customerEmail) {
      console.log('[WEBHOOK] Looking up user by email:', customerEmail);
      
      // 1. 精确匹配
      let { data: userByEmail, error: emailError } = await getSupabaseAdmin()
        .from('users')
        .select('id, email')
        .eq('email', customerEmail)
        .maybeSingle();
      
      if (emailError) {
        console.error('[WEBHOOK] Failed to lookup user by email:', emailError);
        await logEmailMatching(customerEmail, 'error', null, null, 'payment.succeeded', data);
      } else if (userByEmail) {
        finalUserId = userByEmail.id;
        console.log('[WEBHOOK] Found user by exact email match:', { email: customerEmail, userId: finalUserId });
        await logEmailMatching(customerEmail, 'exact', finalUserId, userByEmail.email, 'payment.succeeded', data);
      } else {
        // 2. 尝试忽略大小写的匹配
        console.log('[WEBHOOK] Trying case-insensitive email match...');
        const { data: userByEmailCI, error: emailCIError } = await getSupabaseAdmin()
          .from('users')
          .select('id, email')
          .ilike('email', customerEmail)
          .maybeSingle();
        
        if (emailCIError) {
          console.error('[WEBHOOK] Failed to lookup user by case-insensitive email:', emailCIError);
          await logEmailMatching(customerEmail, 'case_insensitive_error', null, null, 'payment.succeeded', data);
        } else if (userByEmailCI) {
          finalUserId = userByEmailCI.id;
          console.log('[WEBHOOK] Found user by case-insensitive email match:', { 
            searchedEmail: customerEmail, 
            foundEmail: userByEmailCI.email, 
            userId: finalUserId 
          });
          await logEmailMatching(customerEmail, 'case_insensitive', finalUserId, userByEmailCI.email, 'payment.succeeded', data);
        } else {
          // 3. 尝试通过邮箱别名表查找
          console.log('[WEBHOOK] Trying email alias lookup...');
          const { data: aliasUser, error: aliasError } = await getSupabaseAdmin()
            .from('user_email_aliases')
            .select('user_id, users!inner(id, email)')
            .eq('alias_email', customerEmail.toLowerCase().trim())
            .maybeSingle();
          
          if (aliasError) {
            console.error('[WEBHOOK] Failed to lookup user by email alias:', aliasError);
            await logEmailMatching(customerEmail, 'alias_error', null, null, 'payment.succeeded', data);
          } else if (aliasUser) {
            finalUserId = aliasUser.user_id;
            console.log('[WEBHOOK] Found user by email alias:', { 
              aliasEmail: customerEmail, 
              primaryEmail: (aliasUser.users as any).email, 
              userId: finalUserId 
            });
            await logEmailMatching(customerEmail, 'alias', finalUserId, (aliasUser.users as any).email, 'payment.succeeded', data);
          } else {
            console.log('[WEBHOOK] No user found with email:', customerEmail);
            await logEmailMatching(customerEmail, 'none', null, null, 'payment.succeeded', data);
            
            // 4. 记录未匹配的邮箱用于后续处理
            // 管理员可以通过 user_email_aliases 表添加邮箱映射
            await logUnmatchedEmail(customerEmail, data);
            console.log('[WEBHOOK] No user found with email:', customerEmail);
            console.log('[WEBHOOK] This might be a different email than the registered one.');
            console.log('[WEBHOOK] To resolve this, add an entry to user_email_aliases table mapping this email to the user.');
          }
        }
      }
    }
  }

  if (!finalUserId) {
    console.error('[WEBHOOK] payment.succeeded missing user reference', {
      subscriptionId,
      customerId,
      customerEmail: data?.customer_email ?? data?.metadata?.customerEmail ?? null,
      paymentId,
      rawData: data
    });
    console.error('[WEBHOOK] Cannot proceed without user ID - payment will not be recorded');
    return;
  }
  
  console.log('[WEBHOOK] Final user ID determined:', finalUserId);

  // 尝试多种方式查找 planConfig
  let planConfig = planId ? creemPlansById[planId] : undefined;
  
  // 如果通过 planId 找不到，尝试通过 productId 查找
  const productId = data?.product_id ?? data?.productId ?? data?.metadata?.productId;
  if (!planConfig && productId) {
    console.log('[WEBHOOK] Trying to find plan by productId:', productId);
    planConfig = Object.values(creemPlansById).find(plan => plan.productId === productId);
  }
  
  // 从 metadata 中获取 credits
  const creditsFromMetadata = 
    data?.metadata?.credits ?? 
    data?.metadata?.planCredits;
  const parsedCredits = typeof creditsFromMetadata === 'string' || typeof creditsFromMetadata === 'number'
    ? Number(creditsFromMetadata)
    : 0;
  
  // 确定积分数量：优先使用 metadata，其次使用 planConfig
  const creditAmount = parsedCredits > 0
    ? parsedCredits
    : planConfig?.credits ?? 0;

  console.log('[WEBHOOK] Credit calculation:', {
    planId,
    planConfig: planConfig ? { credits: planConfig.credits, category: planConfig.category } : null,
    creditsFromMetadata,
    parsedCredits,
    creditAmount
  });

  // If it's a subscription renewal (has subscriptionId and plan), reset subscription bucket; else credit flex for add-ons
  if (subscriptionId && planConfig?.credits) {
    // 订阅续费：重置订阅积分到新周期的积分（不累加，每个周期重置）
    console.log('[WEBHOOK] Processing subscription renewal - resetting subscription credits', {
      userId: finalUserId,
      subscriptionId,
      planId: planConfig.id,
      credits: planConfig.credits,
      planCategory: planConfig.category
    });
    
    try {
      // 先获取当前订阅积分余额，用于日志记录
      const { data: currentUser } = await getSupabaseAdmin()
        .from('users')
        .select('subscription_credits_balance, flex_credits_balance, credits_balance')
        .eq('id', finalUserId)
        .single();
      
      const previousSubscriptionCredits = currentUser?.subscription_credits_balance ?? 0;
      
      const { data: resetResult, error: resetError } = await getSupabaseAdmin().rpc('reset_subscription_credits_for_period', {
        p_user_id: finalUserId,
        p_period_credits: planConfig.credits,
        p_reason: 'subscription_period_reset',
        p_metadata: { 
          planId: planConfig.id, 
          planCategory: planConfig.category,
          subscriptionId, 
          paymentId, 
          source: 'webhook', 
          eventType: 'payment.succeeded',
          previousCredits: previousSubscriptionCredits
        },
      });
      
      if (resetError) {
        console.error('[Webhook] Failed to reset subscription credits on payment.succeeded', resetError);
      } else {
        const snapshot = Array.isArray(resetResult) ? (resetResult as any[])[0] : resetResult;
        console.log('[WEBHOOK] ✅ Subscription credits reset on payment.succeeded', { 
          userId: finalUserId, 
          planId: planConfig.id, 
          credits: planConfig.credits,
          previousCredits: previousSubscriptionCredits,
          newCredits: snapshot?.subscription_credits_balance,
          snapshot
        });
      }
    } catch (e) {
      console.error('[Webhook] Exception during subscription credits reset', e);
    }
  } else if (creditAmount > 0) {
    // Add-on / one-time credits -> credit to flex bucket with duplicate protection
    let alreadyCredited = false;

    if (paymentId) {
      const { data: existingTx, error: txError } = await getSupabaseAdmin()
        .from('credit_transactions')
        .select('id, amount, created_at')
        .eq('user_id', finalUserId)
        .eq('metadata->>paymentId', paymentId)
        .eq('reason', 'creem_payment')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (txError) {
        console.error('[Webhook] Failed to check existing credit transaction', txError);
        throw new WebhookProcessingError('Database error during duplicate check', 500, txError);
      }

      alreadyCredited = !!existingTx;
      if (alreadyCredited) {
        console.log('[WEBHOOK] Duplicate payment detected:', { paymentId, userId: finalUserId });
      }
    }

    if (!alreadyCredited) {
      try {
        const { data: creditData, error: creditError } = await getSupabaseAdmin().rpc('credit_user_credits_transaction', {
          p_user_id: finalUserId,
          p_amount: creditAmount,
          p_reason: 'creem_payment',
          p_metadata: { planId: planId ?? null, planCategory: planConfig?.category ?? data?.metadata?.planCategory ?? null, paymentId: paymentId ?? null, source: 'webhook', eventType: 'payment.succeeded' },
          p_bucket: 'flex',
        });
        if (creditError) {
          console.error('[Webhook] Failed to credit flex credits', creditError);
        } else {
          const row = Array.isArray(creditData) ? (creditData as any[])[0] : null;
          console.log('[WEBHOOK] Flex credits credited OK', { userId: finalUserId, amount: creditAmount, snapshot: row });
        }
      } catch (error) {
        console.error('[WEBHOOK] Exception crediting flex credits', error);
      }
    }
  } else {
    console.warn('[Webhook] No credit amount determined for payment.succeeded', { planId, paymentId });
  }

  const amount = typeof amountRaw === 'string' || typeof amountRaw === 'number'
    ? Math.round(Number(amountRaw))
    : null;

  // 确保所有支付都记录到payments表，即使没有paymentId
  const finalPaymentId = paymentId || `webhook_${finalUserId}_${Date.now()}`;
  
  const { data: existingPayment, error: paymentLookupError } = await getSupabaseAdmin()
    .from('payments')
    .select('id')
    .eq('creem_payment_id', finalPaymentId)
    .maybeSingle();

  if (paymentLookupError) {
    console.error('[Webhook] Failed to look up payment record', paymentLookupError);
    // 不直接返回，尝试继续插入支付记录（可能是新支付）
    console.log('[WEBHOOK] Will attempt to insert payment record despite lookup error');
  }

  if (existingPayment) {
    const { error: updateError } = await getSupabaseAdmin()
      .from('payments')
      .update({
        status: 'succeeded',
        amount: amount ?? undefined,
        currency,
        payment_method: paymentMethod ?? undefined,
      })
      .eq('id', existingPayment.id);

    if (updateError) {
      console.error('[Webhook] Failed to update payment record', updateError);
    } else {
      console.log('[WEBHOOK] Payment record updated:', { paymentId: finalPaymentId, amount, currency });
    }
  } else {
    const { error: insertError } = await getSupabaseAdmin()
      .from('payments')
      .insert({
        user_id: finalUserId,
        subscription_id: subscriptionRecord?.id ?? null,
        amount: amount ?? 0,
        currency,
        status: 'succeeded',
        payment_method: paymentMethod ?? null,
        creem_payment_id: finalPaymentId,
      });

    if (insertError) {
      console.error('[Webhook] Failed to insert payment record', insertError);
    } else {
      console.log('[WEBHOOK] Payment record created:', { 
        paymentId: finalPaymentId, 
        userId: finalUserId, 
        amount, 
        currency,
        subscriptionId: subscriptionRecord?.id 
      });
    }
  }
}

async function handleCheckoutCompleted(checkout: any) {
  const handlerId = `checkout_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  console.log(`[WEBHOOK-${handlerId}] ========================================`);
  console.log(`[WEBHOOK-${handlerId}] 🛒 Processing checkout.completed event`);
  console.log(`[WEBHOOK-${handlerId}] Timestamp: ${new Date().toISOString()}`);
  console.log(`[WEBHOOK-${handlerId}] Full checkout object:`, JSON.stringify(checkout, null, 2));
  
  const supabaseAdmin = getSupabaseAdmin();
  
  const order = checkout.order;
  const product = checkout.product;
  const customer = checkout.customer;
  const subscription = checkout.subscription;
  
  console.log(`[WEBHOOK-${handlerId}] Extracted data:`, {
    hasOrder: !!order,
    hasProduct: !!product,
    hasCustomer: !!customer,
    hasSubscription: !!subscription,
    orderType: order?.type,
    productId: product?.id,
    productName: product?.name,
    billingType: product?.billing_type,
    customerEmail: customer?.email,
    customerId: customer?.id,
  });
  
  if (!order || !product || !customer) {
    console.error(`[WEBHOOK-${handlerId}] ❌ Missing required data in checkout.completed`, {
      hasOrder: !!order,
      hasProduct: !!product,
      hasCustomer: !!customer,
    });
    return;
  }
  
  console.log(`[WEBHOOK-${handlerId}] 📋 Checkout details:`, {
    orderType: order.type,
    orderId: order.id,
    orderAmount: order.amount,
    orderCurrency: order.currency,
    orderTransaction: order.transaction,
    orderTransactionId: order.transaction_id ?? order.transaction?.id ?? null,
    productId: product.id,
    productName: product.name,
    billingType: product.billing_type,
    hasSubscription: !!subscription,
    subscriptionId: subscription?.id,
    customerEmail: customer.email,
    customerId: customer.id,
    customerName: customer.name,
  });
  
  // 如果是订阅产品，调用订阅处理函数
  if (product.billing_type === 'recurring' && subscription) {
    console.log(`[WEBHOOK-${handlerId}] 📅 This is a subscription product, calling handleSubscriptionCreated`);
    console.log(`[WEBHOOK-${handlerId}] Subscription details:`, {
      subscriptionId: subscription.id,
      status: subscription.status,
      customerEmail: customer.email
    });
    
    // 先查找用户
    console.log(`[WEBHOOK-${handlerId}] Looking up user for subscription...`);
    const userId = await findUserByEmail(customer.email);
    if (!userId) {
      console.error(`[WEBHOOK-${handlerId}] ❌ Cannot process subscription - user not found for email:`, customer.email);
      console.error(`[WEBHOOK-${handlerId}] ABORTING subscription processing`);
      return;
    }
    
    console.log(`[WEBHOOK-${handlerId}] ✅ User found for subscription:`, userId);
    
    // 获取 checkout metadata（包含 planId）
    const checkoutMetadata = checkout.metadata || {};
    const orderMetadata = order?.metadata || {};
    const productMetadata = product?.metadata || {};
    const subscriptionMetadata = subscription?.metadata || {};
    
    // 优先使用 metadata 中的 planId（兼容大小写和下划线风格）
    const extractPlanId = (...candidates: Array<Record<string, any>>) => {
      for (const source of candidates) {
        if (!source || typeof source !== 'object') continue;
        const maybe =
          source.planId ??
          source.plan_id ??
          source.planID ??
          source.plan ??
          source.PlanId ??
          source.PlanID ??
          source.PLAN_ID;
        if (typeof maybe === 'string' && maybe.trim()) {
          return maybe.trim();
        }
      }
      return undefined;
    };
    
    const planIdFromMetadata = extractPlanId(
      checkoutMetadata,
      orderMetadata,
      productMetadata,
      subscriptionMetadata
    );
    
    // 确定 plan_id：优先使用 metadata 中的 planId，其次使用 product.id
    // planId 是我们在 creemPlansById 中的 key（如 "basic_monthly"）
    // product.id 是 Creem 的产品ID，需要通过 productId 查找
    const plan_id = planIdFromMetadata || product.id;
    
    console.log('[WEBHOOK] Subscription checkout - plan identification:', {
      planIdFromMetadata,
      productId: product.id,
      finalPlanId: plan_id,
      checkoutMetadata: checkoutMetadata,
      subscriptionMetadata: subscriptionMetadata
    });
    
    await handleSubscriptionCreated({
      subscription_id: subscription.id,
      customer_id: userId, // 使用 Supabase 用户ID
      plan_id: plan_id, // 使用 metadata 中的 planId 或 product.id
      status: subscription.status,
      current_period_start: subscription.current_period_start_date,
      current_period_end: subscription.current_period_end_date,
      metadata: {
        ...subscriptionMetadata,
        ...checkoutMetadata,
        // 确保 credits 从 metadata 中传递
        credits: checkoutMetadata.credits ?? subscriptionMetadata.credits ?? orderMetadata.credits
      },
    });
    return;
  }
  
  // 查找用户（使用支持大小写不敏感的查找函数）
  console.log(`[WEBHOOK-${handlerId}] 🔍 Step 1: Looking up user by email:`, customer.email);
  const userId = await findUserByEmail(customer.email);
  
  if (!userId) {
    console.error(`[WEBHOOK-${handlerId}] ❌❌❌ CRITICAL: User not found for email:`, customer.email);
    console.error(`[WEBHOOK-${handlerId}] Searching for similar emails...`);
    
    // 尝试查找所有用户，看看是否有相似的邮箱
    const { data: allUsers, error: allUsersError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .limit(20);
    
    console.error(`[WEBHOOK-${handlerId}] Available users query result:`, {
      count: allUsers?.length || 0,
      error: allUsersError?.message,
      users: allUsers
    });
    
    // 尝试模糊匹配
    const emailLower = customer.email.toLowerCase();
    const similarUsers = allUsers?.filter(u => 
      u.email?.toLowerCase().includes(emailLower) || 
      emailLower.includes(u.email?.toLowerCase() || '')
    );
    if (similarUsers && similarUsers.length > 0) {
      console.error(`[WEBHOOK-${handlerId}] ⚠️ Found similar emails:`, similarUsers);
    }
    
    await logUnmatchedEmail(customer.email, checkout);
    console.error(`[WEBHOOK-${handlerId}] ❌ ABORTING: Cannot proceed without user ID`);
    console.error(`[WEBHOOK-${handlerId}] This means:`);
    console.error(`[WEBHOOK-${handlerId}]   1. Payment will NOT be recorded`);
    console.error(`[WEBHOOK-${handlerId}]   2. Credits will NOT be added`);
    console.error(`[WEBHOOK-${handlerId}]   3. User needs to register with email: ${customer.email}`);
    
    // 🔥 即使找不到用户，也返回结果，这样至少能看到错误
    return {
      success: false,
      handlerId,
      error: 'USER_NOT_FOUND',
      message: `User not found for email: ${customer.email}`,
      customerEmail: customer.email,
      finalSummary: {
        userFound: false,
        creditAmount: 0,
        creditsAdded: false,
        paymentRecorded: false
      }
    };
  }
  
  console.log(`[WEBHOOK-${handlerId}] ✅ Step 1: User found - ID: ${userId}`);
  
  // 获取用户详细信息（包括积分）
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, email, credits_balance, credits_total, flex_credits_balance, subscription_credits_balance')
    .eq('id', userId)
    .single();
  
  if (userError || !user) {
    console.error('[WEBHOOK] Failed to load user details:', userError);
    return;
  }
  
  console.log(`[WEBHOOK-${handlerId}] ✅ Step 2: User details loaded:`, {
    id: user.id,
    email: user.email,
    currentCredits: user.credits_balance,
    flexCredits: user.flex_credits_balance,
    subscriptionCredits: user.subscription_credits_balance,
    totalCredits: user.credits_total
  });
  
  // 根据产品ID查找计划配置
  // 注意：metadata 可能在 checkout.metadata、order.metadata 或 product.metadata 中
  const checkoutMetadata = checkout.metadata || {};
  const orderMetadata = order?.metadata || {};
  const productMetadata = product?.metadata || {};
  
  console.log(`[WEBHOOK-${handlerId}] 🔍 Step 3: Looking for plan config`);
  console.log(`[WEBHOOK-${handlerId}] Product ID from Creem:`, product.id);
  console.log(`[WEBHOOK-${handlerId}] Checkout metadata:`, JSON.stringify(checkoutMetadata, null, 2));
  console.log(`[WEBHOOK-${handlerId}] Order metadata:`, JSON.stringify(orderMetadata, null, 2));
  console.log(`[WEBHOOK-${handlerId}] Product metadata:`, JSON.stringify(productMetadata, null, 2));
  
  console.log(`[WEBHOOK-${handlerId}] Environment variables check:`, {
    NEXT_PUBLIC_CREEM_PACK_STARTER_ID: process.env.NEXT_PUBLIC_CREEM_PACK_STARTER_ID ? 'SET' : 'NOT SET',
    NEXT_PUBLIC_CREEM_PACK_CREATOR_ID: process.env.NEXT_PUBLIC_CREEM_PACK_CREATOR_ID ? 'SET' : 'NOT SET',
    NEXT_PUBLIC_CREEM_PACK_DEV_ID: process.env.NEXT_PUBLIC_CREEM_PACK_DEV_ID ? 'SET' : 'NOT SET',
  });
  
  console.log(`[WEBHOOK-${handlerId}] Available plans in creemPlansById:`, Object.values(creemPlansById).map(p => ({ 
    id: p.id, 
    productId: p.productId, 
    name: p.name,
    category: p.category,
    credits: p.credits
  })));
  
  // 尝试多种方式查找 planConfig
  let planConfig = Object.values(creemPlansById).find(plan => plan.productId === product.id);
  
  const extractPlanId = (...candidates: Array<Record<string, any>>) => {
    for (const source of candidates) {
      if (!source || typeof source !== 'object') continue;
      const maybe =
        source.planId ??
        source.plan_id ??
        source.plan ??
        source.planID ??
        source.PlanId ??
        source.PlanID ??
        source.PLAN_ID;
      if (typeof maybe === 'string' && maybe.trim()) {
        return maybe.trim();
      }
    }
    return undefined;
  };
  
  const planIdFromMetadata = extractPlanId(checkoutMetadata, orderMetadata, productMetadata);
  if (!planConfig && planIdFromMetadata) {
    console.log('[WEBHOOK] Trying to find plan by planId from metadata:', planIdFromMetadata);
    const normalizedPlanId = planIdFromMetadata.trim().toLowerCase();
    planConfig =
      creemPlansById[planIdFromMetadata] ||
      creemPlansById[normalizedPlanId as keyof typeof creemPlansById] ||
      Object.values(creemPlansById).find(plan => plan.id.toLowerCase() === normalizedPlanId);
  }
  
  // 如果仍然找不到，尝试通过产品名称模糊匹配
  if (!planConfig && typeof product?.name === 'string' && product.name.trim()) {
    const productName = product.name.trim().toLowerCase();
    planConfig = Object.values(creemPlansById).find((plan) => {
      const planName = plan.name.trim().toLowerCase();
      return planName === productName || planName.includes(productName) || productName.includes(planName);
    });
    if (planConfig) {
      console.log('[WEBHOOK] Fallback matched plan by product name:', {
        productName: product.name,
        planId: planConfig.id
      });
    }
  }
  
  console.log(`[WEBHOOK-${handlerId}] ${planConfig ? '✅' : '❌'} Step 3: Plan config ${planConfig ? 'found' : 'NOT FOUND'}:`, planConfig ? {
    id: planConfig.id,
    name: planConfig.name,
    credits: planConfig.credits,
    category: planConfig.category,
    productId: planConfig.productId
  } : 'null');
  
  // 确定积分数量：优先使用 planConfig，其次使用 metadata 中的 credits
  let creditAmount = 0;
  let planCategory: string | undefined;
  let planId: string | undefined;
  
  if (planConfig) {
    creditAmount = planConfig.credits;
    planCategory = planConfig.category;
    planId = planConfig.id;
  } else {
    // 如果找不到 planConfig，尝试从 metadata 中获取 credits（按优先级检查）
    const creditsFromMetadata = 
      checkoutMetadata.credits ?? 
      orderMetadata.credits ?? 
      productMetadata.credits ?? 
      checkoutMetadata.planCredits ?? 
      orderMetadata.planCredits ?? 
      productMetadata.planCredits;
    
    if (creditsFromMetadata) {
      const parsedCredits = typeof creditsFromMetadata === 'string' 
        ? parseInt(creditsFromMetadata, 10) 
        : Number(creditsFromMetadata);
      
      if (!isNaN(parsedCredits) && parsedCredits > 0) {
        creditAmount = parsedCredits;
        planCategory = checkoutMetadata.planCategory ?? orderMetadata.planCategory ?? productMetadata.planCategory ?? 'pack';
        planId = planIdFromMetadata ?? 'unknown';
        
        console.log(`[WEBHOOK-${handlerId}] ✅ Using credits from metadata:`, {
          creditAmount,
          planCategory,
          planId,
          source: 'metadata',
          creditsFromMetadata
        });
      } else {
        console.warn(`[WEBHOOK-${handlerId}] ⚠️ Credits from metadata is invalid:`, {
          creditsFromMetadata,
          parsedCredits,
          isValid: !isNaN(parsedCredits) && parsedCredits > 0
        });
      }
    } else {
      console.warn(`[WEBHOOK-${handlerId}] ⚠️ No credits found in metadata`);
    }
    
    if (creditAmount === 0) {
      console.error(`[WEBHOOK-${handlerId}] ❌❌❌ CRITICAL: creditAmount is 0!`);
      console.error(`[WEBHOOK-${handlerId}] Plan config not found and no credits in metadata for product:`, product.id);
      console.error(`[WEBHOOK-${handlerId}] This means the productId in creemPlansById does not match the webhook product.id`);
      console.error(`[WEBHOOK-${handlerId}] Please check environment variables NEXT_PUBLIC_CREEM_PACK_*_ID`);
      console.error(`[WEBHOOK-${handlerId}] Current environment variables:`, {
        NEXT_PUBLIC_CREEM_PACK_STARTER_ID: process.env.NEXT_PUBLIC_CREEM_PACK_STARTER_ID ? 'SET' : 'NOT SET',
        NEXT_PUBLIC_CREEM_PACK_CREATOR_ID: process.env.NEXT_PUBLIC_CREEM_PACK_CREATOR_ID ? 'SET' : 'NOT SET',
        NEXT_PUBLIC_CREEM_PACK_DEV_ID: process.env.NEXT_PUBLIC_CREEM_PACK_DEV_ID ? 'SET' : 'NOT SET',
      });
      console.error(`[WEBHOOK-${handlerId}] Checkout metadata:`, JSON.stringify(checkoutMetadata, null, 2));
      console.error(`[WEBHOOK-${handlerId}] Order metadata:`, JSON.stringify(orderMetadata, null, 2));
      console.error(`[WEBHOOK-${handlerId}] Product metadata:`, JSON.stringify(productMetadata, null, 2));
      console.error(`[WEBHOOK-${handlerId}] Product ID from Creem:`, product.id);
      console.error(`[WEBHOOK-${handlerId}] Available productIds in creemPlansById:`, Object.values(creemPlansById).map(p => p.productId));
      // 不再直接返回，而是继续处理，creditAmount 为 0 时会在后面跳过加积分
    }
  }
  
  console.log(`[WEBHOOK-${handlerId}] 📊 Step 3 Result:`, {
    planConfigFound: !!planConfig,
    creditAmount,
    planId,
    planCategory,
    source: planConfig ? 'planConfig' : (creditAmount > 0 ? 'metadata' : 'none')
  });
  // 🔥 详细的 paymentId 查找逻辑
  console.log(`[WEBHOOK-${handlerId}] 🔍 Searching for paymentId in order object:`, {
    'order.transaction_id': order.transaction_id,
    'order.transactionId': order.transactionId,
    'order.transaction': order.transaction,
    'order.transaction?.id': order.transaction?.id,
    'order.metadata?.transaction_id': order.metadata?.transaction_id,
    'order.metadata?.paymentId': order.metadata?.paymentId,
    'order.metadata?.transactionId': order.metadata?.transactionId,
    'order.id': order.id,
    'order object keys': Object.keys(order || {}),
  });

  const paymentId =
    order.transaction_id ??
    order.transactionId ??
    (typeof order.transaction === 'string' ? order.transaction : order.transaction?.id) ??
    order.metadata?.transaction_id ??
    order.metadata?.paymentId ??
    order.metadata?.transactionId ??
    order.id; // fall back to order id so payments table still records something

  console.log(`[WEBHOOK-${handlerId}] 🔍 PaymentId resolved:`, {
    paymentId,
    paymentIdType: typeof paymentId,
    paymentIdLength: paymentId?.length,
    source: paymentId === order.transaction_id ? 'order.transaction_id' :
            paymentId === order.transactionId ? 'order.transactionId' :
            paymentId === order.transaction ? 'order.transaction (string)' :
            paymentId === order.transaction?.id ? 'order.transaction.id' :
            paymentId === order.metadata?.transaction_id ? 'order.metadata.transaction_id' :
            paymentId === order.metadata?.paymentId ? 'order.metadata.paymentId' :
            paymentId === order.metadata?.transactionId ? 'order.metadata.transactionId' :
            paymentId === order.id ? 'order.id (fallback)' : 'unknown'
  });

  console.log(`[WEBHOOK-${handlerId}] 📊 Step 4: Final details before processing:`, {
    userId: user.id,
    email: customer.email,
    productId: product.id,
    productName: product.name,
    creditAmount,
    paymentId,
    amount: order.amount,
    currency: order.currency,
    planId: planId,
    planCategory: planCategory,
    foundViaMetadata: !planConfig
  });
  
  // 检查是否已经处理过这个支付
  console.log(`[WEBHOOK-${handlerId}] 🔍 Step 5: Checking for duplicate payment`);
  let alreadyCredited = false;
  
  if (paymentId) {
    console.log(`[WEBHOOK-${handlerId}] Checking credit_transactions for paymentId:`, paymentId);
    const { data: existingTx, error: txError } = await supabaseAdmin
      .from('credit_transactions')
      .select('id, amount, created_at, metadata')
      .eq('user_id', user.id)
      .eq('metadata->>paymentId', paymentId)
      .eq('reason', 'creem_payment')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle();
    
    if (txError) {
      console.error(`[WEBHOOK-${handlerId}] ❌ Failed to check existing credit transaction:`, txError);
    } else {
      alreadyCredited = !!existingTx;
      if (alreadyCredited) {
        console.log(`[WEBHOOK-${handlerId}] ⚠️ Duplicate payment detected:`, { 
          paymentId, 
          userId: user.id,
          existingTxId: existingTx.id,
          existingTxAmount: existingTx.amount,
          existingTxCreatedAt: existingTx.created_at
        });
      } else {
        console.log(`[WEBHOOK-${handlerId}] ✅ No duplicate found - proceeding with credit`);
      }
    }
  } else {
    console.warn(`[WEBHOOK-${handlerId}] ⚠️ No payment identifier resolved from checkout payload - cannot check for duplicates`);
  }
  
  console.log(`[WEBHOOK-${handlerId}] 🔍 Step 6: Credit decision:`, {
    alreadyCredited,
    creditAmount,
    willCredit: !alreadyCredited && creditAmount > 0
  });
  
  if (!alreadyCredited && creditAmount > 0) {
    console.log(`[WEBHOOK-${handlerId}] 💰 Step 6: Attempting to credit flex credits via RPC:`, {
      userId: user.id,
      amount: creditAmount,
      reason: 'creem_payment',
      paymentId: paymentId,
      planId: planId,
      planCategory: planCategory
    });

    try {
      console.log(`[WEBHOOK-${handlerId}] Calling RPC: credit_user_credits_transaction with params:`, {
        p_user_id: user.id,
        p_amount: creditAmount,
        p_reason: 'creem_payment',
        p_bucket: 'flex',
        p_metadata: {
          planId: planId ?? planConfig?.id ?? 'unknown',
          planCategory: planCategory ?? planConfig?.category ?? 'pack',
          paymentId: paymentId ?? null,
          source: 'webhook',
          eventType: 'checkout.completed',
          productId: product.id,
          productName: product.name,
          foundViaMetadata: !planConfig
        }
      });
      
      // 🔍 关键检查 2: 确认参数和 Supabase 权限
      console.log(`[WEBHOOK-${handlerId}] 🔍 Pre-RPC Check:`, {
        userId: user.id,
        userIdType: typeof user.id,
        userIdLength: user.id?.length,
        creditAmount,
        creditAmountType: typeof creditAmount,
        paymentId,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30),
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        serviceRoleKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) || 'NOT SET',
      });
      
      // 🔥 测试 Supabase 权限 - 验证 service_role key 是否真的能绕过 RLS
      console.log(`[WEBHOOK-${handlerId}] 🔥 Testing Supabase permissions...`);
      try {
        // 测试 1: 直接更新 users 表
        const { data: testUpdate, error: testUpdateError } = await supabaseAdmin
          .from('users')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', user.id)
          .select('id, updated_at')
          .single();
        
        console.log(`[WEBHOOK-${handlerId}] 🔥 Test 1 - Direct users table update:`, {
          success: !testUpdateError,
          error: testUpdateError?.message,
          errorCode: testUpdateError?.code,
          errorDetails: testUpdateError?.details,
          updatedRows: testUpdate ? 1 : 0,
          isRLSError: testUpdateError?.message?.includes('row-level security') || testUpdateError?.message?.includes('RLS')
        });
        
        // 测试 2: 插入 credit_transactions 表
        const { data: testInsert, error: testInsertError } = await supabaseAdmin
          .from('credit_transactions')
          .insert({
            user_id: user.id,
            amount: 1, // 测试用 1 积分
            reason: 'test_permission_check',
            metadata: { test: true, handlerId }
          })
          .select('id')
          .single();
        
        console.log(`[WEBHOOK-${handlerId}] 🔥 Test 2 - Direct credit_transactions insert:`, {
          success: !testInsertError,
          error: testInsertError?.message,
          errorCode: testInsertError?.code,
          errorDetails: testInsertError?.details,
          insertedId: testInsert?.id,
          isRLSError: testInsertError?.message?.includes('row-level security') || testInsertError?.message?.includes('RLS')
        });
        
        // 如果测试插入成功，立即删除（避免污染数据）
        if (testInsert?.id) {
          await supabaseAdmin
            .from('credit_transactions')
            .delete()
            .eq('id', testInsert.id);
          console.log(`[WEBHOOK-${handlerId}] 🔥 Test record cleaned up`);
        }
        
        // 如果发现 RLS 错误，这是严重问题
        if (testUpdateError?.message?.includes('row-level security') || 
            testUpdateError?.message?.includes('RLS') ||
            testInsertError?.message?.includes('row-level security') || 
            testInsertError?.message?.includes('RLS')) {
          console.error(`[WEBHOOK-${handlerId}] ❌❌❌ RLS POLICY ISSUE DETECTED!`);
          console.error(`[WEBHOOK-${handlerId}] Service role key is NOT bypassing RLS!`);
          console.error(`[WEBHOOK-${handlerId}] This means either:`);
          console.error(`[WEBHOOK-${handlerId}]   1. SUPABASE_SERVICE_ROLE_KEY is not set correctly`);
          console.error(`[WEBHOOK-${handlerId}]   2. The key is actually an anon key, not service_role key`);
          console.error(`[WEBHOOK-${handlerId}]   3. RLS policies are blocking even service_role`);
        }
      } catch (permTestError) {
        console.error(`[WEBHOOK-${handlerId}] 🔥 Permission test failed:`, permTestError);
      }
      
      const rpcParams = {
        p_user_id: user.id,
        p_amount: creditAmount,
        p_reason: 'creem_payment',
        p_metadata: {
          planId: planId ?? planConfig?.id ?? 'unknown',
          planCategory: planCategory ?? planConfig?.category ?? 'pack',
          paymentId: paymentId ?? null,
          source: 'webhook',
          eventType: 'checkout.completed',
          productId: product.id,
          productName: product.name,
          foundViaMetadata: !planConfig
        },
        p_bucket: 'flex'
      };
      
      console.log(`[WEBHOOK-${handlerId}] 🔍 Calling RPC with params:`, JSON.stringify(rpcParams, null, 2));
      
      const rpcStartTime = Date.now();
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('credit_user_credits_transaction', rpcParams);
      const rpcDuration = Date.now() - rpcStartTime;
      
      console.log(`[WEBHOOK-${handlerId}] 🔍 RPC Call Result (${rpcDuration}ms):`, {
        hasData: !!rpcData,
        hasError: !!rpcError,
        dataType: Array.isArray(rpcData) ? 'array' : typeof rpcData,
        dataLength: Array.isArray(rpcData) ? rpcData.length : 'N/A',
        errorCode: rpcError?.code,
        errorMessage: rpcError?.message,
        errorDetails: rpcError?.details,
        errorHint: rpcError?.hint,
      });

      if (rpcError) {
        console.error(`[WEBHOOK-${handlerId}] ❌❌❌ CRITICAL: Failed to credit flex credits via RPC:`, {
          error: rpcError,
          code: rpcError.code,
          message: rpcError.message,
          details: rpcError.details,
          hint: rpcError.hint,
          userId: user.id,
          amount: creditAmount,
          rpcParams: JSON.stringify(rpcParams, null, 2),
        });
        
        // 尝试直接更新 users 表来验证权限
        console.log(`[WEBHOOK-${handlerId}] 🔍 Testing direct users table update to verify permissions...`);
        const { data: testUpdate, error: testError } = await supabaseAdmin
          .from('users')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', user.id)
          .select('id')
          .single();
        
        console.log(`[WEBHOOK-${handlerId}] 🔍 Direct update test result:`, {
          success: !testError,
          error: testError?.message,
          updatedRows: testUpdate ? 1 : 0
        });
      } else {
        const row = Array.isArray(rpcData) ? (rpcData as any[])[0] : null;
        console.log(`[WEBHOOK-${handlerId}] ✅✅✅ Step 6: Flex credits credited via RPC!`, { 
          userId: user.id, 
          amount: creditAmount,
          snapshot: row,
          newBalance: row?.credits_balance,
          newFlexBalance: row?.flex_credits_balance,
          newTotal: row?.credits_total
        });
        
        // 验证积分确实被加上了
        const { data: verifyUser } = await supabaseAdmin
          .from('users')
          .select('credits_balance, flex_credits_balance, credits_total')
          .eq('id', user.id)
          .single();
        
        console.log(`[WEBHOOK-${handlerId}] ✅ Verification - User credits after RPC:`, verifyUser);
      }
    } catch (error) {
      console.error(`[WEBHOOK-${handlerId}] ❌ Exception crediting flex credits via RPC:`, error);
      console.error(`[WEBHOOK-${handlerId}] Exception details:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: user.id,
        amount: creditAmount
      });
    }
  } else {
    console.log(`[WEBHOOK-${handlerId}] ⚠️ Skipping credit:`, {
      alreadyCredited,
      creditAmount,
      userId: user.id,
      reason: alreadyCredited ? 'Already credited' : creditAmount === 0 ? 'Credit amount is 0' : 'Unknown'
    });
  }
  
  // 记录支付信息
  console.log(`[WEBHOOK-${handlerId}] 💳 Step 7: Recording payment information`);
  console.log(`[WEBHOOK-${handlerId}] 🔍 PaymentId check:`, {
    paymentId,
    isTruthy: !!paymentId,
    type: typeof paymentId,
    value: paymentId,
    orderId: order.id,
    willRecord: !!paymentId
  });
  
  // 🔥 修复：确保总是记录支付，即使 paymentId 是 order.id
  const finalPaymentId = paymentId || order.id;
  
  if (finalPaymentId) {
    console.log(`[WEBHOOK-${handlerId}] Checking for existing payment record with creem_payment_id:`, finalPaymentId);
    const { data: existingPayment, error: paymentLookupError } = await supabaseAdmin
      .from('payments')
      .select('id, status, amount, created_at')
      .eq('creem_payment_id', finalPaymentId)
      .maybeSingle();
    
    if (paymentLookupError) {
      console.error(`[WEBHOOK-${handlerId}] ❌ Failed to look up payment record:`, paymentLookupError);
    } else if (existingPayment) {
      console.log(`[WEBHOOK-${handlerId}] ℹ️ Payment record already exists:`, {
        id: existingPayment.id,
        status: existingPayment.status,
        amount: existingPayment.amount,
        createdAt: existingPayment.created_at
      });
    } else {
      console.log(`[WEBHOOK-${handlerId}] Creating new payment record...`);
      const paymentData = {
        user_id: user.id,
        subscription_id: null, // 一次性包没有订阅ID
        amount: order.amount,
        currency: order.currency,
        status: 'succeeded',
        payment_method: 'creem',
        creem_payment_id: finalPaymentId,
      };
      
      console.log(`[WEBHOOK-${handlerId}] 🔍 Using paymentId:`, {
        finalPaymentId,
        originalPaymentId: paymentId,
        isOrderId: finalPaymentId === order.id,
        note: finalPaymentId === order.id ? 'Using order.id as payment identifier' : 'Using transaction ID'
      });
      console.log(`[WEBHOOK-${handlerId}] Payment data to insert:`, paymentData);
      
      console.log(`[WEBHOOK-${handlerId}] 🔍 Attempting to insert payment record...`);
      console.log(`[WEBHOOK-${handlerId}] 🔍 Payment data:`, JSON.stringify(paymentData, null, 2));
      
      const insertStartTime = Date.now();
      const { data: insertedPayment, error: insertError } = await supabaseAdmin
        .from('payments')
        .insert(paymentData)
        .select()
        .single();
      const insertDuration = Date.now() - insertStartTime;
      
      console.log(`[WEBHOOK-${handlerId}] 🔍 Payment insert result (${insertDuration}ms):`, {
        hasData: !!insertedPayment,
        hasError: !!insertError,
        insertedId: insertedPayment?.id,
        errorCode: insertError?.code,
        errorMessage: insertError?.message,
        errorDetails: insertError?.details,
        errorHint: insertError?.hint,
      });
      
      if (insertError) {
        console.error(`[WEBHOOK-${handlerId}] ❌❌❌ CRITICAL: Failed to insert payment record:`, {
          error: insertError,
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          paymentData: JSON.stringify(paymentData, null, 2),
        });
        
        // 检查是否是权限问题
        if (insertError.message?.includes('row-level security') || insertError.message?.includes('RLS')) {
          console.error(`[WEBHOOK-${handlerId}] ⚠️⚠️⚠️ RLS POLICY ISSUE DETECTED!`);
          console.error(`[WEBHOOK-${handlerId}] This means the service_role key might not be working correctly`);
        }
      } else {
        console.log(`[WEBHOOK-${handlerId}] ✅✅✅ Step 7: Payment record created successfully:`, { 
          paymentId: finalPaymentId, 
          userId: user.id,
          insertedId: insertedPayment.id,
          amount: insertedPayment.amount,
          status: insertedPayment.status,
          creemPaymentId: insertedPayment.creem_payment_id
        });
        
        // 验证记录确实存在
        const { data: verifyPayment } = await supabaseAdmin
          .from('payments')
          .select('id, status, created_at')
          .eq('id', insertedPayment.id)
          .single();
        
        console.log(`[WEBHOOK-${handlerId}] 🔍 Payment record verification:`, {
          found: !!verifyPayment,
          id: verifyPayment?.id,
          status: verifyPayment?.status
        });
      }
    }
  } else {
    console.warn(`[WEBHOOK-${handlerId}] ⚠️ No payment identifier resolved from checkout payload - cannot record payment`);
  }
  
  // 最终总结
  console.log(`[WEBHOOK-${handlerId}] ========================================`);
  console.log(`[WEBHOOK-${handlerId}] 📊 FINAL SUMMARY:`);
  console.log(`[WEBHOOK-${handlerId}]   - User found: ${user ? 'YES' : 'NO'} (ID: ${user?.id})`);
  console.log(`[WEBHOOK-${handlerId}]   - Plan config found: ${planConfig ? 'YES' : 'NO'} (ID: ${planConfig?.id || 'N/A'})`);
  console.log(`[WEBHOOK-${handlerId}]   - Credit amount: ${creditAmount}`);
  console.log(`[WEBHOOK-${handlerId}]   - Already credited: ${alreadyCredited}`);
  console.log(`[WEBHOOK-${handlerId}]   - Credits added: ${!alreadyCredited && creditAmount > 0 ? 'YES' : 'NO'}`);
  console.log(`[WEBHOOK-${handlerId}]   - Payment recorded: ${paymentId ? 'CHECK PAYMENTS TABLE' : 'NO paymentId'}`);
  console.log(`[WEBHOOK-${handlerId}] ========================================`);
  console.log(`[WEBHOOK-${handlerId}] ✅ Checkout.completed processing completed`);
  
  // 如果 creditAmount 为 0，这是一个严重问题，需要特别标记
  if (creditAmount === 0) {
    console.error(`[WEBHOOK-${handlerId}] ⚠️⚠️⚠️ WARNING: creditAmount is 0! Credits will NOT be added!`);
    console.error(`[WEBHOOK-${handlerId}] This means either:`);
    console.error(`[WEBHOOK-${handlerId}]   1. Plan config not found AND metadata has no credits`);
    console.error(`[WEBHOOK-${handlerId}]   2. Plan config found but credits is 0`);
    console.error(`[WEBHOOK-${handlerId}] Check the logs above to see why creditAmount is 0`);
  }
  
  // 返回处理结果，用于调试
  const finalResult = {
    success: true,
    handlerId,
    userId: user?.id,
    creditAmount,
    paymentRecorded: !!finalPaymentId,
    finalSummary: {
      userFound: !!user,
      planConfigFound: !!planConfig,
      creditAmount,
      creditsAdded: !alreadyCredited && creditAmount > 0,
      paymentRecorded: !!finalPaymentId,
      paymentId: finalPaymentId,
      paymentIdSource: finalPaymentId === order.transaction_id ? 'order.transaction_id' :
                      finalPaymentId === order.id ? 'order.id' : 'other'
    }
  };
  
  console.log(`[WEBHOOK-${handlerId}] 📊 Final result:`, JSON.stringify(finalResult, null, 2));
  
  return finalResult;
}

async function handlePaymentFailed(data: any) {
  const subscriptionId = data?.subscription_id ?? data?.subscriptionId ?? null;
  const paymentId = data?.payment_id ?? data?.id ?? null;
  const amountRaw = data?.amount ?? null;
  const currency = (data?.currency ?? 'USD') as string;
  const supabaseAdmin = getSupabaseAdmin();
  const subscriptionIdColumn = await resolveSubscriptionIdColumn(supabaseAdmin);

  if (!subscriptionId) {
    console.warn('[Webhook] payment.failed missing subscription_id');
    return;
  }

  const { data: subscription, error } = await supabaseAdmin
    .from('user_subscriptions')
    .select('id, user_id')
    .eq(subscriptionIdColumn, subscriptionId)
    .maybeSingle();

  if (error) {
    console.error('[Webhook] Failed to load subscription for payment.failed', error);
    return;
  }

  if (!subscription) {
    console.warn('[Webhook] payment.failed subscription not found', { subscriptionId });
    return;
  }

  const amount = typeof amountRaw === 'string' || typeof amountRaw === 'number'
    ? Math.round(Number(amountRaw))
    : null;

  const { data: existingPayment } = await supabaseAdmin
    .from('payments')
    .select('id')
    .eq('creem_payment_id', paymentId)
    .maybeSingle();

  if (existingPayment) {
    const { error: updateError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'failed',
        amount: amount ?? undefined,
        currency,
      })
      .eq('id', existingPayment.id);

    if (updateError) {
      console.error('[Webhook] Failed to update failed payment record', updateError);
    }
    return;
  }

      const { error: insertError } = await supabaseAdmin
    .from('payments')
    .insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      amount: amount ?? 0,
      currency,
      status: 'failed',
      creem_payment_id: paymentId,
    });

  if (insertError) {
    console.error('[Webhook] Failed to record failed payment', insertError);
  }

  // Optionally suspend subscription after multiple failures
  // This would require additional logic to track failure count
}

async function handleRefundCreated(data: any) {
  console.log('[WEBHOOK] Processing refund.created event');
  
  const { payment_id, amount, status } = data;
  
  if (!payment_id) {
    console.error('[WEBHOOK] Missing payment_id in refund.created event');
    return;
  }

  // Update payment status to refunded
  const { error: updateError } = await getSupabaseAdmin()
    .from('payments')
    .update({
      status: status === 'partial' ? 'partially_refunded' : 'refunded',
      refund_amount: amount,
      updated_at: new Date().toISOString()
    })
    .eq('creem_payment_id', payment_id);

  if (updateError) {
    console.error('[WEBHOOK] Failed to update payment status for refund:', updateError);
  } else {
    console.log('[WEBHOOK] Updated payment status to refunded for payment:', payment_id);
  }
}

async function handleSubscriptionExpired(data: any) {
  const { subscription_id } = data;
  const supabaseAdmin = getSupabaseAdmin();
  const subscriptionIdColumn = await resolveSubscriptionIdColumn(supabaseAdmin);

  console.log('[WEBHOOK] Processing subscription.expired:', subscription_id);
  
  // Get subscription details first
  const { data: subscription } = await supabaseAdmin
    .from('user_subscriptions')
    .select('user_id, current_period_end')
    .eq(subscriptionIdColumn, subscription_id)
    .single();

  if (!subscription) {
    console.error('[WEBHOOK] Subscription not found for expiration:', subscription_id);
    return;
  }

  // Update subscription status to expired
  await supabaseAdmin
    .from('user_subscriptions')
    .update({
      plan_status: 'expired',
      updated_at: new Date().toISOString()
    })
    .eq(subscriptionIdColumn, subscription_id);

  // Update user subscription status
  await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'expired',
      subscription_end_date: subscription.current_period_end || new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', subscription.user_id);

  console.log('[WEBHOOK] Subscription expired successfully:', {
    subscription_id,
    user_id: subscription.user_id,
    end_date: subscription.current_period_end
  });
}

async function handleDisputeCreated(data: any) {
  console.log('[WEBHOOK] Processing dispute.created event');
  
  const { id, payment_id, amount, reason, status } = data;
  
  if (!payment_id) {
    console.error('[WEBHOOK] Missing payment_id in dispute.created event');
    return;
  }

  // Log dispute for manual review
  const { error: insertError } = await getSupabaseAdmin()
    .from('payment_disputes')
    .insert({
      creem_dispute_id: id,
      creem_payment_id: payment_id,
      amount: amount,
      reason: reason,
      status: status,
      created_at: new Date().toISOString()
    });

  if (insertError) {
    console.error('[WEBHOOK] Failed to log dispute:', insertError);
  } else {
    console.log('[WEBHOOK] Dispute logged for review:', { disputeId: id, paymentId: payment_id });
  }
}
