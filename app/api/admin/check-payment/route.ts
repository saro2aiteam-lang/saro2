import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

// 检查特定支付的处理状态
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const checkoutId = searchParams.get('checkout_id');
  const orderId = searchParams.get('order_id');
  const customerId = searchParams.get('customer_id');
  const productId = searchParams.get('product_id');
  
  if (!checkoutId && !orderId) {
    return NextResponse.json({
      error: 'Please provide checkout_id or order_id'
    }, { status: 400 });
  }
  
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    const result: any = {
      timestamp: new Date().toISOString(),
      searchParams: {
        checkoutId,
        orderId,
        customerId,
        productId
      }
    };
    
    // 1. 检查支付记录
    if (orderId) {
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('creem_payment_id', orderId)
        .maybeSingle();
      
      result.payment = {
        found: !!payment,
        data: payment,
        error: paymentError?.message
      };
    }
    
    // 2. 检查积分交易（通过 checkout_id 或 order_id）
    const creditQueries = [];
    if (checkoutId) {
      creditQueries.push(
        supabaseAdmin
          .from('credit_transactions')
          .select('*')
          .eq('metadata->>paymentId', checkoutId)
          .eq('reason', 'creem_payment')
      );
    }
    if (orderId) {
      creditQueries.push(
        supabaseAdmin
          .from('credit_transactions')
          .select('*')
          .eq('metadata->>paymentId', orderId)
          .eq('reason', 'creem_payment')
      );
    }
    
    if (creditQueries.length > 0) {
      const creditResults = await Promise.all(creditQueries);
      const allCredits = creditResults.flatMap(r => r.data || []);
      result.credits = {
        found: allCredits.length > 0,
        count: allCredits.length,
        transactions: allCredits
      };
    }
    
    // 3. 如果提供了 customer_id，检查用户信息
    if (customerId) {
      // 先尝试通过 Creem customer_id 查找（如果有映射表）
      // 否则通过邮箱查找
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, email, credits_balance, flex_credits_balance, subscription_credits_balance, credits_total')
        .limit(100);
      
      result.users = {
        total: users?.length || 0,
        sample: users?.slice(0, 10) || []
      };
    }
    
    // 4. 检查未匹配的邮箱
    if (checkoutId || orderId) {
      const { data: unmatched } = await supabaseAdmin
        .from('unmatched_payment_emails')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      result.unmatchedEmails = {
        count: unmatched?.length || 0,
        recent: unmatched || []
      };
    }
    
    // 5. 总结
    result.summary = {
      paymentFound: result.payment?.found || false,
      creditsFound: result.credits?.found || false,
      status: result.payment?.found && result.credits?.found 
        ? 'COMPLETE' 
        : result.payment?.found 
          ? 'PAYMENT_ONLY' 
          : result.credits?.found
            ? 'CREDITS_ONLY'
            : 'NOT_FOUND'
    };
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

