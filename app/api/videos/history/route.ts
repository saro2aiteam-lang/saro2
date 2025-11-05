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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Log request
    console.log(`[API] Get generation history - userId: ${userId}, limit: ${limit}, offset: ${offset}`);

    // Query video jobs from database
    const { data: jobs, error: jobsError } = await getSupabaseAdmin()
      .from('video_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (jobsError) {
      console.error(`[API ERROR] Get generation history failed - userId: ${userId}:`, jobsError);
      return NextResponse.json(
        { error: 'Failed to load generation history' },
        { status: 500 }
      );
    }

    // Map database fields to API response format
    const mappedJobs = (jobs || []).map(job => {
      // Calculate duration in seconds from the job data
      const duration = job.duration || 8;
      
      // Format creation date
      const createdAt = new Date(job.created_at).toISOString();
      const updatedAt = new Date(job.updated_at).toISOString();
      
      // Determine status
      let status = 'processing';
      if (job.status === 'completed' && job.result_url) {
        status = 'completed';
      } else if (job.status === 'failed' || job.error_message) {
        status = 'failed';
      } else if (job.status === 'pending') {
        status = 'queued';
      }

      return {
        id: job.id,
        jobId: job.job_id,
        prompt: job.prompt || '',
        imageUrl: job.image_url,
        aspectRatio: job.aspect_ratio || '16:9',
        duration: duration,
        resolution: '1080p', // Default resolution
        model: 'sora-2-text-to-video', // Default model
        status: status,
        creditsUsed: job.cost_credits || 30,
        videoUrl: job.result_url,
        thumbnailUrl: job.preview_url,
        errorMessage: job.error_message,
        createdAt: createdAt,
        updatedAt: updatedAt,
        completedAt: status === 'completed' ? updatedAt : null
      };
    });

    // Get total count for pagination
    const { count, error: countError } = await getSupabaseAdmin()
      .from('video_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      console.error(`[API ERROR] Get count failed - userId: ${userId}:`, countError);
    }

    return NextResponse.json({ 
      jobs: mappedJobs,
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + limit
    });

  } catch (error) {
    console.error('Get generation history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
