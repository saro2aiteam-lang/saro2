import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { creemPlansById } from '@/config/creemPlans';

export const runtime = 'nodejs';

// 诊断工具：检查 webhook 配置和最近的处理
export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: {}
  };
  
  try {
    // 检查 1: 环境变量
    diagnostics.checks.env = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) || 'NOT SET',
      serviceRoleKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) || 'NOT SET',
      hasCreemApiKey: !!process.env.CREEM_API_KEY,
    };
    
    // 检查 2: Supabase 客户端创建
    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseAdmin();
      diagnostics.checks.supabaseClient = { success: true, message: 'Admin client created successfully' };
    } catch (error) {
      diagnostics.checks.supabaseClient = { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
      return NextResponse.json(diagnostics, { status: 500 });
    }
    
    // 检查 3: 测试 Supabase 查询权限
    try {
      const { data: testUsers, error: testError } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .limit(1);
      
      diagnostics.checks.supabaseQuery = {
        success: !testError,
        error: testError?.message,
        canReadUsers: !testError && !!testUsers
      };
    } catch (error) {
      diagnostics.checks.supabaseQuery = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
    
    // 检查 4: Plan 配置
    diagnostics.checks.plans = {
      totalPlans: Object.keys(creemPlansById).length,
      plans: Object.values(creemPlansById).map(p => ({
        id: p.id,
        productId: p.productId,
        credits: p.credits,
        category: p.category,
        name: p.name
      })),
      envProductIds: {
        STARTER: process.env.NEXT_PUBLIC_CREEM_PACK_STARTER_ID || 'NOT SET',
        CREATOR: process.env.NEXT_PUBLIC_CREEM_PACK_CREATOR_ID || 'NOT SET',
        DEV: process.env.NEXT_PUBLIC_CREEM_PACK_DEV_ID || 'NOT SET',
      }
    };
    
    // 检查 5: 最近的支付记录
    const { data: recentPayments, error: paymentsError } = await supabaseAdmin
      .from('payments')
      .select('id, user_id, amount, status, creem_payment_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    diagnostics.checks.recentPayments = {
      count: recentPayments?.length || 0,
      payments: recentPayments || [],
      error: paymentsError?.message
    };
    
    // 检查 6: 最近的积分交易
    const { data: recentCredits, error: creditsError } = await supabaseAdmin
      .from('credit_transactions')
      .select('id, user_id, amount, reason, metadata, created_at')
      .eq('reason', 'creem_payment')
      .order('created_at', { ascending: false })
      .limit(10);
    
    diagnostics.checks.recentCredits = {
      count: recentCredits?.length || 0,
      credits: recentCredits || [],
      error: creditsError?.message
    };
    
    // 检查 7: 未匹配的邮箱
    const { data: unmatchedEmails } = await supabaseAdmin
      .from('unmatched_payment_emails')
      .select('email, created_at, status')
      .order('created_at', { ascending: false })
      .limit(10);
    
    diagnostics.checks.unmatchedEmails = {
      count: unmatchedEmails?.length || 0,
      emails: unmatchedEmails || []
    };
    
    // 总结
    diagnostics.summary = {
      allChecksPassed: 
        diagnostics.checks.env.hasSupabaseUrl &&
        diagnostics.checks.env.hasServiceRoleKey &&
        diagnostics.checks.supabaseClient.success &&
        diagnostics.checks.supabaseQuery.success,
      issues: [
        !diagnostics.checks.env.hasSupabaseUrl && 'Missing NEXT_PUBLIC_SUPABASE_URL',
        !diagnostics.checks.env.hasServiceRoleKey && 'Missing SUPABASE_SERVICE_ROLE_KEY',
        !diagnostics.checks.supabaseClient.success && 'Failed to create Supabase admin client',
        !diagnostics.checks.supabaseQuery.success && 'Failed to query Supabase (RLS or permission issue)',
      ].filter(Boolean)
    };
    
    return NextResponse.json(diagnostics, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

