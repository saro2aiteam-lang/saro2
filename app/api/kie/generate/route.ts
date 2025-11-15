import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { refundCredits } from '@/lib/credits';

export const runtime = 'nodejs';

// 服务器端环境变量
const KIE_API_KEY = process.env.KIE_API_KEY;
const KIE_API_BASE_URL = (process.env.KIE_API_BASE_URL || 'https://api.kie.ai').trim();

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 验证必需的环境变量
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required Supabase environment variables');
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// 验证 API Key
if (!KIE_API_KEY) {
  console.error('KIE_API_KEY is not configured in server environment');
}

export async function POST(request: NextRequest) {
  let creditsDeducted = false;
  let deductedAmount = 0;
  let userId = '';
  
  try {
    // 1. 验证环境变量
    if (!KIE_API_KEY) {
      return NextResponse.json(
        { error: 'Kie API key not configured' },
        { status: 500 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // 2. 获取请求数据
    const body = await request.json();
    const { prompt, negative_prompt, duration, resolution, model, aspect_ratio, style, image_url } = body;

    // 3. 验证必需参数
    if (!prompt || !duration || !resolution || !model) {
      return NextResponse.json(
        { error: 'Missing required parameters: prompt, duration, resolution, model' },
        { status: 400 }
      );
    }

    // 4. 获取用户信息（从 Authorization header）
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    // 5. 验证用户身份
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    userId = user.id;

    // 6. 统一的订阅和积分校验
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits_balance, credits_total, credits_spent, subscription_plan, subscription_status')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 检查积分余额
    const requiredCredits = calculateCredits(duration, resolution, model);
    
    if (userData.credits_balance < requiredCredits) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits', 
          required: requiredCredits, 
          available: userData.credits_balance,
          details: 'Please purchase credits or subscribe to a plan'
        },
        { status: 402 }
      );
    }

    // 检查订阅状态（作为额外验证，但不是强制要求）
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 如果用户有积分但订阅状态异常，记录警告但不阻止
    if (userData.credits_balance >= requiredCredits) {
      if (!subscription || subscription.status !== 'active') {
        console.warn(`[API] User ${user.id} has credits but subscription status is inactive:`, {
          subscription_plan: userData.subscription_plan,
          subscription_status: userData.subscription_status,
          subscription_record: subscription
        });
      }
    }

    // 7. 使用事务安全的积分扣除
    try {
      const { data: debitResult, error: debitError } = await supabase.rpc('debit_user_credits_transaction', {
        p_user_id: userId,
        p_amount: requiredCredits,
        p_reason: 'video_generation',
        p_metadata: {
          prompt,
          duration,
          resolution,
          model,
          status: 'processing'
        }
      });

      if (debitError) {
        console.error('Failed to deduct credits:', debitError);
        if (debitError.code === 'P0008') {
          return NextResponse.json(
            { error: 'Insufficient credits' },
            { status: 402 }
          );
        }
        // 返回更详细的错误信息
        const errorDetails = debitError.message || debitError.details || 'Unknown database error';
        return NextResponse.json(
          { 
            error: 'Failed to deduct credits',
            details: errorDetails,
            code: debitError.code || 'UNKNOWN',
            hint: debitError.code === 'P0005' ? 'User not found in database' 
                  : debitError.code === 'P0007' ? 'Database update failed' 
                  : debitError.code === 'P0003' ? 'Invalid credit amount' 
                  : 'Please try again or contact support'
          },
          { status: 500 }
        );
      }

      creditsDeducted = true;
      deductedAmount = requiredCredits;
      
      console.log(`[API] Successfully deducted ${requiredCredits} credits from user ${userId}`);
    } catch (error) {
      console.error('Credit deduction failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        { 
          error: 'Failed to deduct credits',
          details: errorMessage,
          hint: 'This may be due to a database connection issue. Please try again.'
        },
        { status: 500 }
      );
    }

    // 8. 调用 Kie API
    // 确定模型类型
    const kieModel = model === 'image-to-video' ? 'sora-2-image-to-video' : 'sora-2-text-to-video';
    
    // 构建请求体
    const requestBody: any = {
      model: kieModel,
      input: {
        prompt,
        aspect_ratio: aspect_ratio === '16:9' ? 'landscape' : 'portrait',
      },
    };

    // 如果是image-to-video模式，添加图片URL
    if (model === 'image-to-video' && image_url) {
      requestBody.input.image_urls = [image_url];
    }

    console.log('Kie API request body:', JSON.stringify(requestBody, null, 2));

    const kieResponse = await fetch(`${normalizeBaseUrl(KIE_API_BASE_URL)}/api/v1/jobs/createTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'X-API-Key': KIE_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!kieResponse.ok) {
      const errorData = await kieResponse.json().catch(() => ({}));
      console.error('Kie API error:', errorData);
      
      // Kie API失败，退还积分
      if (creditsDeducted) {
        try {
          await refundCredits(userId, deductedAmount, 'kie_api_failed', {
            kie_status: kieResponse.status,
            kie_error: errorData,
            original_metadata: { prompt, duration, resolution, model }
          });
          
          console.log(`[API] Refunded ${deductedAmount} credits to user ${userId} due to Kie API failure`);
        } catch (refundError) {
          console.error('[API] Failed to refund credits:', refundError);
          // 记录到失败表，等待手动处理
          await supabase.from('failed_generations').insert({
            user_id: userId,
            prompt,
            duration,
            resolution,
            model,
            credits_deducted: deductedAmount,
            error_message: `Kie API failed (${kieResponse.status}): ${JSON.stringify(errorData)}`,
            status: 'pending'
          });
        }
      }
      
      return NextResponse.json(
        { 
          error: 'Video generation service temporarily unavailable', 
          details: errorData,
          credits_refunded: creditsDeducted ? deductedAmount : 0
        },
        { status: 503 }
      );
    }

    const kieData = await kieResponse.json();
    console.log('Kie API response:', JSON.stringify(kieData, null, 2));

    const taskId = extractTaskId(kieData);
    const kieStatusCode = extractStatusCode(kieData);
    const kieStatusText = extractStatusText(kieData);
    const kieSuccessFlag = isKieSuccess(kieData);

    if (!kieSuccessFlag && !taskId) {
      console.error('Unexpected Kie API response shape:', kieData);
      const status = inferErrorStatus(kieStatusCode);
      return NextResponse.json(
        {
          error: 'Kie API error',
          details: kieStatusText || 'Unexpected response from Kie API',
          response: kieData,
        },
        { status }
      );
    }

    if (!taskId) {
      console.error('Missing taskId in Kie API response:', kieData);
      const status = inferErrorStatus(kieStatusCode);
      return NextResponse.json(
        {
          error: 'Invalid Kie API response',
          details: kieStatusText || 'Missing task identifier',
          response: kieData,
        },
        { status }
      );
    }

    console.log('✅ Successfully got taskId from Kie API:', taskId);

    // 12. 保存作业到数据库
    const { error: jobError } = await supabase
      .from('video_jobs')
      .insert({
        job_id: taskId,  // 使用job_id而不是id
        user_id: user.id,
        prompt: prompt,
        image_url: image_url || null,  // 使用image_url而不是reference_image_url
        aspect_ratio: aspect_ratio,
        duration: duration,  // 使用duration而不是duration_sec
        status: 'processing',
        result_url: null,
        preview_url: null,
        error_message: null,
        cost_credits: requiredCredits,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (jobError) {
      console.error('Failed to save job to database:', jobError);
      // 注意：KIE API已成功，但数据库保存失败
      // 在生产环境中应该实现补偿机制
    } else {
      console.log('✅ Job saved to database:', taskId);
    }

    // 13. 更新交易记录（将生成 ID 写入最近一次扣款交易）
    try {
      const { data: tx, error: txSelectError } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('transaction_type', 'debit')
        .eq('reason', 'video_generation')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (txSelectError) {
        console.error('Failed to locate last debit transaction:', txSelectError);
      } else if (tx?.id) {
        const { error: updateError } = await supabase
          .from('credit_transactions')
          .update({
            metadata: {
              generation_id: taskId,
              prompt,
              duration,
              resolution,
              model,
              kie_api_response: kieData,
              status: 'processing'
            }
          })
          .eq('id', tx.id);

        if (updateError) {
          console.error('Failed to update transaction:', updateError);
        }
      }
    } catch (e) {
      console.error('Unexpected error updating last debit transaction:', e);
    }

    // 14. 返回结果
    return NextResponse.json({
      success: true,
      generation_id: taskId,
      status: 'processing',
      message: 'Video generation started successfully',
      credits_consumed: requiredCredits,
      user_credits_remaining: userData.credits_balance - requiredCredits,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Kie API route error:', error);
    
    // 如果积分已扣除但出现其他错误，退还积分
    if (creditsDeducted && userId) {
      try {
        await refundCredits(userId, deductedAmount, 'generation_error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          original_metadata: { prompt, duration, resolution, model }
        });
        
        console.log(`[API] Refunded ${deductedAmount} credits to user ${userId} due to generation error`);
      } catch (refundError) {
        console.error('[API] Failed to refund credits:', refundError);
        // 记录到失败表，等待手动处理
        try {
          await supabase?.from('failed_generations').insert({
            user_id: userId,
            prompt: 'Unknown',
            duration: 0,
            resolution: 'Unknown',
            model: 'Unknown',
            credits_deducted: deductedAmount,
            error_message: `Generation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            status: 'pending'
          });
        } catch (insertError) {
          console.error('[API] Failed to record failed generation:', insertError);
        }
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        credits_refunded: creditsDeducted ? deductedAmount : 0
      },
      { status: 500 }
    );
  }
}

// 计算所需积分的函数
function calculateCredits(duration: number, resolution: string, model: string): number {
  // 基础积分
  let baseCredits = 30;
  
  // 根据时长调整
  if (duration > 10) {
    baseCredits += (duration - 10) * 2;
  }
  
  // 根据分辨率调整
  if (resolution === '1080p') {
    baseCredits *= 1.5;
  } else if (resolution === '4K') {
    baseCredits *= 2;
  }
  
  // 根据模型调整
  if (model.includes('fast')) {
    baseCredits *= 0.8;
  } else if (model.includes('standard')) {
    baseCredits *= 1.2;
  }
  
  return Math.round(baseCredits);
}

function normalizeBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, '');
  if (trimmed.endsWith('/api/v1')) {
    return trimmed.slice(0, -7);
  }
  return trimmed;
}

function isKieSuccess(response: unknown) {
  const code = extractStatusCode(response);
  if (typeof code === 'number') {
    if (code === 200 || code === 0) return true;
    if (code >= 200 && code < 300) return true;
  }

  if (!response || typeof response !== 'object') return false;
  const payload = response as Record<string, unknown>;
  if (payload.success === true) return true;
  if (typeof payload.msg === 'string' && payload.msg.trim().toLowerCase() === 'success') return true;

  return false;
}

function extractStatusText(response: unknown) {
  if (!response || typeof response !== 'object') return undefined;
  const payload = response as Record<string, unknown>;
  const msg = payload.msg ?? payload.message ?? payload.error;
  return typeof msg === 'string' ? msg : undefined;
}

function extractTaskId(response: unknown) {
  if (!response || typeof response !== 'object') return undefined;
  const payload = response as Record<string, unknown>;
  const data = payload.data;

  if (data && typeof data === 'object') {
    const taskPayload = data as Record<string, unknown>;
    const candidate =
      taskPayload.taskId ??
      taskPayload.task_id ??
      taskPayload.id ??
      taskPayload.jobId ??
      taskPayload.job_id;
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  const rootCandidate =
    payload.taskId ??
    payload.task_id ??
    payload.id ??
    payload.jobId ??
    payload.job_id;

  if (typeof rootCandidate === 'string' && rootCandidate.trim().length > 0) {
    return rootCandidate.trim();
  }

  return undefined;
}

function inferErrorStatus(code: number | null) {
  if (typeof code === 'number') {
    if (code >= 100 && code <= 599) return code;
    const parsed = Number.parseInt(String(code), 10);
    if (!Number.isNaN(parsed) && parsed >= 100 && parsed <= 599) return parsed;
  }
  return 502;
}

function extractStatusCode(response: unknown): number | null {
  if (!response || typeof response !== 'object') return null;
  const payload = response as Record<string, unknown>;
  const raw =
    payload.code ??
    payload.statusCode ??
    payload.status_code ??
    payload.status ??
    payload.state;

  if (typeof raw === 'number') {
    return raw;
  }

  if (typeof raw === 'string') {
    const parsed = Number.parseInt(raw.trim(), 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
}
