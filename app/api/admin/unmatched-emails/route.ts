import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
export const runtime = 'nodejs';

// 获取未匹配的支付邮箱列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: unmatchedEmails, error } = await getSupabaseAdmin()
      .from('unmatched_payment_emails')
      .select(`
        id,
        email,
        payment_id,
        subscription_id,
        amount,
        currency,
        status,
        created_at,
        webhook_data
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch unmatched emails:', error);
      return NextResponse.json({ error: 'Failed to fetch unmatched emails' }, { status: 500 });
    }

    return NextResponse.json({ unmatchedEmails });

  } catch (error) {
    console.error('Error fetching unmatched emails:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 解决未匹配的邮箱
export async function POST(request: NextRequest) {
  try {
    const { unmatchedEmailId, userId, action, notes } = await request.json();

    if (!unmatchedEmailId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'resolve' && !userId) {
      return NextResponse.json({ error: 'User ID required for resolution' }, { status: 400 });
    }

    const updates: any = {
      status: action === 'resolve' ? 'resolved' : 'ignored',
      resolved_at: new Date().toISOString(),
      notes: notes || null
    };

    if (action === 'resolve') {
      updates.resolved_user_id = userId;
    }

    const { data, error } = await getSupabaseAdmin()
      .from('unmatched_payment_emails')
      .update(updates)
      .eq('id', unmatchedEmailId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update unmatched email:', error);
      return NextResponse.json({ error: 'Failed to update unmatched email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Error updating unmatched email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
