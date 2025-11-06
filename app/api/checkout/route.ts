import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createCheckoutForProduct } from '@/lib/creem-payment';
import { creemPlansById } from '@/config/creemPlans';

export const runtime = 'nodejs';

const normalizeBaseUrl = (value?: string | null) => {
  if (!value || value.length === 0) {
    return 'http://localhost:3000';
  }
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

export async function POST(request: NextRequest) {
  const debug: Record<string, unknown> = { stage: 'init' };
  const debugParam = request.nextUrl.searchParams.get('debug');
  const debugMode = debugParam === '1' || (debugParam ?? '').toLowerCase() === 'true';
  try {
    const body = await request.json().catch(() => ({}));
    const planId = body?.planId as string | undefined;
    debug.planId = planId;

    if (!planId) {
      return NextResponse.json({ error: 'Missing planId' }, { status: 400 });
    }

    const plan = creemPlansById[planId];
    debug.hasPlan = !!plan;
    debug.usingCheckoutUrl = !!plan?.checkoutUrl;
    debug.hasProductId = !!plan?.productId;

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[API] checkout auth error', authError);
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    debug.userId = user?.id ?? null;

    const { data: userData, error: userError } = await getSupabaseAdmin()
      .from('users')
      .select('id, email')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error('[API] checkout user lookup error', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin);
    debug.baseUrl = baseUrl;
    debug.vercelEnv = process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown';
    debug.hasCreemApiKey = !!process.env.CREEM_API_KEY;
    debug.creemApiKeyPrefix = process.env.CREEM_API_KEY?.substring(0, 20) || 'not set';
    debug.productId = plan.productId;

    // 检查必需的配置
    if (!process.env.CREEM_API_KEY) {
      console.error('[API] CREEM_API_KEY not configured');
      return NextResponse.json(
        debugMode
          ? { error: 'Creem API key not configured', debug }
          : { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    if (!plan.productId) {
      console.error('[API] Plan missing productId', { planId: plan.id });
      return NextResponse.json(
        debugMode
          ? { error: 'Plan productId not configured', debug }
          : { error: 'Plan not configured for checkout' },
        { status: 500 }
      );
    }

    // Prefer creating checkout via productId to attach success/cancel + metadata
    if (plan.productId) {
      const successUrl = `${baseUrl}/api/pay/callback/creem?plan=${plan.id}`;
      const cancelUrl = `${baseUrl}/plans?checkout=cancelled&plan=${plan.id}`;

      debug.successUrl = successUrl;
      debug.cancelUrl = cancelUrl;
      debug.productId = plan.productId;
      debug.customerId = userData.id;

      try {
        // 生成唯一的 request_id 用于跟踪支付
        const requestId = `checkout_${userData.id}_${plan.id}_${Date.now()}`;
        
        const checkout = await createCheckoutForProduct({
          productId: plan.productId,
          customerId: userData.id,
          customerEmail: userData.email,
          successUrl,
          cancelUrl,
          requestId, // 添加 request_id 用于跟踪
          metadata: {
            planId: plan.id,
            planCategory: plan.category,
            credits: plan.credits,
            customerId: userData.id,
            customerEmail: userData.email,
            requestId, // 也在 metadata 中包含
          },
        });

        debug.checkoutResult = checkout;

        if (!checkout.checkoutUrl) {
          throw new Error('Creem checkout URL not returned');
        }
        return NextResponse.json({ checkoutUrl: checkout.checkoutUrl });
      } catch (creemError) {
        const errorMessage = creemError instanceof Error ? creemError.message : String(creemError);
        const errorName = creemError instanceof Error ? creemError.name : 'UnknownError';
        
        debug.creemError = {
          message: errorMessage,
          name: errorName,
          stack: creemError instanceof Error ? creemError.stack : undefined
        };
        
        // 记录详细错误日志
        console.error('[API] Creem checkout failed:', {
          planId: plan.id,
          productId: plan.productId,
          hasApiKey: !!process.env.CREEM_API_KEY,
          apiKeyPrefix: process.env.CREEM_API_KEY?.substring(0, 20),
          error: errorMessage,
          errorName,
          debug
        });
        
        // In debug mode, also return the raw error for inspection
        if (debugMode) {
          return NextResponse.json({
            error: 'Creem checkout failed',
            debug: {
              ...debug,
              rawError: creemError
            }
          }, { status: 500 });
        }
        
        // 返回错误信息而不是抛出，避免被外层 catch 捕获
        return NextResponse.json(
          debugMode
            ? {
                error: 'Creem checkout failed',
                message: errorMessage,
                debug: {
                  ...debug,
                  rawError: creemError instanceof Error ? {
                    message: creemError.message,
                    name: creemError.name,
                    stack: creemError.stack
                  } : String(creemError)
                }
              }
            : {
                error: 'Failed to create payment link',
                message: errorMessage.includes('安全错误') 
                  ? 'Payment service configuration error. Please contact support.'
                  : errorMessage.includes('API key')
                  ? 'Payment service not configured'
                  : 'Failed to create checkout session'
              },
          { status: 500 }
        );
      }
    }

    // Fallback: if plan only has a static checkoutUrl, return it
    if (plan.checkoutUrl && plan.checkoutUrl.length > 0) {
      return NextResponse.json({ checkoutUrl: plan.checkoutUrl });
    }

    console.error(`[API] Plan ${planId} is missing productId and checkoutUrl`, {
      planId,
      usingCheckoutUrl: !!plan.checkoutUrl,
      hasProductId: !!plan.productId,
    });
    return NextResponse.json({ error: 'Plan is not configured for checkout' }, { status: 500 });
  } catch (error) {
    console.error('[API ERROR] checkout failed', {
      error: error instanceof Error ? { message: error.message, name: error.name } : String(error),
      debug,
    });
    return NextResponse.json(
      debugMode
        ? { error: 'Failed to create checkout session', debug }
        : { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}


