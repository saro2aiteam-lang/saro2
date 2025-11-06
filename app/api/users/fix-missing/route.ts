import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 使用 admin client 来绕过 RLS
    const adminClient = getSupabaseAdmin();

    // 获取 auth 用户信息
    const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(userId);

    if (authError || !authUser.user) {
      return NextResponse.json(
        { error: 'User not found in auth' },
        { status: 404 }
      );
    }

    // 检查 users 表中是否存在记录
    const { data: existingUser } = await adminClient
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    // 如果不存在，创建记录
    if (!existingUser) {
      const { data: newUser, error: createError } = await adminClient
        .from('users')
        .insert({
          id: userId,
          email: authUser.user.email,
          full_name: authUser.user.user_metadata?.full_name || authUser.user.email || '',
          subscription_plan: 'free',
          subscription_status: 'active',
          credits_balance: 3,
          credits_total: 3,
          credits_spent: 0,
          credits_limit: 50,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user record:', createError);
        return NextResponse.json(
          { error: 'Failed to create user record', details: createError },
          { status: 500 }
        );
      }

      console.log('✅ User record created:', newUser.id);
    }

    // 检查并创建 user_subscriptions 记录
    const { data: existingSub } = await adminClient
      .from('user_subscriptions')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (!existingSub) {
      const { error: subError } = await adminClient
        .from('user_subscriptions')
        .insert({ user_id: userId });

      if (subError) {
        console.error('Error creating subscription record:', subError);
        // 不返回错误，因为这不是关键操作
      } else {
        console.log('✅ Subscription record created');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User record fixed successfully'
    });

  } catch (error) {
    console.error('Error in fix-missing endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

