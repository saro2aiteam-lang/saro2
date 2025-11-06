import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit, apiRateLimiter } from '@/lib/rate-limiter';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await rateLimit(request, apiRateLimiter);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Get authenticated user
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
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Get all subscriptions for the user
    const { data: subscriptions, error: subscriptionsError } = await getSupabaseAdmin()
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (subscriptionsError) {
      console.error(`[API ERROR] Get subscriptions failed - userId: ${userId}:`, subscriptionsError);
      return NextResponse.json(
        { error: 'Failed to load subscriptions' },
        { status: 500 }
      );
    }

    // Map to response format
    const mappedSubscriptions = (subscriptions || []).map(sub => ({
      id: sub.id,
      planType: sub.plan_type || 'free',
      planStatus: sub.plan_status || 'inactive',
      subscriptionId: sub.creem_subscription_id || sub.subscription_id || null,
      currentPeriodStart: sub.current_period_start,
      currentPeriodEnd: sub.current_period_end,
      createdAt: sub.created_at,
      updatedAt: sub.updated_at,
    }));

    return NextResponse.json({
      subscriptions: mappedSubscriptions,
      count: mappedSubscriptions.length
    });

  } catch (error) {
    console.error('[API ERROR] Get subscriptions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

