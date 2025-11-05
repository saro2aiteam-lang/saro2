import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createServerClient } from '@supabase/ssr';
import { creemPlansById } from '@/config/creemPlans';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const plan = searchParams.get('plan') || '';

    console.log('[CALLBACK] Creem success URL callback received');
    console.log('[CALLBACK] Plan:', plan);
    console.log('[CALLBACK] All URL parameters:', Object.fromEntries(searchParams.entries()));

    // 根据Creem文档：Success URL只有在支付成功后才会被调用
    // 因此如果到达这里，就说明支付成功了
    // 不需要检查status参数，因为Creem不会在失败时重定向到success URL
    if (plan) {
      // 获取用户认证信息
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
      
      const { data: { user } } = await supabase.auth.getUser();
      
      let amount = '1.0';
      let currency = 'USD';
      let transactionId = '';
      
      if (user) {
        console.log('[CALLBACK] User authenticated:', user.id);
        
        // 添加重试逻辑处理webhook延迟
        let payment = null;
        let retryCount = 0;
        const maxRetries = 2;

        while (!payment && retryCount <= maxRetries) {
          const { data, error } = await getSupabaseAdmin()
            .from('payments')
            .select('amount, currency, creem_payment_id')
            .eq('user_id', user.id)
            .eq('status', 'succeeded')
            .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          payment = data;
          
          if (!payment && retryCount < maxRetries) {
            console.log(`[CALLBACK] No payment found, retry ${retryCount + 1}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, 500)); // 等待500ms
            retryCount++;
          } else {
            break;
          }
        }
        
        if (payment) {
          // payments表中amount是cents，需要转换为美元
          amount = (payment.amount / 100).toFixed(2);
          currency = payment.currency;
          transactionId = payment.creem_payment_id || `tx_${user.id}_${Date.now()}`;
          
          console.log('[CALLBACK] Found payment record:', {
            amount,
            currency,
            transactionId,
            source: 'database'
          });
        } else {
          console.log('[CALLBACK] No payment record found, using plan config');
          
          // Fallback: 从plan配置获取金额
          const planConfig = plan ? creemPlansById[plan] : undefined;
          if (planConfig) {
            amount = (planConfig.priceCents / 100).toFixed(2);
            currency = planConfig.currency;
            transactionId = `plan_${user.id}_${Date.now()}`;
            
            console.log('[CALLBACK] Using plan config:', {
              amount,
              currency,
              transactionId,
              source: 'plan_config'
            });
          }
        }
      } else {
        console.warn('[CALLBACK] User not authenticated, using plan config');
        
        // 未认证用户，尝试从plan配置获取
        const planConfig = plan ? creemPlansById[plan] : undefined;
        if (planConfig) {
          amount = (planConfig.priceCents / 100).toFixed(2);
          currency = planConfig.currency;
          transactionId = `guest_${Date.now()}`;
        }
      }
      
      const target = `/payment/success?plan=${encodeURIComponent(plan)}&transaction_id=${encodeURIComponent(transactionId)}&value=${encodeURIComponent(amount)}&currency=${encodeURIComponent(currency)}`;
      
      console.log('[CALLBACK] Redirecting to success page:', target);
      return NextResponse.redirect(new URL(target, request.url));
    } else {
      // 如果没有plan参数，说明URL配置错误或者是非法访问
      console.warn('[CALLBACK] No plan parameter found - invalid success URL callback');
      return NextResponse.redirect(new URL('/account?payment=error', request.url));
    }

  } catch (error) {
    console.error('[CALLBACK] Error processing return URL:', error);
    return NextResponse.redirect(new URL('/account?payment=error', request.url));
  }
}


