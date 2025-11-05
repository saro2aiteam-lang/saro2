import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
export const runtime = 'nodejs';

// 获取用户邮箱别名列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let query = getSupabaseAdmin()
      .from('user_email_aliases')
      .select(`
        id,
        user_id,
        alias_email,
        status,
        created_at,
        notes,
        users!inner(id, email, full_name)
      `);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: aliases, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch email aliases:', error);
      return NextResponse.json({ error: 'Failed to fetch email aliases' }, { status: 500 });
    }

    return NextResponse.json({ aliases });

  } catch (error) {
    console.error('Error fetching email aliases:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 创建邮箱别名
export async function POST(request: NextRequest) {
  try {
    const { userId, aliasEmail, notes } = await request.json();

    if (!userId || !aliasEmail) {
      return NextResponse.json({ error: 'User ID and alias email are required' }, { status: 400 });
    }

    // 验证用户是否存在
    const { data: user, error: userError } = await getSupabaseAdmin()
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 检查别名是否已存在
    const { data: existingAlias, error: aliasError } = await getSupabaseAdmin()
      .from('user_email_aliases')
      .select('id')
      .eq('alias_email', aliasEmail.toLowerCase().trim())
      .maybeSingle();

    if (aliasError) {
      console.error('Failed to check existing alias:', aliasError);
      return NextResponse.json({ error: 'Failed to check existing alias' }, { status: 500 });
    }

    if (existingAlias) {
      return NextResponse.json({ error: 'Email alias already exists' }, { status: 409 });
    }

    // 创建别名
    const { data: newAlias, error: createError } = await getSupabaseAdmin()
      .from('user_email_aliases')
      .insert({
        user_id: userId,
        alias_email: aliasEmail.toLowerCase().trim(),
        notes: notes || null,
        status: 'active'
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create email alias:', createError);
      return NextResponse.json({ error: 'Failed to create email alias' }, { status: 500 });
    }

    return NextResponse.json({ success: true, alias: newAlias });

  } catch (error) {
    console.error('Error creating email alias:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 更新或删除邮箱别名
export async function PUT(request: NextRequest) {
  try {
    const { aliasId, action, status, notes } = await request.json();

    if (!aliasId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let updates: any = {};

    if (action === 'update') {
      if (status) updates.status = status;
      if (notes !== undefined) updates.notes = notes;
    } else if (action === 'delete') {
      updates.status = 'inactive';
    }

    const { data, error } = await getSupabaseAdmin()
      .from('user_email_aliases')
      .update(updates)
      .eq('id', aliasId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update email alias:', error);
      return NextResponse.json({ error: 'Failed to update email alias' }, { status: 500 });
    }

    return NextResponse.json({ success: true, alias: data });

  } catch (error) {
    console.error('Error updating email alias:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
