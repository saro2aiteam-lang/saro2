import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { userId, reason = 'manual_cleanup' } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 调用数据库函数清理过期订阅积分
    const { data, error } = await getSupabaseAdmin().rpc(
      'cleanup_expired_subscription_credits',
      {
        p_user_id: userId,
        p_reason: reason
      }
    );

    if (error) {
      console.error('[API ERROR] Failed to cleanup subscription credits:', error);
      return NextResponse.json(
        { error: 'Failed to cleanup subscription credits' },
        { status: 500 }
      );
    }

    console.log('[API] Subscription credits cleaned up successfully:', {
      userId,
      reason,
      result: data
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription credits cleaned up successfully',
      data: data?.[0] || null
    });

  } catch (error) {
    console.error('[API ERROR] Cleanup subscription credits error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 批量清理所有过期订阅
export async function PUT(request: NextRequest) {
  try {
    const { reason = 'batch_cleanup' } = await request.json();

    // 调用数据库函数批量清理
    const { data, error } = await getSupabaseAdmin().rpc(
      'cleanup_all_expired_subscriptions'
    );

    if (error) {
      console.error('[API ERROR] Failed to cleanup all expired subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to cleanup expired subscriptions' },
        { status: 500 }
      );
    }

    const result = data?.[0];
    console.log('[API] Batch cleanup completed:', {
      reason,
      processed_users: result?.processed_users || 0,
      total_cleaned_credits: result?.total_cleaned_credits || 0
    });

    return NextResponse.json({
      success: true,
      message: 'Batch cleanup completed successfully',
      processed_users: result?.processed_users || 0,
      total_cleaned_credits: result?.total_cleaned_credits || 0
    });

  } catch (error) {
    console.error('[API ERROR] Batch cleanup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
