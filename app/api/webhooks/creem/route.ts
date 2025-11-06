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

export async function POST(request: NextRequest) {
  try {
    console.log('[WEBHOOK] Starting webhook processing...');
    const body = await request.text();
    console.log('[WEBHOOK] Received webhook request', {
      headers: sanitizeHeaders(request.headers),
      bodyLength: body.length,
    });
    
    // 检查 Creem 使用的签名头名称（文档指定为 creem-signature）
    const signature = request.headers.get('creem-signature');
    console.log('[WEBHOOK] Signature header:', signature ? 'present' : 'missing');
    console.log('[WEBHOOK] All headers:', Object.fromEntries(request.headers.entries()));

    // 验证Webhook签名（根据Creem文档要求）
    if (!verifyWebhookSignature(body, signature)) {
      console.error('[WEBHOOK] Invalid signature - rejecting webhook');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }
    
    console.log('[WEBHOOK] Signature verified successfully');

    console.log('[WEBHOOK] Parsing event body...');
    const event = JSON.parse(body);
    console.log('[WEBHOOK] Event parsed successfully');
    
    // Normalize event type and payload shape from Creem
    // According to Creem docs: events have "eventType" field and "object" payload
    const eventType = event?.eventType || event?.type || event?.event_type || 'unknown';
    const payload = event?.object || event?.data || null;
    const eventId = event?.id || null;
    const createdAt = event?.created_at || null;
    
    console.log('[WEBHOOK] Event type:', eventType);
    console.log('[WEBHOOK] Event ID:', eventId);
    console.log('[WEBHOOK] Event created_at:', createdAt);

    console.log('[WEBHOOK] Received webhook event:', eventType);
    console.log('[WEBHOOK] Event has payload:', !!payload);
    console.log('[WEBHOOK] Event summary:', summarizeEventForLog({ type: eventType, data: payload }));

    switch (eventType) {
      case 'subscription.active': {
        // According to Creem docs: Use only for synchronization
        // We encourage using subscription.paid for activating access
        console.log('[WEBHOOK] Processing subscription.active event (sync only)...');
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
          
          // Only sync subscription data, don't activate credits here
          // Credits should be activated via subscription.paid event
          await handleSubscriptionCreated({
            subscription_id: sub?.id,
            customer_id: userId,
            plan_id: sub?.product?.id,
            status: sub?.status ?? 'active',
            current_period_start: sub?.current_period_start_date ?? sub?.current_period_start ?? null,
            current_period_end: sub?.current_period_end_date ?? sub?.current_period_end ?? null,
            skipCredits: true, // Skip credit activation for sync event
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
          
          // Activate subscription and credits
          await handleSubscriptionCreated({
            subscription_id: sub?.id,
            customer_id: userId,
            plan_id: sub?.product?.id,
            status: sub?.status ?? 'active',
            current_period_start: sub?.current_period_start_date ?? sub?.current_period_start ?? null,
            current_period_end: sub?.current_period_end_date ?? sub?.current_period_end ?? null,
            skipCredits: false, // Activate credits for paid event
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
              planId: sub?.product?.id,
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
            await handleSubscriptionCreated({
              subscription_id: sub?.id,
              customer_id: userId,
              plan_id: sub?.product?.id,
              status: 'trialing',
              current_period_start: sub?.current_period_start_date ?? sub?.current_period_start ?? null,
              current_period_end: sub?.current_period_end_date ?? sub?.current_period_end ?? null,
              skipCredits: false, // Activate trial credits
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
        await handleCheckoutCompleted(payload);
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
        console.log('Unhandled event type:', eventType);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    if (error instanceof WebhookProcessingError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: 'Webhook processing failed' },
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
  const creditAmount = planConfig?.credits ?? 0;
  
  console.log('[WEBHOOK] Plan config:', planConfig ? { id: planConfig.id, name: planConfig.name, credits: planConfig.credits } : 'null');

  // 1. 创建订阅记录
  console.log('[WEBHOOK] Creating subscription record...');
  const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
    .from('user_subscriptions')
    .insert({
      user_id: customer_id,
      plan_status: status,
      plan_type: planConfig?.groupId || 'basic',
      current_period_start: data.current_period_start ? new Date(data.current_period_start) : null,
      current_period_end: data.current_period_end ? new Date(data.current_period_end) : null,
      creem_subscription_id: subscription_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (subscriptionError) {
    console.error('[WEBHOOK] Failed to create subscription:', subscriptionError);
    console.error('[WEBHOOK] Subscription error details:', {
      code: subscriptionError.code,
      message: subscriptionError.message,
      details: subscriptionError.details,
      hint: subscriptionError.hint
    });
    // 不抛出异常，记录错误但继续处理
    console.log('[WEBHOOK] Continuing despite subscription creation error');
  } else {
    console.log('[WEBHOOK] Subscription created successfully:', subscriptionData);
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
  if (!skipCredits && creditAmount > 0) {
    try {
      // 避免重复发放：若该订阅已记录过发放，则跳过
      let alreadyCredited = false;
      if (subscription_id) {
        const { data: existingTx, error: txCheckError } = await supabaseAdmin
          .from('credit_transactions')
          .select('id')
          .eq('user_id', customer_id)
          .eq('reason', 'subscription_created')
          .eq('metadata->>subscriptionId', subscription_id)
          .maybeSingle();

        if (txCheckError) {
          console.error('[WEBHOOK] Failed to check existing subscription credit transaction:', txCheckError);
        }
        alreadyCredited = !!existingTx;
      }

      if (alreadyCredited) {
        console.log('[WEBHOOK] Duplicate subscription credit detected, skipping', { subscription_id, userId: customer_id });
      } else {
        console.log('[WEBHOOK] Crediting subscription:', {
          userId: customer_id,
          amount: creditAmount,
          planId: plan_id,
        });

        // 使用事务安全 RPC 发放积分
        const { data: creditResult, error: creditErr } = await supabaseAdmin.rpc('credit_user_credits_transaction', {
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

        if (creditErr) {
          console.error('[WEBHOOK] Failed to credit subscription via RPC:', creditErr);
        } else {
          const snapshot = Array.isArray(creditResult) ? (creditResult as any[])[0] : null;
          console.log('[WEBHOOK] ✅ Subscription credits credited via RPC', {
            userId: customer_id,
            amount: creditAmount,
            snapshot
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
            await logUnmatchedEmail(customerEmail, data);
             console.log('[WEBHOOK] No user found with email:', customerEmail);
             console.log('[WEBHOOK] This might be a different email than the registered one.');
             
             // 临时手动映射已知的邮箱对应关系
             const emailMapping: Record<string, string> = {
               'panzhaoning@outlook.com': '582767446@qq.com'
             };
             
             const mappedEmail = emailMapping[customerEmail.toLowerCase()];
             if (mappedEmail) {
               console.log('[WEBHOOK] Found email mapping:', { from: customerEmail, to: mappedEmail });
               
               const { data: mappedUser, error: mappedError } = await getSupabaseAdmin()
                 .from('users')
                 .select('id, email')
                 .eq('email', mappedEmail)
                 .maybeSingle();
               
               if (mappedError) {
                 console.error('[WEBHOOK] Failed to lookup mapped user:', mappedError);
               } else if (mappedUser) {
                 finalUserId = mappedUser.id;
                 console.log('[WEBHOOK] Found user by email mapping:', { 
                   purchaseEmail: customerEmail, 
                   registeredEmail: mappedEmail, 
                   userId: finalUserId 
                 });
               } else {
                 console.log('[WEBHOOK] Mapped email not found in database:', mappedEmail);
               }
             } else {
               console.log('[WEBHOOK] No email mapping found for:', customerEmail);
               console.log('[WEBHOOK] Please check if user registered with a different email address.');
             }
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

  const planConfig = planId ? creemPlansById[planId] : undefined;
  const creditsFromMetadata = data?.metadata?.credits;
  const parsedCredits = typeof creditsFromMetadata === 'string' || typeof creditsFromMetadata === 'number'
    ? Number(creditsFromMetadata)
    : 0;
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
    try {
      const { error: resetError } = await getSupabaseAdmin().rpc('reset_subscription_credits_for_period', {
        p_user_id: finalUserId,
        p_period_credits: planConfig.credits,
        p_reason: 'subscription_period_reset',
        p_metadata: { planId, subscriptionId, paymentId, source: 'webhook', eventType: 'payment.succeeded' },
      });
      if (resetError) {
        console.error('[Webhook] Failed to reset subscription credits on payment.succeeded', resetError);
      } else {
        console.log('[Webhook] Subscription credits reset on payment.succeeded', { userId: finalUserId, planId, credits: planConfig.credits });
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
    return;
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
  console.log('[WEBHOOK] Processing checkout.completed event');
  const supabaseAdmin = getSupabaseAdmin();
  
  const order = checkout.order;
  const product = checkout.product;
  const customer = checkout.customer;
  const subscription = checkout.subscription;
  
  if (!order || !product || !customer) {
    console.error('[WEBHOOK] Missing required data in checkout.completed');
    return;
  }
  
  console.log('[WEBHOOK] Checkout details:', {
    orderType: order.type,
    productId: product.id,
    productName: product.name,
    billingType: product.billing_type,
    hasSubscription: !!subscription,
    customerEmail: customer.email
  });
  
  // 如果是订阅产品，调用订阅处理函数
  if (product.billing_type === 'recurring' && subscription) {
    console.log('[WEBHOOK] This is a subscription product, calling handleSubscriptionCreated');
    
    // 先查找用户
    const userId = await findUserByEmail(customer.email);
    if (!userId) {
      console.error('[WEBHOOK] Cannot process subscription - user not found for email:', customer.email);
      return;
    }
    
    await handleSubscriptionCreated({
      subscription_id: subscription.id,
      customer_id: userId, // 使用 Supabase 用户ID
      plan_id: product.id,
      status: subscription.status,
      current_period_start: subscription.current_period_start_date,
      current_period_end: subscription.current_period_end_date
    });
    return;
  }
  
  // 查找用户
  console.log('[WEBHOOK] Looking up user by email:', customer.email);
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, email, credits_balance, credits_total')
    .eq('email', customer.email)
    .maybeSingle();
  
  if (userError) {
    console.error('[WEBHOOK] Failed to lookup user by email:', userError);
    return;
  }
  
  if (!user) {
    console.error('[WEBHOOK] User not found for email:', customer.email);
    console.error('[WEBHOOK] Available users in database:');
    const { data: allUsers } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .limit(10);
    console.error('[WEBHOOK] Sample users:', allUsers);
    return;
  }
  
  console.log('[WEBHOOK] User found:', {
    id: user.id,
    email: user.email,
    currentCredits: user.credits_balance,
    totalCredits: user.credits_total
  });
  
  // 根据产品ID查找计划配置
  console.log('[WEBHOOK] Looking for plan config with productId:', product.id);
  console.log('[WEBHOOK] Environment variables check:');
  console.log('[WEBHOOK] NEXT_PUBLIC_CREEM_PACK_STARTER_ID:', process.env.NEXT_PUBLIC_CREEM_PACK_STARTER_ID);
  console.log('[WEBHOOK] NEXT_PUBLIC_CREEM_PACK_CREATOR_ID:', process.env.NEXT_PUBLIC_CREEM_PACK_CREATOR_ID);
  console.log('[WEBHOOK] NEXT_PUBLIC_CREEM_PACK_DEV_ID:', process.env.NEXT_PUBLIC_CREEM_PACK_DEV_ID);
  
  console.log('[WEBHOOK] Available plans:', Object.values(creemPlansById).map(p => ({ 
    id: p.id, 
    productId: p.productId, 
    name: p.name,
    category: p.category 
  })));
  
  const planConfig = Object.values(creemPlansById).find(plan => plan.productId === product.id);
  
  console.log('[WEBHOOK] Plan config found:', planConfig ? {
    id: planConfig.id,
    name: planConfig.name,
    credits: planConfig.credits,
    category: planConfig.category
  } : 'null');
  
  if (!planConfig) {
    console.error('[WEBHOOK] Plan config not found for product:', product.id);
    console.error('[WEBHOOK] This means the productId in creemPlansById does not match the webhook product.id');
    console.error('[WEBHOOK] Please check environment variables NEXT_PUBLIC_CREEM_PACK_*_ID');
    console.error('[WEBHOOK] Current environment variables:');
    console.error('[WEBHOOK] NEXT_PUBLIC_CREEM_PACK_STARTER_ID:', process.env.NEXT_PUBLIC_CREEM_PACK_STARTER_ID);
    console.error('[WEBHOOK] NEXT_PUBLIC_CREEM_PACK_CREATOR_ID:', process.env.NEXT_PUBLIC_CREEM_PACK_CREATOR_ID);
    console.error('[WEBHOOK] NEXT_PUBLIC_CREEM_PACK_DEV_ID:', process.env.NEXT_PUBLIC_CREEM_PACK_DEV_ID);
    return;
  }
  
  const creditAmount = planConfig.credits;
  const paymentId = order.transaction;
  
  console.log('[WEBHOOK] Checkout completed details:', {
    userId: user.id,
    email: customer.email,
    productId: product.id,
    productName: product.name,
    creditAmount,
    paymentId,
    amount: order.amount,
    currency: order.currency
  });
  
  // 检查是否已经处理过这个支付
  let alreadyCredited = false;
  
  if (paymentId) {
    const { data: existingTx, error: txError } = await supabaseAdmin
      .from('credit_transactions')
      .select('id, amount, created_at')
      .eq('user_id', user.id)
      .eq('metadata->>paymentId', paymentId)
      .eq('reason', 'creem_payment')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle();
    
    if (txError) {
      console.error('[WEBHOOK] Failed to check existing credit transaction:', txError);
    } else {
      alreadyCredited = !!existingTx;
      if (alreadyCredited) {
        console.log('[WEBHOOK] Duplicate payment detected:', { paymentId, userId: user.id });
      }
    }
  }
  
  if (!alreadyCredited && creditAmount > 0) {
    console.log('[WEBHOOK] Attempting to credit flex credits via RPC:', {
      userId: user.id,
      amount: creditAmount,
      reason: 'creem_payment',
      paymentId: paymentId
    });

    try {
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('credit_user_credits_transaction', {
        p_user_id: user.id,
        p_amount: creditAmount,
        p_reason: 'creem_payment',
        p_metadata: {
          planId: planConfig.id,
          planCategory: planConfig.category,
          paymentId: paymentId ?? null,
          source: 'webhook',
          eventType: 'checkout.completed',
          productId: product.id,
          productName: product.name
        },
        p_bucket: 'flex'
      });

      if (rpcError) {
        console.error('[WEBHOOK] Failed to credit flex credits via RPC:', rpcError);
      } else {
        const row = Array.isArray(rpcData) ? (rpcData as any[])[0] : null;
        console.log('[WEBHOOK] ✅ Flex credits credited via RPC!', { userId: user.id, amount: creditAmount, snapshot: row });
      }
    } catch (error) {
      console.error('[WEBHOOK] Exception crediting flex credits via RPC:', error);
      console.error('[WEBHOOK] Exception details:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: user.id,
        amount: creditAmount
      });
    }
  } else {
    console.log('[WEBHOOK] Skipping credit:', {
      alreadyCredited,
      creditAmount,
      userId: user.id
    });
  }
  
  // 记录支付信息
  if (paymentId) {
    const { data: existingPayment, error: paymentLookupError } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('creem_payment_id', paymentId)
      .maybeSingle();
    
    if (paymentLookupError) {
      console.error('[WEBHOOK] Failed to look up payment record:', paymentLookupError);
    } else if (!existingPayment) {
      const { error: insertError } = await supabaseAdmin
        .from('payments')
        .insert({
          user_id: user.id,
          subscription_id: null, // 一次性包没有订阅ID
          amount: order.amount,
          currency: order.currency,
          status: 'succeeded',
          payment_method: 'creem',
          creem_payment_id: paymentId,
        });
      
      if (insertError) {
        console.error('[WEBHOOK] Failed to insert payment record:', insertError);
      } else {
        console.log('[WEBHOOK] Payment record created:', { paymentId, userId: user.id });
      }
    }
  }
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
