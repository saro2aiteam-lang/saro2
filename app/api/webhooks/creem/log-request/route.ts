import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

// 记录所有 webhook 请求（用于调试）
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    
    const supabaseAdmin = getSupabaseAdmin();
    
    // 尝试解析事件
    let eventType = 'unknown';
    let payload = null;
    try {
      const event = JSON.parse(body);
      eventType = event?.eventType || event?.type || event?.event_type || 'unknown';
      payload = event?.object || event?.data || null;
    } catch (e) {
      // 解析失败，记录原始 body
    }
    
    // 记录到数据库
    const { error } = await supabaseAdmin
      .from('webhook_logs')
      .insert({
        event_type: eventType,
        payload: payload || { raw_body: body.substring(0, 1000) },
        headers: headers,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('[WEBHOOK-LOG] Failed to log webhook request:', error);
      // 如果表不存在，创建它
      if (error.message?.includes('does not exist')) {
        console.log('[WEBHOOK-LOG] webhook_logs table does not exist, skipping log');
      }
    }
    
    return NextResponse.json({ logged: true, eventType });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

