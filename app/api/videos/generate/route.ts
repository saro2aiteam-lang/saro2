import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit, videoGenerationRateLimiter } from '@/lib/rate-limiter';
import { mapAspectRatioToKie, KieModel } from '@/lib/kie';
import { debitCredits, creditCredits } from '@/lib/credits';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from session (middleware already verified)
    const body = await request.text();
    const { prompt, imageUrl, aspectRatio, mode, cfgScale } = JSON.parse(body);
    
    // Create supabase client to get user from session
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
      console.error('[API ERROR] Video generation authentication failed:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Rate limiting check (5 requests per minute per user)
    const rateLimitResponse = await rateLimit(
      request,
      videoGenerationRateLimiter,
      userId
    );
    
    if (rateLimitResponse) {
      console.log(`[API] Rate limit hit - userId: ${userId}`);
      return rateLimitResponse;
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log(`[API] Video generation started - userId: ${userId}, mode: ${mode}, aspectRatio: ${aspectRatio}`);

    // Ensure user exists
    const { data: userRecord, error: userError } = await getSupabaseAdmin()
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !userRecord) {
      console.error(`[API ERROR] User not found for video generation - userId: ${userId}:`, userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const creditCost = 30;

    try {
      await debitCredits(userId, creditCost, 'video_generation', {
        mode,
        aspectRatio,
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'INSUFFICIENT_BALANCE') {
        console.log(`[API] Insufficient credits - userId: ${userId}`);
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 402 }
        );
      }
      throw err;
    }

    // Determine model based on mode
    const kieModel: KieModel = mode === 'reframe' ? 'sora-2-image-to-video' : 'sora-2-text-to-video';

    if (kieModel === 'sora-2-image-to-video' && !imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required for image-to-video generation' },
        { status: 400 }
      );
    }

    const mappedAspectRatio = mapAspectRatioToKie(aspectRatio);

    // Call kie.ai API
    try {
      const apiBase = process.env.KIE_API_BASE_URL;
      if (!apiBase) {
        throw new Error('KIE_API_BASE_URL not configured');
      }
      const kieApiUrl = `${apiBase}/api/v1/jobs/createTask`;
      
      console.log(`[API] Calling kie.ai API: ${kieApiUrl}`);
      console.log(`[API] API Base: ${apiBase}`);
      console.log(`[API] Model: ${kieModel}`);
      
      // Build request body according to kie.ai API documentation
      const requestBody: Record<string, any> = {
        model: kieModel, // Must be exactly 'sora-2-text-to-video' or 'sora-2-image-to-video'
        input: {
          prompt: prompt,
          aspect_ratio: mappedAspectRatio, // 'portrait' or 'landscape'
        },
      };

      // For image-to-video, add image_urls to input
      if (kieModel === 'sora-2-image-to-video' && imageUrl) {
        requestBody.input.image_urls = [imageUrl];
      }

      const apiKey = process.env.KIE_API_KEY;
      if (!apiKey) {
        throw new Error('KIE_API_KEY not configured');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-API-Key': apiKey,
      };

      console.log(`[API] Request body:`, JSON.stringify(requestBody, null, 2));
      console.log(`[API] Headers:`, { ...headers, Authorization: 'Bearer ***' });

      const kieResponse = await fetch(kieApiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      console.log(`[API] kie.ai response status: ${kieResponse.status}`);

      if (!kieResponse.ok) {
        const errorText = await kieResponse.text();
        console.error(`[API] kie.ai API error response:`, errorText);
        throw new Error(`kie.ai API error: ${kieResponse.status} - ${errorText}`);
      }

      const kieData = await kieResponse.json();
      console.log(`[API] kie.ai response data:`, JSON.stringify(kieData, null, 2));

      // Handle kie.ai API response format according to documentation
      if (kieData.code !== 200) {
        throw new Error(`kie.ai API error: ${kieData.msg || 'Unknown error'}`);
      }

      if (!kieData?.data?.taskId) {
        console.error(`[API] Unexpected kie.ai response format:`, kieData);
        throw new Error('kie.ai API response missing taskId');
      }

      const taskId: string = kieData.data.taskId;
      console.log(`[API] Task created successfully with ID: ${taskId}`);

      // Persist job with external task id
      const { data: jobData, error: jobError } = await getSupabaseAdmin()
        .from('video_jobs')
        .insert({
          user_id: userId,
          job_id: taskId,
          status: 'pending',
          prompt,
          image_url: imageUrl,
          aspect_ratio: aspectRatio || '16:9',
          cost_credits: creditCost,
        })
        .select()
        .single();

      if (jobError) {
        console.error(`[API ERROR] Job creation error - userId: ${userId}:`, jobError);
        return NextResponse.json(
          { error: 'Failed to create video job' },
          { status: 500 }
        );
      }

      console.log(`[API] Video job created - userId: ${userId}, jobId: ${taskId}`);

      // Update job with kie.ai response
      await getSupabaseAdmin()
        .from('video_jobs')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobData.id);

      console.log(`[API] Video generation queued - userId: ${userId}, jobId: ${taskId}`);

      return NextResponse.json({
        success: true,
        job_id: taskId,
        status: 'queued',
        message: 'Generation task created successfully',
      });

    } catch (apiError) {
      console.error(`[API ERROR] kie.ai API error - userId: ${userId}:`, apiError);
      // Refund credits on failure
      try {
        await creditCredits(userId, creditCost, 'video_generation_refund', {
          error: apiError instanceof Error ? apiError.message : 'unknown',
        });
      } catch (refundError) {
        console.error('[API ERROR] failed to refund credits', refundError);
      }
      return NextResponse.json(
        { error: 'Failed to generate video' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[API ERROR] Video generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
