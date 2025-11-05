import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const KIE_API_KEY = process.env.KIE_API_KEY;
const KIE_API_BASE_URL = (process.env.KIE_API_BASE_URL || 'https://api.kie.ai').trim();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

function normalizeBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, '');
  if (trimmed.endsWith('/api/v1')) return trimmed.slice(0, -7);
  return trimmed;
}

export async function POST(request: NextRequest) {
  try {
    if (!KIE_API_KEY) {
      return NextResponse.json({ error: 'Kie API key not configured' }, { status: 500 });
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const video_url = typeof body?.video_url === 'string' ? body.video_url.trim() : '';
    const callBackUrl = typeof body?.callBackUrl === 'string' ? body.callBackUrl.trim() : undefined;

    if (!video_url || !/^https:\/\/sora\.chatgpt\.com\//.test(video_url)) {
      return NextResponse.json({ error: 'Invalid video_url. Must start with https://sora.chatgpt.com/' }, { status: 400 });
    }

    const requiredCredits = 10; // fixed cost per watermark removal

    // transactional debit: prioritize subscription bucket, then flex
    try {
      const { data: debitData, error: debitError } = await supabase.rpc('debit_user_credits_transaction', {
        p_user_id: user.id,
        p_amount: requiredCredits,
        p_reason: 'watermark_remove',
        p_metadata: { video_url, status: 'processing' }
      });

      if (debitError) {
        if ((debitError as any).code === 'P0008' || /INSUFFICIENT_BALANCE/i.test((debitError as any).message || '')) {
          return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
        }
        console.error('Failed to deduct credits:', debitError);
        return NextResponse.json({ error: 'Failed to deduct credits' }, { status: 500 });
      }

      // optional: capture remaining balance from RPC result
      const snapshot = Array.isArray(debitData) ? (debitData as any[])[0] : null;
      const remaining = snapshot?.credits_balance;

      // proceed after successful debit
      // (no manual user update or manual transaction insert needed)
      
      // call KIE createTask
      const requestBody: Record<string, any> = {
        model: 'sora-watermark-remover',
        input: { video_url },
      };
      if (callBackUrl) requestBody.callBackUrl = callBackUrl;

      const resp = await fetch(`${normalizeBaseUrl(KIE_API_BASE_URL)}/api/v1/jobs/createTask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${KIE_API_KEY}`,
          'X-API-Key': KIE_API_KEY,
        },
        body: JSON.stringify(requestBody),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        return NextResponse.json({ error: 'Kie API error', details: errText }, { status: resp.status });
      }

      const kieData = await resp.json();
      const taskId = (() => {
        const d = kieData?.data || {};
        const c = d.taskId || d.task_id || kieData?.taskId || kieData?.id;
        return typeof c === 'string' && c.trim() ? c.trim() : undefined;
      })();

      if (!taskId) {
        return NextResponse.json({ error: 'Invalid KIE response', response: kieData }, { status: 502 });
      }

      // save job row for tracking
      try {
        const { error: jobError } = await supabase
          .from('video_jobs')
          .insert({
            job_id: taskId,
            user_id: user.id,
            status: 'processing',
            image_url: video_url,
            duration: 8,
            cost_credits: requiredCredits,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        if (jobError) {
          console.error('Failed to insert video_jobs row:', jobError);
        }
      } catch (e) {
        console.error('DB insert error:', e);
      }

      return NextResponse.json({
        success: true,
        generation_id: taskId,
        status: 'processing',
        credits_consumed: requiredCredits,
        user_credits_remaining: typeof remaining === 'number' ? remaining : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Credit debit exception:', e);
      return NextResponse.json({ error: 'Failed to deduct credits' }, { status: 500 });
    }

  } catch (error) {
    console.error('[WATERMARK CREATE] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



