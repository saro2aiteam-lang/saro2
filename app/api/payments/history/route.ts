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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get payments with subscription info
    const { data: payments, error: paymentsError } = await getSupabaseAdmin()
      .from('payments')
      .select(`
        *,
        user_subscriptions (
          id,
          plan_type,
          plan_status
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (paymentsError) {
      console.error(`[API ERROR] Get payment history failed - userId: ${userId}:`, paymentsError);
      return NextResponse.json(
        { error: 'Failed to load payment history' },
        { status: 500 }
      );
    }

    // Map to response format
    const mappedPayments = (payments || []).map(payment => ({
      id: payment.id,
      amount: payment.amount || 0,
      currency: payment.currency || 'USD',
      status: payment.status || 'pending',
      paymentMethod: payment.payment_method || 'unknown',
      creemPaymentId: payment.creem_payment_id || null,
      subscription: payment.user_subscriptions ? {
        id: payment.user_subscriptions.id,
        planType: payment.user_subscriptions.plan_type,
        planStatus: payment.user_subscriptions.plan_status,
      } : null,
      createdAt: payment.created_at,
    }));

    // Get total count for pagination
    const { count, error: countError } = await getSupabaseAdmin()
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return NextResponse.json({
      payments: mappedPayments,
      count: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + limit
    });

  } catch (error) {
    console.error('[API ERROR] Get payment history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

