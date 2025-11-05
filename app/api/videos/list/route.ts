import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createServerClient } from '@supabase/ssr';
import { rateLimit, apiRateLimiter } from '@/lib/rate-limiter';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await rateLimit(request, apiRateLimiter);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Get authenticated user from session (verified by middleware)
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
      console.error('Authentication failed:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Log request
    console.log(`[API] List videos - userId: ${userId}, limit: ${limit}`);

    // Query jobs from database
    const { data: jobs, error: jobsError } = await getSupabaseAdmin()
      .from('video_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (jobsError) {
      console.error(`[API ERROR] List videos failed - userId: ${userId}:`, jobsError);
      return NextResponse.json(
        { error: 'Failed to load jobs' },
        { status: 500 }
      );
    }

    // Map database fields to API response
    const mappedJobs = (jobs || []).map(job => {
      const statusMap: Record<string, string> = {
        pending: 'QUEUED',
        processing: 'RUNNING',
        completed: 'SUCCEEDED',
        failed: 'FAILED',
        canceled: 'CANCELED',
      };

      return {
        job_id: job.job_id,
        status: statusMap[job.status] || 'PENDING',
        progress: job.progress || 0,
        result_url: job.result_url,
        preview_url: job.preview_url,
        prompt: job.prompt,
        duration: job.duration || 10,
        aspect_ratio: job.aspect_ratio,
        created_at: job.created_at,
        updated_at: job.updated_at,
        visibility: job.visibility || 'private',
        cost_credits: job.cost_credits || 0,
      };
    });

    return NextResponse.json({ jobs: mappedJobs });

  } catch (error) {
    console.error('List jobs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
