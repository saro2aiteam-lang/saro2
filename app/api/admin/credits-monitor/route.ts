import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createServerClient } from '@supabase/ssr';

// 管理员积分监控API - 需要管理员权限
export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  try {
    // 获取认证用户
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

    // 检查管理员权限
    const isAdmin = user.email === 'admin@yourdomain.com' || 
                    user.user_metadata?.role === 'admin' ||
                    user.email?.includes('admin');

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'overview';

    switch (action) {
      case 'overview':
        // 获取异常积分用户概览
        const { data: highCreditUsers, error: highCreditError } = await getSupabaseAdmin()
          .from('users')
          .select('email, credits_balance, credits_total, credits_spent, created_at, updated_at')
          .or('credits_balance.gt.1000,credits_total.gt.1000')
          .order('credits_balance', { ascending: false })
          .limit(20);

        if (highCreditError) {
          console.error('Error fetching high credit users:', highCreditError);
          return NextResponse.json(
            { error: 'Database error' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            highCreditUsers,
            totalHighCreditUsers: highCreditUsers?.length || 0,
            timestamp: new Date().toISOString()
          }
        });

      case 'transactions':
        // 获取最近的大额积分操作
        const hours = parseInt(url.searchParams.get('hours') || '24');
        const { data: recentTransactions, error: transactionsError } = await getSupabaseAdmin()
          .from('credit_transactions')
          .select(`
            id,
            user_id,
            amount,
            transaction_type,
            reason,
            metadata,
            created_at,
            users!inner(email)
          `)
          .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
          .or('amount.gt.100,amount.lt.-100')
          .order('created_at', { ascending: false })
          .limit(50);

        if (transactionsError) {
          console.error('Error fetching recent transactions:', transactionsError);
          return NextResponse.json(
            { error: 'Database error' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            recentTransactions,
            hours,
            timestamp: new Date().toISOString()
          }
        });

      case 'user':
        // 获取特定用户的积分历史
        const email = url.searchParams.get('email');
        if (!email) {
          return NextResponse.json(
            { error: 'Email parameter required' },
            { status: 400 }
          );
        }

        const { data: userData, error: userError } = await getSupabaseAdmin()
          .from('users')
          .select('id, email, credits_balance, credits_total, credits_spent, created_at, updated_at')
          .eq('email', email)
          .single();

        if (userError) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        const { data: userTransactions, error: userTransactionsError } = await getSupabaseAdmin()
          .from('credit_transactions')
          .select('*')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false })
          .limit(100);

        return NextResponse.json({
          success: true,
          data: {
            user: userData,
            transactions: userTransactions || [],
            timestamp: new Date().toISOString()
          }
        });

      case 'duplicates':
        // 检测重复的积分操作
        const { data: duplicates, error: duplicatesError } = await getSupabaseAdmin()
          .rpc('detect_duplicate_credits', {
            days_back: 7
          });

        return NextResponse.json({
          success: true,
          data: {
            duplicates: duplicates || [],
            timestamp: new Date().toISOString()
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: overview, transactions, user, duplicates' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Security monitor API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 限制异常用户积分的API
export async function POST(request: NextRequest) {
  try {
    // 获取认证用户
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

    // 检查管理员权限
    const isAdmin = user.email === 'admin@yourdomain.com' || 
                    user.user_metadata?.role === 'admin' ||
                    user.email?.includes('admin');

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { email, action, credits } = await request.json();

    if (!email || !action) {
      return NextResponse.json(
        { error: 'Email and action required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'add':
        // 添加积分
        if (!credits || credits <= 0) {
          return NextResponse.json(
            { error: 'Valid credits amount required' },
            { status: 400 }
          );
        }

        // 使用积分系统函数添加积分
        const { data: addResult, error: addError } = await getSupabaseAdmin()
          .rpc('credit_user_credits_transaction', {
            p_user_id: (await getSupabaseAdmin()
              .from('users')
              .select('id')
              .eq('email', email)
              .single()).data?.id,
            p_amount: credits,
            p_reason: 'admin_add_credits',
            p_metadata: {
              admin_email: user.email,
              action: 'add_credits',
              amount: credits
            }
          });

        if (addError) {
          console.error('Error adding user credits:', addError);
          return NextResponse.json(
            { error: 'Failed to add credits', details: addError.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `Added ${credits} credits to user ${email}`,
          data: addResult?.[0]
        });

      case 'limit':
        // 限制用户积分
        const limitCredits = credits || 100;
        
        const { data: limitResult, error: limitError } = await getSupabaseAdmin()
          .from('users')
          .update({
            credits_balance: Math.min(limitCredits, 100), // 最多100积分
            credits_total: Math.min(limitCredits, 100),
            updated_at: new Date().toISOString()
          })
          .eq('email', email)
          .select();

        if (limitError) {
          console.error('Error limiting user credits:', limitError);
          return NextResponse.json(
            { error: 'Failed to limit credits' },
            { status: 500 }
          );
        }

        // 记录管理员操作
        await getSupabaseAdmin()
          .from('credit_transactions')
          .insert({
            user_id: limitResult[0]?.id,
            amount: 0,
            transaction_type: 'admin_action',
            reason: 'admin_limit_credits',
            metadata: {
              admin_email: user.email,
              action: 'limit_credits',
              original_balance: limitResult[0]?.credits_balance,
              new_limit: limitCredits
            }
          });

        return NextResponse.json({
          success: true,
          message: `User ${email} credits limited to ${limitCredits}`,
          data: limitResult[0]
        });

      case 'reset':
        // 重置用户积分
        const { data: resetResult, error: resetError } = await getSupabaseAdmin()
          .from('users')
          .update({
            credits_balance: 50,
            credits_total: 50,
            credits_spent: 0,
            updated_at: new Date().toISOString()
          })
          .eq('email', email)
          .select();

        if (resetError) {
          console.error('Error resetting user credits:', resetError);
          return NextResponse.json(
            { error: 'Failed to reset credits' },
            { status: 500 }
          );
        }

        // 记录管理员操作
        await getSupabaseAdmin()
          .from('credit_transactions')
          .insert({
            user_id: resetResult[0]?.id,
            amount: 0,
            transaction_type: 'admin_action',
            reason: 'admin_reset_credits',
            metadata: {
              admin_email: user.email,
              action: 'reset_credits',
              original_balance: resetResult[0]?.credits_balance
            }
          });

        return NextResponse.json({
          success: true,
          message: `User ${email} credits reset to default`,
          data: resetResult[0]
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: add, limit, reset' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Security monitor POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
