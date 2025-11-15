import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

// 测试 Supabase 写入权限
export async function GET(request: NextRequest) {
  const testId = `test_${Date.now()}`;
  const results: any = {
    testId,
    timestamp: new Date().toISOString(),
    steps: []
  };
  
  try {
    // Step 1: 创建 Supabase 客户端
    results.steps.push({ step: '1', action: 'Creating Supabase admin client' });
    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
      results.steps.push({ step: '1', status: 'success', message: 'Client created' });
    } catch (error) {
      results.steps.push({ 
        step: '1', 
        status: 'error', 
        error: error instanceof Error ? error.message : String(error) 
      });
      return NextResponse.json(results, { status: 500 });
    }
    
    // Step 2: 测试查询 users 表
    results.steps.push({ step: '2', action: 'Testing read from users table' });
    const { data: testUsers, error: readError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .limit(1);
    
    if (readError) {
      results.steps.push({ 
        step: '2', 
        status: 'error', 
        error: readError.message,
        code: readError.code,
        details: readError.details
      });
    } else {
      results.steps.push({ 
        step: '2', 
        status: 'success', 
        message: `Can read users table, found ${testUsers?.length || 0} users` 
      });
    }
    
    // Step 3: 测试插入 payments 表
    results.steps.push({ step: '3', action: 'Testing insert into payments table' });
    const testPaymentData = {
      user_id: testUsers?.[0]?.id || '00000000-0000-0000-0000-000000000000', // 使用测试用户ID或占位符
      subscription_id: null,
      payment_id: `test_payment_${testId}`, // 🔥 添加 payment_id 字段
      amount: 1,
      currency: 'USD',
      status: 'succeeded',
      payment_method: 'test',
      creem_payment_id: `test_${testId}`,
    };
    
    const { data: insertedPayment, error: insertError } = await supabaseAdmin
      .from('payments')
      .insert(testPaymentData)
      .select()
      .single();
    
    if (insertError) {
      results.steps.push({ 
        step: '3', 
        status: 'error', 
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        isRLSError: insertError.message?.includes('row-level security') || insertError.message?.includes('RLS')
      });
    } else {
      results.steps.push({ 
        step: '3', 
        status: 'success', 
        message: 'Payment record inserted successfully',
        insertedId: insertedPayment?.id
      });
      
      // 立即删除测试记录
      if (insertedPayment?.id) {
        await supabaseAdmin
          .from('payments')
          .delete()
          .eq('id', insertedPayment.id);
        results.steps.push({ 
          step: '3b', 
          status: 'success', 
          message: 'Test payment record cleaned up' 
        });
      }
    }
    
    // Step 4: 测试插入 credit_transactions 表
    results.steps.push({ step: '4', action: 'Testing insert into credit_transactions table' });
    const testCreditData = {
      user_id: testUsers?.[0]?.id || '00000000-0000-0000-0000-000000000000',
      amount: 1,
      reason: 'test_write_permission',
      metadata: { testId }
      // 🔥 移除 bucket 字段，因为表中没有这个字段
    };
    
    const { data: insertedCredit, error: creditError } = await supabaseAdmin
      .from('credit_transactions')
      .insert(testCreditData)
      .select()
      .single();
    
    if (creditError) {
      results.steps.push({ 
        step: '4', 
        status: 'error', 
        error: creditError.message,
        code: creditError.code,
        details: creditError.details,
        hint: creditError.hint,
        isRLSError: creditError.message?.includes('row-level security') || creditError.message?.includes('RLS')
      });
    } else {
      results.steps.push({ 
        step: '4', 
        status: 'success', 
        message: 'Credit transaction inserted successfully',
        insertedId: insertedCredit?.id
      });
      
      // 立即删除测试记录
      if (insertedCredit?.id) {
        await supabaseAdmin
          .from('credit_transactions')
          .delete()
          .eq('id', insertedCredit.id);
        results.steps.push({ 
          step: '4b', 
          status: 'success', 
          message: 'Test credit transaction cleaned up' 
        });
      }
    }
    
    // Step 5: 测试 RPC 调用
    results.steps.push({ step: '5', action: 'Testing RPC call (credit_user_credits_transaction)' });
    if (testUsers?.[0]?.id) {
      // 🔥 修复：根据错误提示，RPC 函数不需要 p_bucket 参数
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('credit_user_credits_transaction', {
        p_user_id: testUsers[0].id,
        p_amount: 1,
        p_reason: 'test_rpc',
        p_metadata: { testId, bucket: 'flex' } // bucket 放在 metadata 中
      });
      
      if (rpcError) {
        results.steps.push({ 
          step: '5', 
          status: 'error', 
          error: rpcError.message,
          code: rpcError.code,
          details: rpcError.details,
          hint: rpcError.hint
        });
      } else {
        results.steps.push({ 
          step: '5', 
          status: 'success', 
          message: 'RPC call successful',
          data: rpcData
        });
      }
    } else {
      results.steps.push({ 
        step: '5', 
        status: 'skipped', 
        message: 'No test user found, skipping RPC test' 
      });
    }
    
    // 总结
    const allSuccess = results.steps.every(s => s.status === 'success' || s.status === 'skipped');
    results.summary = {
      allTestsPassed: allSuccess,
      totalSteps: results.steps.length,
      successfulSteps: results.steps.filter(s => s.status === 'success').length,
      failedSteps: results.steps.filter(s => s.status === 'error').length,
      hasRLSError: results.steps.some(s => s.isRLSError === true)
    };
    
    return NextResponse.json(results, { status: allSuccess ? 200 : 500 });
  } catch (error) {
    results.steps.push({ 
      step: 'exception', 
      status: 'error', 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(results, { status: 500 });
  }
}

