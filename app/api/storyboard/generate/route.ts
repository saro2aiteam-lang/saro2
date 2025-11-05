import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit, videoGenerationRateLimiter } from '@/lib/rate-limiter';
import { SoraStoryboardRequest, SoraStoryboardResponse } from '@/types/storyboard';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Parse FormData to handle file upload
    const formData = await request.formData();
    const shots = JSON.parse(formData.get('shots') as string);
    const n_frames = formData.get('n_frames') as string;
    const aspect_ratio = formData.get('aspect_ratio') as string;
    const imageFile = formData.get('image_file') as File | null;
    
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
      console.error('[API ERROR] Storyboard generation authentication failed:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Rate limiting check (5 requests per minute per user)
    const rateLimitResponse = await rateLimit(request, videoGenerationRateLimiter, userId);
    
    if (rateLimitResponse) {
      console.log(`[API] Rate limit hit - userId: ${userId}`);
      return rateLimitResponse;
    }

    // Validate input
    if (!shots || !Array.isArray(shots) || shots.length === 0) {
      return NextResponse.json(
        { error: 'At least one shot is required' },
        { status: 400 }
      );
    }

    if (!n_frames || !["10", "15", "25"].includes(n_frames)) {
      return NextResponse.json(
        { error: 'Invalid n_frames. Must be "10", "15", or "25"' },
        { status: 400 }
      );
    }

    if (!aspect_ratio || !['portrait', 'landscape'].includes(aspect_ratio)) {
      return NextResponse.json(
        { error: 'Aspect ratio must be portrait or landscape' },
        { status: 400 }
      );
    }

    // Validate shots
    for (const shot of shots) {
      if (!shot.prompt || !shot.prompt.trim()) {
        return NextResponse.json(
          { error: 'All shots must have a prompt' },
          { status: 400 }
        );
      }
      if (!shot.duration || shot.duration < 1) {
        return NextResponse.json(
          { error: 'All shots must have a duration of at least 1 second' },
          { status: 400 }
        );
      }
    }

    const totalUsedDuration = shots.reduce((sum: number, shot: any) => sum + shot.duration, 0);
    if (totalUsedDuration > parseInt(n_frames)) {
      return NextResponse.json(
        { error: 'Total shot duration exceeds maximum duration' },
        { status: 400 }
      );
    }

    console.log(`[API] Storyboard generation started - userId: ${userId}, shots: ${shots.length}, n_frames: ${n_frames}s`);

    // Ensure user exists
    const { data: userRecord, error: userError } = await getSupabaseAdmin()
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !userRecord) {
      console.error(`[API ERROR] User not found for storyboard generation - userId: ${userId}:`, userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate credit cost based on total duration
    const getCreditCost = (n_frames: string) => {
      switch (n_frames) {
        case "10": return 250;
        case "15": return 450;
        case "25": return 450;
        default: return 250;
      }
    };
    
    const creditCost = getCreditCost(n_frames);

    try {
      // Deduct credits first using the correct function name
      const { data: debitResult, error: creditError } = await getSupabaseAdmin()
        .rpc('debit_user_credits_transaction', {
          p_user_id: userId,
          p_amount: creditCost,
          p_reason: 'storyboard_generation'
        });

      if (creditError) {
        console.error(`[API ERROR] Credit deduction failed - userId: ${userId}:`, creditError);
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 402 }
        );
      }

      console.log(`[API] Credits deducted - userId: ${userId}, amount: ${creditCost}, new balance: ${debitResult?.[0]?.credits_balance}`);

    } catch (creditError) {
      console.error(`[API ERROR] Credit deduction failed - userId: ${userId}:`, creditError);
      return NextResponse.json(
        { error: 'Credit deduction failed' },
        { status: 500 }
      );
    }

    // Upload image file if provided
    let imageUrls: string[] = [];
    if (imageFile) {
      try {
        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const fileExtension = imageFile.name.split('.').pop() || 'bin';
        const fileName = `storyboard/${userId}/${timestamp}-${randomStr}.${fileExtension}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await getSupabaseAdmin().storage
          .from('videos')
          .upload(fileName, imageFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('[API ERROR] Image upload failed:', uploadError);
          throw new Error('Failed to upload image');
        }

        // Get public URL
        const { data: urlData } = getSupabaseAdmin().storage
          .from('videos')
          .getPublicUrl(fileName);

        imageUrls = [urlData.publicUrl];
        console.log(`[API] Image uploaded successfully: ${urlData.publicUrl}`);
      } catch (uploadError) {
        console.error('[API ERROR] Image upload failed:', uploadError);
        throw new Error('Failed to upload image');
      }
    }

    // Call Kie.ai Sora 2 Pro Storyboard API
    try {
      const apiBase = process.env.KIE_API_BASE_URL;
      if (!apiBase) {
        throw new Error('KIE_API_BASE_URL not configured');
      }
      
      // Use Sora 2 Pro Storyboard endpoint
      const kieApiUrl = `${apiBase}/api/v1/jobs/createTask`;
      
      console.log(`[API] Calling Kie.ai Sora 2 Pro Storyboard API: ${kieApiUrl}`);
      console.log(`[API] API Base: ${apiBase}`);
      
      // Build request body according to Sora 2 Pro Storyboard API spec
      const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://saro2.ai'}/api/storyboard/callback`;
      
      const requestBody = {
        model: 'sora-2-pro-storyboard',
        input: {
          shots: shots.map(shot => ({
            Scene: shot.prompt,
            duration: shot.duration
          })),
          n_frames: n_frames,
          image_urls: imageUrls,
          aspect_ratio: aspect_ratio,
        },
        callBackUrl: callbackUrl,
      };

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

      console.log(`[API] Kie.ai response status: ${kieResponse.status}`);

      if (!kieResponse.ok) {
        const errorText = await kieResponse.text();
        console.error(`[API] Kie.ai API error response:`, errorText);
        
        // Refund credits on API failure
        await getSupabaseAdmin()
          .rpc('credit_user_credits_transaction', {
            p_user_id: userId,
            p_amount: creditCost,
            p_reason: 'storyboard_generation_refund'
          });
        
        throw new Error(`Kie.ai API error: ${kieResponse.status} - ${errorText}`);
      }

      const kieData: SoraStoryboardResponse = await kieResponse.json();
      console.log(`[API] Kie.ai response data:`, JSON.stringify(kieData, null, 2));

      // Handle Kie.ai API response format according to Sora 2 Pro Storyboard spec
      if (kieData.code !== 200 || !kieData.data?.taskId) {
        console.error(`[API] Kie.ai API response error:`, kieData);
        
        // Refund credits on invalid response
        await getSupabaseAdmin()
          .rpc('credit_user_credits_transaction', {
            p_user_id: userId,
            p_amount: creditCost,
            p_reason: 'storyboard_generation_refund'
          });
        
        throw new Error(`Kie.ai API error: ${kieData.msg || 'Invalid response'}`);
      }

      // Create job record in database
      const { data: jobRecord, error: jobError } = await getSupabaseAdmin()
        .from('video_jobs')
        .insert({
          user_id: userId,
          job_id: kieData.data.taskId, // Use taskId from Kie.ai response
          status: 'pending',
          progress: 0,
          // params: {  // 临时注释掉，因为数据库表缺少此列
          //   shots,
          //   n_frames,
          //   aspect_ratio,
          //   image_urls: imageUrls,
          //   mode: 'storyboard'
          // },
          cost_credits: creditCost,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (jobError) {
        console.error(`[API ERROR] Job creation failed - userId: ${userId}:`, jobError);
        
        // Refund credits on job creation failure
        await getSupabaseAdmin()
          .rpc('credit_user_credits_transaction', {
            p_user_id: userId,
            p_amount: creditCost,
            p_reason: 'storyboard_generation_refund'
          });
        
        throw new Error('Failed to create job record');
      }

      console.log(`[API] Job created successfully - taskId: ${kieData.data.taskId}, userId: ${userId}`);

      return NextResponse.json({
        jobId: kieData.data.taskId, // Return taskId as jobId for compatibility
        taskId: kieData.data.taskId, // Also return as taskId
        status: 'pending',
        message: 'Sora 2 Pro Storyboard generation started'
      });

    } catch (apiError) {
      console.error(`[API ERROR] Kie.ai Sora 2 Pro Storyboard API call failed - userId: ${userId}:`, apiError);
      
      // Refund credits on API failure
      try {
        await getSupabaseAdmin()
          .rpc('credit_user_credits_transaction', {
            p_user_id: userId,
            p_amount: creditCost,
            p_reason: 'storyboard_generation_refund'
          });
      } catch (refundError) {
        console.error(`[API ERROR] Credit refund failed - userId: ${userId}:`, refundError);
      }
      
      // 检查是否是API限制错误
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
      let userMessage = 'Sora 2 Pro Storyboard generation failed';
      
      if (errorMessage.includes('hourly limit')) {
        userMessage = 'API usage limit reached. Please try again in an hour.';
      } else if (errorMessage.includes('API error')) {
        userMessage = 'Service temporarily unavailable. Please try again later.';
      }
      
      return NextResponse.json(
        { error: userMessage },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[API ERROR] Storyboard generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
