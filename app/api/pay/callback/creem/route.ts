import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createServerClient } from '@supabase/ssr';
import { creemPlansById } from '@/config/creemPlans';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const plan = searchParams.get('plan') || '';
    // Parameters documented by Creem for Return URLs
    const checkoutId = searchParams.get('checkout_id');
    const orderId = searchParams.get('order_id');
    const customerId = searchParams.get('customer_id');
    const subscriptionId = searchParams.get('subscription_id');
    const productId = searchParams.get('product_id');
    const requestId = searchParams.get('request_id');
    const signature = searchParams.get('signature');

    console.log('[CALLBACK] Creem success URL callback received');
    console.log('[CALLBACK] Plan:', plan);
    console.log('[CALLBACK] All URL parameters:', Object.fromEntries(searchParams.entries()));

    // Verify Creem return URL signature per docs
    // https://docs.creem.io/checkout-flow and https://docs.creem.io/learn/checkout-session/return-url
    const apiKey = process.env.CREEM_API_KEY || '';
    
    // 如果提供了签名，则验证；如果没有签名，记录警告但继续处理（某些情况下可能没有签名）
    if (signature && apiKey) {
      const pieces: string[] = [];
      const ordered: Array<[string, string | null]> = [
        ['checkout_id', checkoutId],
        ['order_id', orderId],
        ['customer_id', customerId],
        ['subscription_id', subscriptionId],
        ['product_id', productId],
        ['request_id', requestId],
      ];
      for (const [k, v] of ordered) {
        if (v !== null && v !== undefined) pieces.push(`${k}=${v}`);
      }
      pieces.push(`salt=${apiKey}`);
      const expected = crypto.createHash('sha256').update(pieces.join('|')).digest('hex');
      
      console.log('[CALLBACK] Signature verification:', {
        hasSignature: !!signature,
        hasApiKey: !!apiKey,
        pieces: pieces,
        expectedPrefix: expected.substring(0, 16) + '...',
        receivedPrefix: signature.substring(0, 16) + '...',
      });
      
      const isValid = (() => {
        try {
          // 清理签名字符串
          const cleanedSignature = signature.trim();
          const cleanedExpected = expected.trim();
          
          if (cleanedSignature.length !== cleanedExpected.length) {
            console.error('[CALLBACK] Signature length mismatch:', {
              received: cleanedSignature.length,
              expected: cleanedExpected.length
            });
            return false;
          }
          
          return crypto.timingSafeEqual(
            Buffer.from(cleanedSignature),
            Buffer.from(cleanedExpected)
          );
        } catch (error) {
          console.error('[CALLBACK] Signature verification error:', error);
          return false;
        }
      })();
      
      if (!isValid) {
        console.error('[CALLBACK] Invalid Creem return URL signature', {
          checkoutId, 
          orderId, 
          customerId, 
          subscriptionId, 
          productId, 
          requestId,
          hasApiKey: !!apiKey,
          signatureLength: signature?.length,
        });
        return NextResponse.redirect(new URL('/dashboard?payment=invalid_signature', request.url));
      } else {
        console.log('[CALLBACK] Signature verified successfully');
      }
    } else if (signature && !apiKey) {
      console.warn('[CALLBACK] Signature provided but CREEM_API_KEY not configured');
      // 如果没有配置 API key，仍然继续处理（可能是测试环境）
    } else if (!signature) {
      console.warn('[CALLBACK] No signature provided in callback URL - this may be expected in some cases');
    }

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
      
      const qp: Record<string, string> = {
        plan,
        transaction_id: transactionId,
        value: amount,
        currency,
      };
      if (checkoutId) qp.checkout_id = checkoutId;
      if (orderId) qp.order_id = orderId;
      if (subscriptionId) qp.subscription_id = subscriptionId || '';
      if (productId) qp.product_id = productId || '';
      if (requestId) qp.request_id = requestId || '';
      const target = `/payment/success?${new URLSearchParams(qp).toString()}`;
      
      console.log('[CALLBACK] Redirecting to success page:', target);
      return NextResponse.redirect(new URL(target, request.url));
    } else {
      // 如果没有plan参数，说明URL配置错误或者是非法访问
      console.warn('[CALLBACK] No plan parameter found - invalid success URL callback');
      return NextResponse.redirect(new URL('/dashboard?payment=error', request.url));
    }

  } catch (error) {
    console.error('[CALLBACK] Error processing return URL:', error);
    return NextResponse.redirect(new URL('/dashboard?payment=error', request.url));
  }
}


