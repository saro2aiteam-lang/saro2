import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mapKieStateToJobStatus, parseResultJson } from '@/lib/kie';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!KIE_API_KEY) {
      return NextResponse.json({ error: 'Kie API key not configured' }, { status: 500 });
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing job id' }, { status: 400 });
    }

    // Authenticate user via Bearer token (same pattern as /api/kie/generate)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Query Kie API for status
    const url = `${normalizeBaseUrl(KIE_API_BASE_URL)}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(id)}`;
    console.log('🌐 Calling KIE API:', url);
    
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${KIE_API_KEY}`,
        'X-API-Key': KIE_API_KEY,
      },
      // Avoid Next caching
      cache: 'no-store',
    });

    console.log('📡 KIE API response status:', resp.status, resp.statusText);

    if (!resp.ok) {
      const text = await resp.text();
      console.error('❌ KIE API error:', text);
      return NextResponse.json(
        { error: 'Kie status fetch failed', details: text },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    
    console.log('🔍 KIE API Response:', JSON.stringify(data, null, 2));

    const payload = data?.data ?? {};
    const {
      state,
      status: statusField,
      taskStatus,
      taskState,
      resultJson,
      result,
      resultUrl,
      mediaUrl,
      resourceUrl,
      progress,
      error,
      errorMessage,
      errorMsg,
      message,
      msg,
      createTime,
    } = payload as Record<string, unknown>;

    console.log('📊 Extracted fields:', {
      state,
      statusField,
      taskStatus,
      taskState,
      resultJson,
      result,
      resultUrl,
      mediaUrl,
      resourceUrl,
      progress,
      error,
      errorMessage,
      errorMsg,
      message,
      msg
    });

    const resolvedState = (state ?? statusField ?? taskStatus ?? taskState) as string | undefined;
    const mapped = mapKieStateToJobStatus(resolvedState);
    const resultPayload = parseResultJson((resultJson ?? result) as string | Record<string, unknown> | undefined);
    
    // 提取错误信息
    const extractedErrorMessage = typeof error === 'string' ? error
      : typeof errorMessage === 'string' ? errorMessage
      : typeof errorMsg === 'string' ? errorMsg
      : typeof message === 'string' ? message
      : typeof msg === 'string' ? msg
      : undefined;
    
    console.log('🔄 Processing results:', {
      resolvedState,
      mapped,
      resultPayload,
      rawResultJson: resultJson,
      rawResult: result
    });

    // 尝试多种方式提取视频URL
    let primaryUrl = resultPayload.resultUrls?.[0]
      ?? resultPayload.resultUrl
      ?? resultPayload.mediaUrl
      ?? resultPayload.resourceUrl
      ?? resultPayload.videoUrl
      ?? resultPayload.outputUrl
      ?? resultPayload.downloadUrl
      ?? resultPayload.fileUrl
      ?? resultPayload.url
      ?? (typeof resultUrl === 'string' ? resultUrl : undefined)
      ?? (typeof mediaUrl === 'string' ? mediaUrl : undefined)
      ?? (typeof resourceUrl === 'string' ? resourceUrl : undefined);
    
    // 如果resultJson是数组格式，直接解析
    if (!primaryUrl && resultJson && typeof resultJson === 'string') {
      try {
        const parsed = JSON.parse(resultJson);
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
          primaryUrl = parsed[0];
          console.log('🎯 Found URL in array format:', primaryUrl);
        }
      } catch (e) {
        // 忽略解析错误
      }
    }
    
    console.log('🎯 URL extraction:', {
      primaryUrl,
      resultPayloadResultUrls: resultPayload.resultUrls,
      resultPayloadResultUrl: resultPayload.resultUrl,
      resultPayloadMediaUrl: resultPayload.mediaUrl,
      resultPayloadResourceUrl: resultPayload.resourceUrl,
      resultPayloadVideoUrl: resultPayload.videoUrl,
      resultPayloadOutputUrl: resultPayload.outputUrl,
      resultPayloadDownloadUrl: resultPayload.downloadUrl,
      resultPayloadFileUrl: resultPayload.fileUrl,
      resultPayloadUrl: resultPayload.url,
      directResultUrl: resultUrl,
      directMediaUrl: mediaUrl,
      directResourceUrl: resourceUrl
    });

    // Conform to frontend expectations in src/services/videoApi.ts
    // It checks for status === 'completed' | 'success' or presence of video_url
    const statusForClient = mapped === 'completed' ? 'completed' : mapped === 'failed' ? 'failed' : 'processing';
    
    // Calculate progress - if we have a video URL and status is completed, set to 100%
    let calculatedProgress = typeof progress === 'number' ? progress : undefined;
    if (mapped === 'completed' && primaryUrl) {
      calculatedProgress = 100;
    }
    
    // 转换createTime为ISO字符串
    const createdAt = typeof createTime === 'number' 
      ? new Date(createTime).toISOString()
      : new Date().toISOString();

    // 更新数据库中的作业状态
    if (mapped === 'completed' || mapped === 'failed') {
      try {
        const { error: updateError } = await supabase
          .from('video_jobs')
          .update({
            status: mapped === 'completed' ? 'completed' : 'failed',
            result_url: primaryUrl || null,
            error_message: extractedErrorMessage || null,
            updated_at: new Date().toISOString()
          })
          .eq('job_id', id);

        if (updateError) {
          console.error('❌ Failed to update job status in database:', updateError);
        } else {
          console.log('✅ Updated job status in database:', {
            job_id: id,
            status: mapped,
            result_url: primaryUrl
          });
        }
      } catch (dbError) {
        console.error('❌ Database update error:', dbError);
      }
    }

    const response = {
      generation_id: id,
      status: statusForClient,
      video_url: primaryUrl,
      thumbnail_url: primaryUrl,
      progress: calculatedProgress,
      created_at: createdAt, // 使用KIE API的实际创建时间
      updated_at: new Date().toISOString(),
      error_message: extractedErrorMessage,
    };
    
    console.log('📤 Final response:', JSON.stringify(response, null, 2));

    return NextResponse.json(response);
  } catch (error) {
    console.error('[KIE STATUS] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

