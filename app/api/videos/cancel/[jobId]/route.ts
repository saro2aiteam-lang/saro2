import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createServerClient } from '@supabase/ssr';
import { creditCredits } from '@/lib/credits';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
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
      console.error('[API ERROR] Cancel job authentication failed:', authError);
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

    // Check if job exists, is cancellable, and belongs to user
    const { data: job, error: jobError } = await getSupabaseAdmin()
      .from('video_jobs')
      .select('status, user_id, cost_credits')
      .eq('job_id', jobId)
      .single();

    if (jobError || !job) {
      console.error(`[API ERROR] Job not found for cancel - jobId: ${jobId}:`, jobError);
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Verify job ownership
    if (job.user_id !== userId) {
      console.error(`[API ERROR] Unauthorized cancel attempt - userId: ${userId}, jobId: ${jobId}, jobOwner: ${job.user_id}`);
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if job is in a cancellable state
    if (['completed', 'failed', 'canceled'].includes(job.status)) {
      return NextResponse.json(
        { error: 'Job cannot be canceled' },
        { status: 400 }
      );
    }

    // Update job status to canceled
    const { error: updateError } = await getSupabaseAdmin()
      .from('video_jobs')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('job_id', jobId);

    if (updateError) {
      console.error(`[API ERROR] Cancel job failed - userId: ${userId}, jobId: ${jobId}:`, updateError);
      return NextResponse.json(
        { error: 'Failed to cancel job' },
        { status: 500 }
      );
    }

    // Refund credits when job is canceled
    try {
      await creditCredits(userId, job.cost_credits, 'job_canceled', {
        job_id: jobId,
        original_status: job.status
      });
      console.log(`[API DEBUG] Credits refunded for canceled job ${jobId}: ${job.cost_credits} credits`);
    } catch (refundError) {
      console.error(`[API ERROR] Failed to refund credits for canceled job ${jobId}:`, refundError);
    }

    console.log(`[API] Job canceled successfully - userId: ${userId}, jobId: ${jobId}`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[API ERROR] Cancel job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

