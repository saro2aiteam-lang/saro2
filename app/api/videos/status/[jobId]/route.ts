import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { creditCredits } from '@/lib/credits';
import { rateLimit, apiRateLimiter } from '@/lib/rate-limiter';
import { mapKieStateToJobStatus, parseResultJson } from '@/lib/kie';
import { getErrorMessage, isRetryableError, isContentPolicyError } from '@/lib/kie-errors';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // Rate limiting
    const rateLimitResponse = await rateLimit(request, apiRateLimiter);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Get authenticated user from session
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
      console.error('[API ERROR] Status authentication failed:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Query job from database and verify ownership
    const { data: job, error: jobError } = await getSupabaseAdmin()
      .from('video_jobs')
      .select('*')
      .eq('job_id', jobId)
      .eq('user_id', userId)  // Verify user owns this job
      .single();

    if (jobError || !job) {
      console.error(`[API ERROR] Job not found or unauthorized - userId: ${userId}, jobId: ${jobId}:`, jobError);
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      );
    }

    let currentJob = job;

    // If job is still pending/processing, sync with kie.ai
    if (!['completed', 'failed', 'canceled'].includes(job.status)) {
      try {
        const apiBase = process.env.KIE_API_BASE_URL;
        if (!apiBase) {
          throw new Error('KIE_API_BASE_URL not configured');
        }
        const statusUrl = `${apiBase}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(jobId)}`;
        const apiKey = process.env.KIE_API_KEY;
        if (!apiKey) {
          throw new Error('KIE_API_KEY not configured');
        }
        const headers: Record<string, string> = {
          Authorization: `Bearer ${apiKey}`,
          'X-API-Key': apiKey,
        };

        console.log(`[API DEBUG] Checking kie.ai status for job: ${jobId}`);
        const kieStatusResponse = await fetch(statusUrl, { headers });
        
        if (kieStatusResponse.ok) {
          const kieStatusData = await kieStatusResponse.json();
          console.log(`[API DEBUG] Raw kie.ai response for ${jobId}:`, JSON.stringify(kieStatusData, null, 2));
          
          if (kieStatusData?.data) {
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
              failMsg,
              failCode,
              progress: progressField,
            } = kieStatusData.data as Record<string, unknown>;

            const resolvedState = (state ?? statusField ?? taskStatus ?? taskState) as string | undefined;
            const mappedStatus = mapKieStateToJobStatus(resolvedState);
            const resultPayload = parseResultJson((resultJson ?? result) as string | Record<string, unknown> | undefined);

            console.log(`[API DEBUG] Status mapping for ${jobId}:`, {
              resolvedState,
              mappedStatus,
              progressField,
              failMsg,
              hasResult: !!resultPayload.resultUrl || !!resultPayload.resultUrls?.length,
              resultPayload: JSON.stringify(resultPayload, null, 2)
            });

            const primaryUrl = resultPayload.resultUrls?.[0]
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

            const updatePayload: Record<string, any> = {
              status: mappedStatus === 'completed' ? 'SUCCEEDED' : mappedStatus === 'failed' ? 'FAILED' : mappedStatus === 'processing' ? 'RUNNING' : mappedStatus,
              updated_at: new Date().toISOString(),
            };

            if (mappedStatus === 'completed') {
              if (primaryUrl) {
                updatePayload.result_url = primaryUrl;
                updatePayload.preview_url = primaryUrl;
                console.log(`[API DEBUG] Job ${jobId} completed with URL: ${primaryUrl}`);
              } else {
                console.warn(`[API DEBUG] Job ${jobId} marked as completed but no URL found`);
              }
              updatePayload.progress = 100;
              updatePayload.error_message = null;
            } else if (mappedStatus === 'processing') {
              updatePayload.progress = typeof progressField === 'number' ? progressField : 50;
              updatePayload.error_message = null;
            } else if (mappedStatus === 'failed') {
              // 获取用户友好的错误消息
              const errorMessage = getErrorMessage(failCode as string, failMsg as string);
              updatePayload.error_message = errorMessage;
              updatePayload.progress = 100;
              
              console.log(`[API DEBUG] Job ${jobId} failed:`, {
                failCode,
                failMsg,
                errorMessage,
                isRetryable: isRetryableError(failCode as string),
                isContentPolicy: isContentPolicyError(failCode as string)
              });
              
              // Refund credits when job fails
              try {
                await creditCredits(job.user_id, job.cost_credits, 'generation_failed', {
                  job_id: jobId,
                  fail_code: failCode as string,
                  fail_msg: failMsg as string,
                  error: errorMessage,
                  is_retryable: isRetryableError(failCode as string),
                  is_content_policy: isContentPolicyError(failCode as string)
                });
                console.log(`[API DEBUG] Credits refunded for failed job ${jobId}: ${job.cost_credits} credits`);
              } catch (refundError) {
                console.error(`[API ERROR] Failed to refund credits for job ${jobId}:`, refundError);
              }
            }

            const { data: refreshedJob, error: updateError } = await getSupabaseAdmin()
              .from('video_jobs')
              .update(updatePayload)
              .eq('id', job.id)
              .select()
              .single();

            if (!updateError && refreshedJob) {
              currentJob = refreshedJob;
              console.log(`[API DEBUG] Job ${jobId} updated successfully to status: ${refreshedJob.status}`);
            } else {
              console.error(`[API ERROR] Failed to update job ${jobId}:`, updateError);
            }
          } else {
            console.warn(`[API DEBUG] No data in kie.ai response for job ${jobId}`);
          }
        } else {
          const errorText = await kieStatusResponse.text();
          console.error(`[API ERROR] Failed to fetch kie.ai status - jobId: ${jobId}, status: ${kieStatusResponse.status}, error: ${errorText}`);
        }
      } catch (syncError) {
        console.error(`[API ERROR] Sync with kie.ai failed - jobId: ${jobId}:`, syncError);
      }
    }

    console.log(`[API] Get job status - userId: ${userId}, jobId: ${jobId}, status: ${currentJob.status}`);

    // Map database fields to API response
    const mapDbStatusToApiStatus = (dbStatus: string) => {
      switch (dbStatus?.toLowerCase()) {
        case 'completed':
          return 'SUCCEEDED';
        case 'failed':
          return 'FAILED';
        case 'processing':
          return 'RUNNING';
        case 'queued':
          return 'QUEUED';
        case 'pending':
          return 'PENDING';
        case 'canceled':
          return 'CANCELED';
        default:
          return dbStatus?.toUpperCase() || 'PENDING';
      }
    };

    return NextResponse.json({
      job_id: currentJob.job_id,
      status: mapDbStatusToApiStatus(currentJob.status),
      progress: currentJob.progress || 0,
      result_url: currentJob.result_url,
      preview_url: currentJob.preview_url,
      prompt: currentJob.prompt,
      duration: currentJob.duration || 10,
      aspect_ratio: currentJob.aspect_ratio,
      created_at: currentJob.created_at,
      updated_at: currentJob.updated_at,
      error_message: currentJob.error_message,
      cost_credits: currentJob.cost_credits || 0,
    });

  } catch (error) {
    console.error('Get job status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
