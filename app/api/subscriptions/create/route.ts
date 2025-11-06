import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createSubscription, subscriptionPlans } from '@/lib/creem-payment';
import { createServerClient } from '@supabase/ssr';
import { rateLimit, apiRateLimiter } from '@/lib/rate-limiter';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await rateLimit(request, apiRateLimiter);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Get authenticated user from session
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
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      console.error('[API ERROR] Subscription authentication failed:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = authUser.id;
    const { planId, billingCycle } = await request.json();

    if (!planId || !billingCycle) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log(`[API] Create subscription - userId: ${userId}, planId: ${planId}, billingCycle: ${billingCycle}`);

    // Get user data
    const { data: user, error: userError } = await getSupabaseAdmin()
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error(`[API ERROR] User not found for subscription - userId: ${userId}:`, userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get plan details
    const plan = subscriptionPlans[planId];
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    const priceInfo = plan[billingCycle as 'monthly' | 'yearly'];
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/plans?canceled=true`;

    // Create subscription with Creem Payment
    // 使用实际的 Creem 产品 ID
    const subscription = await createSubscription({
      customerId: userId,
      customerEmail: user.email,
      planId: priceInfo.productId, // 使用计划中的 Creem 产品 ID
      billingCycle: billingCycle,
      successUrl: successUrl,
      cancelUrl: cancelUrl,
    });

    // Store subscription in database
    const { data: subscriptionData, error: subError } = await getSupabaseAdmin()
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_type: planId,
        plan_status: 'pending',
        subscription_id: subscription.id,
        customer_id: userId,
      })
      .select()
      .single();

    if (subError) {
      console.error(`[API ERROR] Subscription DB insert failed - userId: ${userId}:`, subError);
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    console.log(`[API] Subscription created successfully - userId: ${userId}, subscriptionId: ${subscriptionData.id}`);

    return NextResponse.json({
      success: true,
      checkout_url: subscription.checkoutUrl,
      subscription_id: subscriptionData.id,
    });

  } catch (error) {
    console.error('[API ERROR] Subscription creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
