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

function normalizeBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, '');
  return trimmed;
}

function calculateCredits(model: string, aspectRatio: string): number {
  // Veo3.1 基础积分
  let baseCredits = 60; // Veo3.1 默认成本
  
  // 根据模型调整
  if (model === 'veo3_fast') {
    baseCredits = 40; // Fast 模型更便宜
  } else if (model === 'veo3') {
    baseCredits = 60; // Quality 模型
  }
  
  // 根据宽高比调整（1080P 只在 16:9 支持）
  if (aspectRatio === '16:9') {
    // 16:9 支持 1080P，成本稍高
    baseCredits = Math.round(baseCredits * 1.1);
  }
  
  return baseCredits;
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
    const { 
      prompt, 
      model, 
      generationType, 
      aspectRatio, 
      imageUrls, 
      seeds, 
      enableTranslation, 
      watermark 
    } = body;

    // 3. 验证必需参数
    if (!prompt || !model || !generationType || !aspectRatio) {
      return NextResponse.json(
        { error: 'Missing required parameters: prompt, model, generationType, aspectRatio' },
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

    // 6. 获取用户积分信息
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits_balance, credits_total, credits_spent')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 7. 计算所需积分
    const requiredCredits = calculateCredits(model, aspectRatio);
    
    if (userData.credits_balance < requiredCredits) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          required: requiredCredits,
          available: userData.credits_balance
        },
        { status: 402 }
      );
    }

    // 8. 扣除积分
    try {
      const { data: debitResult, error: debitError } = await supabase.rpc('debit_user_credits_transaction', {
        p_user_id: userId,
        p_amount: requiredCredits,
        p_reason: 'veo3_video_generation',
        p_metadata: {
          prompt,
          model,
          generationType,
          aspectRatio,
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
        return NextResponse.json(
          { error: 'Failed to deduct credits' },
          { status: 500 }
        );
      }

      creditsDeducted = true;
      deductedAmount = requiredCredits;
      
      console.log(`[Veo3 API] Successfully deducted ${requiredCredits} credits from user ${userId}`);
    } catch (error) {
      console.error('Credit deduction failed:', error);
      return NextResponse.json(
        { error: 'Failed to deduct credits' },
        { status: 500 }
      );
    }

    // 9. 构建 Veo3.1 API 请求体
    const veo3RequestBody: any = {
      prompt,
      model, // 'veo3' or 'veo3_fast'
      generationType, // 'TEXT_2_VIDEO', 'FIRST_AND_LAST_FRAMES_2_VIDEO', 'REFERENCE_2_VIDEO'
      aspectRatio, // '16:9', '9:16', 'Auto'
      enableTranslation: enableTranslation !== false, // default true
    };

    // 添加可选参数
    if (imageUrls && imageUrls.length > 0) {
      veo3RequestBody.imageUrls = imageUrls;
    }

    if (seeds) {
      veo3RequestBody.seeds = seeds;
    }

    if (watermark) {
      veo3RequestBody.watermark = watermark;
    }

    console.log('[Veo3 API] Request body:', JSON.stringify(veo3RequestBody, null, 2));

    // 10. 调用 Kie Veo3.1 API
    const kieResponse = await fetch(`${normalizeBaseUrl(KIE_API_BASE_URL)}/api/v1/veo/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'X-API-Key': KIE_API_KEY,
      },
      body: JSON.stringify(veo3RequestBody),
    });

    if (!kieResponse.ok) {
      const errorData = await kieResponse.json().catch(() => ({}));
      console.error('[Veo3 API] Kie API error:', errorData);
      
      // Kie API失败，退还积分
      if (creditsDeducted) {
        try {
          await refundCredits(userId, deductedAmount, 'veo3_api_failed', {
            kie_status: kieResponse.status,
            kie_error: errorData,
            original_metadata: { prompt, model, generationType, aspectRatio }
          });
          
          console.log(`[Veo3 API] Refunded ${deductedAmount} credits to user ${userId} due to Kie API failure`);
        } catch (refundError) {
          console.error('[Veo3 API] Failed to refund credits:', refundError);
        }
      }
      
      return NextResponse.json(
        { 
          error: 'Veo3.1 video generation service temporarily unavailable', 
          details: errorData,
          credits_refunded: creditsDeducted ? deductedAmount : 0
        },
        { status: kieResponse.status >= 500 ? 503 : kieResponse.status }
      );
    }

    const kieData = await kieResponse.json();
    console.log('[Veo3 API] Kie API response:', JSON.stringify(kieData, null, 2));

    // 11. 提取 taskId
    const taskId = kieData?.data?.taskId || kieData?.taskId;
    
    if (!taskId) {
      console.error('[Veo3 API] Missing taskId in Kie API response:', kieData);
      
      // 退还积分
      if (creditsDeducted) {
        try {
          await refundCredits(userId, deductedAmount, 'veo3_missing_taskid', {
            kie_response: kieData
          });
        } catch (refundError) {
          console.error('[Veo3 API] Failed to refund credits:', refundError);
        }
      }
      
      return NextResponse.json(
        {
          error: 'Invalid response from Veo3.1 API',
          details: kieData,
        },
        { status: 500 }
      );
    }

    // 12. 保存任务记录到数据库
    await supabase.from('video_jobs').insert({
      user_id: userId,
      job_id: taskId,
      prompt,
      status: 'PENDING',
      progress: 0,
      params: {
        model,
        generationType,
        aspectRatio,
        imageUrls,
        seeds,
        enableTranslation,
        watermark
      },
      credit_cost: deductedAmount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // 13. 返回成功响应
    return NextResponse.json({
      code: 200,
      msg: 'success',
      data: {
        taskId: taskId,
        status: 'PENDING'
      }
    });

  } catch (error) {
    console.error('[Veo3 API] Route error:', error);
    
    // 如果积分已扣除但出现其他错误，退还积分
    if (creditsDeducted && userId) {
      try {
        await refundCredits(userId, deductedAmount, 'veo3_generation_error', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        console.log(`[Veo3 API] Refunded ${deductedAmount} credits to user ${userId} due to generation error`);
      } catch (refundError) {
        console.error('[Veo3 API] Failed to refund credits:', refundError);
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


