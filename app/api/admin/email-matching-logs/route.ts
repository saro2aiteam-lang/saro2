import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
export const runtime = 'nodejs';

// 获取邮箱匹配日志
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const matchType = searchParams.get('matchType');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = getSupabaseAdmin()
      .from('email_matching_logs')
      .select(`
        id,
        searched_email,
        matched_user_id,
        matched_email,
        match_type,
        webhook_event_type,
        created_at,
        users!matched_user_id(id, email, full_name)
      `);

    if (email) {
      query = query.ilike('searched_email', `%${email}%`);
    }

    if (matchType) {
      query = query.eq('match_type', matchType);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: logs, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch email matching logs:', error);
      return NextResponse.json({ error: 'Failed to fetch email matching logs' }, { status: 500 });
    }

    // 获取统计信息
    const { data: stats, error: statsError } = await getSupabaseAdmin()
      .from('email_matching_logs')
      .select('match_type')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // 最近7天

    if (statsError) {
      console.error('Failed to fetch stats:', statsError);
    }

    const matchStats = stats?.reduce((acc: any, log: any) => {
      acc[log.match_type] = (acc[log.match_type] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({ 
      logs, 
      stats: {
        total: logs.length,
        matchTypes: matchStats
      }
    });

  } catch (error) {
    console.error('Error fetching email matching logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 获取邮箱匹配统计信息
export async function POST(request: NextRequest) {
  try {
    const { days = 7 } = await request.json();

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // 获取匹配类型统计
    const { data: matchTypeStats, error: matchTypeError } = await getSupabaseAdmin()
      .from('email_matching_logs')
      .select('match_type')
      .gte('created_at', startDate);

    if (matchTypeError) {
      console.error('Failed to fetch match type stats:', matchTypeError);
      return NextResponse.json({ error: 'Failed to fetch match type stats' }, { status: 500 });
    }

    // 获取未匹配邮箱统计
    const { data: unmatchedStats, error: unmatchedError } = await getSupabaseAdmin()
      .from('unmatched_payment_emails')
      .select('status')
      .gte('created_at', startDate);

    if (unmatchedError) {
      console.error('Failed to fetch unmatched stats:', unmatchedError);
      return NextResponse.json({ error: 'Failed to fetch unmatched stats' }, { status: 500 });
    }

    // 处理统计数据
    const matchTypeCounts = matchTypeStats?.reduce((acc: any, log: any) => {
      acc[log.match_type] = (acc[log.match_type] || 0) + 1;
      return acc;
    }, {}) || {};

    const unmatchedCounts = unmatchedStats?.reduce((acc: any, log: any) => {
      acc[log.status] = (acc[log.status] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      period: `${days} days`,
      matchTypes: matchTypeCounts,
      unmatched: unmatchedCounts,
      totalLogs: matchTypeStats?.length || 0,
      totalUnmatched: unmatchedStats?.length || 0
    });

  } catch (error) {
    console.error('Error fetching email matching statistics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
