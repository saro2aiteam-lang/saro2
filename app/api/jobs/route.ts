import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required Supabase environment variables');
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Get user from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get limit from query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch user's video jobs from database
    const { data: jobs, error: jobsError } = await supabase
      .from('video_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (jobsError) {
      console.error('Failed to fetch jobs:', jobsError);
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      );
    }

    // Convert database jobs to Job format, filtering out invalid jobs
    const formattedJobs = jobs
      .filter(job => job.job_id && job.job_id !== 'undefined' && job.job_id !== 'null')
      .map(job => ({
        jobId: job.job_id,
        status: job.status === 'completed' ? 'SUCCEEDED' : 
                job.status === 'failed' ? 'FAILED' : 
                job.status === 'processing' ? 'RUNNING' : 'PENDING',
        progress: job.progress || 0,
        result_url: job.result_url,
        preview_url: job.preview_url,
        created_at: job.created_at,
        updated_at: job.updated_at,
        visibility: 'private',
        creditCost: job.cost_credits || 0,
        params: {
          prompt: job.prompt || '',
          duration_sec: job.duration || 10,
          aspect_ratio: job.aspect_ratio || '16:9',
          cfg_scale: 7,
        },
        error: job.error_message ? {
          code: 'API_ERROR',
          message: job.error_message,
        } : undefined,
      }));

    console.log(`[JOBS API] Returning ${formattedJobs.length} jobs for user ${user.id}`);

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
      count: formattedJobs.length
    });

  } catch (error) {
    console.error('Jobs API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
