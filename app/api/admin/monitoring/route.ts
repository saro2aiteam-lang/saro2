import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

// 验证管理员权限（简单实现，生产环境需要更严格的验证）
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  
  const token = authHeader.replace('Bearer ', '');
  // 这里应该验证管理员token，暂时简单检查
  return token === process.env.ADMIN_API_KEY;
}

export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 获取系统健康状态汇总
    const [
      healthSummary,
      criticalIssues,
      webhookFailures,
      pendingCredits,
      failedGenerations,
      creditInconsistencies
    ] = await Promise.all([
      getSupabaseAdmin().rpc('get_system_health_summary'),
      getSupabaseAdmin().rpc('get_critical_issues'),
      getSupabaseAdmin().rpc('get_recent_webhook_failures', { p_hours: 24 }),
      getSupabaseAdmin().rpc('get_pending_user_credits', { p_hours: 24 }),
      getSupabaseAdmin().rpc('get_recent_webhook_failures', { p_hours: 24 }), // 复用函数
      getSupabaseAdmin().rpc('find_credit_inconsistencies')
    ]);

    // 构建响应数据
    const response = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      summary: {
        webhook_failures_24h: healthSummary.data?.find(m => m.metric_name === 'webhook_failures_24h')?.metric_value || 0,
        pending_user_credits_24h: healthSummary.data?.find(m => m.metric_name === 'pending_user_credits_24h')?.metric_value || 0,
        failed_generations_24h: healthSummary.data?.find(m => m.metric_name === 'failed_generations_24h')?.metric_value || 0,
        credit_inconsistencies: healthSummary.data?.find(m => m.metric_name === 'credit_inconsistencies')?.metric_value || 0,
        total_users: healthSummary.data?.find(m => m.metric_name === 'total_users')?.metric_value || 0,
        total_credit_transactions: healthSummary.data?.find(m => m.metric_name === 'total_credit_transactions')?.metric_value || 0
      },
      critical_issues: criticalIssues.data || [],
      recent_webhook_failures: webhookFailures.data || [],
      pending_user_credits: pendingCredits.data || [],
      failed_generations: failedGenerations.data || [],
      credit_inconsistencies: creditInconsistencies.data || []
    };

    // 判断整体健康状态
    const hasCriticalIssues = criticalIssues.data && criticalIssues.data.length > 0;
    const hasHighFailureRate = (response.summary.webhook_failures_24h > 10) || 
                              (response.summary.pending_user_credits_24h > 5) ||
                              (response.summary.credit_inconsistencies > 0);

    if (hasCriticalIssues || hasHighFailureRate) {
      response.status = 'warning';
    }

    if (response.summary.credit_inconsistencies > 5 || response.summary.webhook_failures_24h > 20) {
      response.status = 'critical';
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Monitoring API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch monitoring data',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// 获取特定用户的积分详情
export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, action } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'check_consistency':
        const consistencyResult = await getSupabaseAdmin().rpc('check_credit_consistency', { p_user_id: userId });
        return NextResponse.json({
          userId,
          consistency: consistencyResult.data?.[0] || null,
          timestamp: new Date().toISOString()
        });

      case 'get_credit_stats':
        const statsResult = await getSupabaseAdmin().rpc('get_user_credit_stats');
        const userStats = statsResult.data?.find((stat: any) => stat.user_id === userId);
        return NextResponse.json({
          userId,
          stats: userStats || null,
          timestamp: new Date().toISOString()
        });

      case 'get_recent_transactions':
        const transactionsResult = await getSupabaseAdmin()
          .from('credit_transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);
        
        return NextResponse.json({
          userId,
          transactions: transactionsResult.data || [],
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Monitoring API POST error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
