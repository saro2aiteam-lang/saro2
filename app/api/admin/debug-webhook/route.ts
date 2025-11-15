import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { creemPlansById } from '@/config/creemPlans';

export const runtime = 'nodejs';

// 诊断工具：检查 webhook 配置和最近的处理
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // 1. 检查环境变量
    const envCheck = {
      NEXT_PUBLIC_CREEM_PACK_STARTER_ID: process.env.NEXT_PUBLIC_CREEM_PACK_STARTER_ID || 'NOT SET',
      NEXT_PUBLIC_CREEM_PACK_CREATOR_ID: process.env.NEXT_PUBLIC_CREEM_PACK_CREATOR_ID || 'NOT SET',
      NEXT_PUBLIC_CREEM_PACK_DEV_ID: process.env.NEXT_PUBLIC_CREEM_PACK_DEV_ID || 'NOT SET',
      CREEM_API_KEY: process.env.CREEM_API_KEY ? 'SET (hidden)' : 'NOT SET',
    };
    
    // 2. 检查 plan 配置
    const plansCheck = Object.values(creemPlansById).map(p => ({
      id: p.id,
      productId: p.productId,
      credits: p.credits,
      category: p.category,
      name: p.name
    }));
    
    // 3. 检查最近的支付记录
    const { data: recentPayments, error: paymentsError } = await supabaseAdmin
      .from('payments')
      .select('id, user_id, amount, status, creem_payment_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    // 4. 检查最近的积分交易
    const { data: recentCredits, error: creditsError } = await supabaseAdmin
      .from('credit_transactions')
      .select('id, user_id, amount, reason, metadata, created_at')
      .eq('reason', 'creem_payment')
      .order('created_at', { ascending: false })
      .limit(10);
    
    // 5. 检查未匹配的邮箱
    const { data: unmatchedEmails } = await supabaseAdmin
      .from('unmatched_payment_emails')
      .select('email, created_at, status')
      .order('created_at', { ascending: false })
      .limit(10);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envCheck,
      plans: plansCheck,
      recentPayments: recentPayments || [],
      recentCredits: recentCredits || [],
      unmatchedEmails: unmatchedEmails || [],
      errors: {
        payments: paymentsError?.message,
        credits: creditsError?.message
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

