import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 验证必需的环境变量
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required Supabase environment variables');
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// 积分退还 API - 用于处理生成失败的情况
export async function POST(request: NextRequest) {
  try {
    // 1. 验证环境变量
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // 2. 获取请求数据
    const body = await request.json();
    const { generation_id, reason = 'generation_failed' } = body;

    if (!generation_id) {
      return NextResponse.json(
        { error: 'Generation ID is required' },
        { status: 400 }
      );
    }

    // 2. 获取用户信息
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // 3. 查找原始交易记录
    const { data: transaction, error: transactionError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('metadata->>generation_id', generation_id)
      .eq('reason', 'video_generation')
      .eq('transaction_type', 'debit')
      .single();

    if (transactionError || !transaction) {
      return NextResponse.json(
        { error: 'Original transaction not found' },
        { status: 404 }
      );
    }

    // 4. 检查是否已经退还过
    const { data: refundExists } = await supabase
      .from('credit_transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('metadata->>refund_for', generation_id)
      .eq('reason', 'generation_refund')
      .single();

    if (refundExists) {
      return NextResponse.json(
        { error: 'Credits already refunded for this generation' },
        { status: 400 }
      );
    }

    const refundAmount = Math.abs(transaction.amount);

    // 5. 获取用户当前积分信息
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits_balance, credits_spent')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // 6. 退还积分
    const { error: refundError } = await supabase
      .from('users')
      .update({
        credits_balance: userData.credits_balance + refundAmount,
        credits_spent: userData.credits_spent - refundAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (refundError) {
      console.error('Failed to refund credits:', refundError);
      return NextResponse.json(
        { error: 'Failed to refund credits' },
        { status: 500 }
      );
    }

    // 6. 记录退还交易
    const { error: refundTransactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        amount: refundAmount,
        transaction_type: 'credit',
        reason: 'generation_refund',
        metadata: {
          refund_for: generation_id,
          original_transaction_id: transaction.id,
          refund_reason: reason,
          refunded_at: new Date().toISOString()
        }
      });

    if (refundTransactionError) {
      console.error('Failed to record refund transaction:', refundTransactionError);
      // 注意：积分已退还，但交易记录失败
    }

    // 7. 更新原始交易状态
    const { error: updateError } = await supabase
      .from('credit_transactions')
      .update({
        metadata: {
          ...transaction.metadata,
          status: 'refunded',
          refunded_at: new Date().toISOString(),
          refund_reason: reason
        }
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Failed to update original transaction:', updateError);
    }

    // 8. 返回结果
    return NextResponse.json({
      success: true,
      refunded_amount: refundAmount,
      generation_id,
      message: 'Credits successfully refunded'
    });

  } catch (error) {
    console.error('Refund API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
