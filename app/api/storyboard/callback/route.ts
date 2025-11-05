import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { SoraTaskStatus } from '@/types/storyboard';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const callbackData: SoraTaskStatus = JSON.parse(body);
    
    console.log(`[API] Received Kie.ai callback:`, JSON.stringify(callbackData, null, 2));

    // Validate callback data
    if (!callbackData.data?.taskId) {
      console.error(`[API ERROR] Invalid callback data:`, callbackData);
      return NextResponse.json(
        { error: 'Invalid callback data' },
        { status: 400 }
      );
    }

    const taskData = callbackData.data;
    const taskId = taskData.taskId;

    // Find the job record
    const { data: jobRecord, error: jobError } = await getSupabaseAdmin()
      .from('video_jobs')
      .select('*')
      .eq('job_id', taskId)
      .single();

    if (jobError || !jobRecord) {
      console.error(`[API ERROR] Job not found for callback - taskId: ${taskId}:`, jobError);
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Map Kie.ai state to our internal status
    let internalStatus: 'pending' | 'processing' | 'completed' | 'failed';
    let progress = 0;
    let videoUrl: string | undefined;
    let error: string | undefined;

    switch (taskData.state) {
      case 'waiting':
        internalStatus = 'pending';
        progress = 10;
        break;
      case 'queuing':
        internalStatus = 'processing';
        progress = 25;
        break;
      case 'generating':
        internalStatus = 'processing';
        progress = 50;
        break;
      case 'success':
        internalStatus = 'completed';
        progress = 100;
        
        // Parse result URLs from resultJson
        if (taskData.resultJson) {
          try {
            const resultData = JSON.parse(taskData.resultJson);
            if (resultData.resultUrls && resultData.resultUrls.length > 0) {
              videoUrl = resultData.resultUrls[0]; // Use first video URL
            }
          } catch (parseError) {
            console.error(`[API ERROR] Failed to parse resultJson:`, parseError);
          }
        }
        break;
      case 'fail':
        internalStatus = 'failed';
        progress = 0;
        error = taskData.failMsg || 'Task failed';
        break;
      default:
        internalStatus = 'processing';
        progress = 50;
    }

    // Update job record in database
    const updateData: any = {
      status: internalStatus,
      progress: progress,
      updated_at: new Date().toISOString()
    };

    if (videoUrl) {
      updateData.video_url = videoUrl;
    }

    if (error) {
      updateData.error = error;
    }

    // Store Kie.ai specific data
    // updateData.kie_state = taskData.state; // 临时注释掉，因为数据库表缺少此列
    if (taskData.resultJson) {
      updateData.kie_result_json = taskData.resultJson;
    }
    if (taskData.costTime) {
      updateData.kie_cost_time = taskData.costTime;
    }
    if (taskData.completeTime) {
      updateData.kie_complete_time = taskData.completeTime;
    }

    const { error: updateError } = await getSupabaseAdmin()
      .from('video_jobs')
      .update(updateData)
      .eq('job_id', taskId);

    if (updateError) {
      console.error(`[API ERROR] Failed to update job record - taskId: ${taskId}:`, updateError);
      return NextResponse.json(
        { error: 'Failed to update job record' },
        { status: 500 }
      );
    }

    console.log(`[API] Job updated successfully - taskId: ${taskId}, status: ${internalStatus}`);

    return NextResponse.json({
      success: true,
      taskId: taskId,
      status: internalStatus
    });

  } catch (error) {
    console.error('[API ERROR] Callback processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
