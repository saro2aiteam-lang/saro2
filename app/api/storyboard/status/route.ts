import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { SoraTaskStatus } from '@/types/storyboard';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId parameter is required' },
        { status: 400 }
      );
    }

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
      console.error('[API ERROR] Task status authentication failed:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Verify the task belongs to the user
    const { data: jobRecord, error: jobError } = await getSupabaseAdmin()
      .from('video_jobs')
      .select('*')
      .eq('job_id', taskId)
      .eq('user_id', userId)
      .single();

    if (jobError || !jobRecord) {
      console.error(`[API ERROR] Job not found or access denied - taskId: ${taskId}, userId: ${userId}:`, jobError);
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      );
    }

    // Call Kie.ai API to get task status
    try {
      const apiBase = process.env.KIE_API_BASE_URL;
      if (!apiBase) {
        throw new Error('KIE_API_BASE_URL not configured');
      }
      
      const kieApiUrl = `${apiBase}/api/v1/jobs/recordInfo?taskId=${taskId}`;
      
      console.log(`[API] Querying Kie.ai task status: ${kieApiUrl}`);
      
      const apiKey = process.env.KIE_API_KEY;
      if (!apiKey) {
        throw new Error('KIE_API_KEY not configured');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-API-Key': apiKey,
      };

      const kieResponse = await fetch(kieApiUrl, {
        method: 'GET',
        headers,
      });

      console.log(`[API] Kie.ai status response: ${kieResponse.status}`);

      if (!kieResponse.ok) {
        const errorText = await kieResponse.text();
        console.error(`[API] Kie.ai API error response:`, errorText);
        throw new Error(`Kie.ai API error: ${kieResponse.status} - ${errorText}`);
      }

      const kieData: SoraTaskStatus = await kieResponse.json();
      console.log(`[API] Kie.ai status data:`, JSON.stringify(kieData, null, 2));

      // Handle Kie.ai API response format according to Sora 2 Pro Storyboard spec
      if (kieData.code !== 200) {
        console.error(`[API] Kie.ai API response error:`, kieData);
        throw new Error(`Kie.ai API error: ${kieData.msg || 'Invalid response'}`);
      }

      const taskData = kieData.data;
      
      // Map Kie.ai state to our internal status
      let internalStatus: 'pending' | 'processing' | 'completed' | 'failed';
      let progress = 0;
      let videoUrl: string | undefined;
      let error: string | undefined;

      // Debug: Log all task data
      console.log(`[API DEBUG] Kie.ai task data:`, {
        taskId: taskData.taskId,
        state: taskData.state,
        resultJson: taskData.resultJson,
        failCode: taskData.failCode,
        failMsg: taskData.failMsg,
        costTime: taskData.costTime,
        completeTime: taskData.completeTime,
        updateTime: taskData.updateTime,
        createTime: taskData.createTime
      });

      // Check for timeout (10 minutes)
      const now = Date.now();
      const taskAge = now - taskData.createTime;
      const timeoutMs = 10 * 60 * 1000; // 10 minutes
      
      if (taskAge > timeoutMs && taskData.state === 'generating') {
        console.log(`[API WARNING] Task ${taskData.taskId} has been generating for ${Math.round(taskAge / 1000)}s, possible timeout`);
        // Don't fail immediately, but log the warning
      }

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
              console.log(`[API DEBUG] Parsing resultJson:`, taskData.resultJson);
              const resultData = JSON.parse(taskData.resultJson);
              console.log(`[API DEBUG] Parsed result data:`, resultData);
              
              // Extract video URL from resultUrls array
              if (resultData.resultUrls && Array.isArray(resultData.resultUrls) && resultData.resultUrls.length > 0) {
                videoUrl = resultData.resultUrls[0];
                console.log(`[API DEBUG] Extracted video URL:`, videoUrl);
              } else {
                console.log(`[API DEBUG] No valid resultUrls found in resultJson`);
              }
            } catch (parseError) {
              console.error(`[API ERROR] Failed to parse resultJson:`, parseError);
            }
          } else {
            console.log(`[API DEBUG] resultJson is empty for completed task`);
          }
          break;
        case 'fail':
          internalStatus = 'failed';
          progress = 0;
          error = taskData.failMsg || 'Task failed';
          break;
        case 'completed':
        case 'done':
        case 'finished':
          internalStatus = 'completed';
          progress = 100;
          console.log(`[API DEBUG] Task completed with state: ${taskData.state}`);
          break;
        case 'error':
        case 'failed':
        case 'cancelled':
          internalStatus = 'failed';
          progress = 0;
          error = taskData.failMsg || `Task failed with state: ${taskData.state}`;
          console.log(`[API DEBUG] Task failed with state: ${taskData.state}`);
          break;
        default:
          console.log(`[API DEBUG] Unknown Kie.ai state: ${taskData.state}`);
          // Check if task might be completed but state is still generating
          if (taskData.costTime && taskData.completeTime) {
            internalStatus = 'completed';
            progress = 100;
            console.log(`[API DEBUG] Task appears completed based on costTime/completeTime`);
          } else if (taskAge > timeoutMs) {
            // If task has been running too long, mark as failed
            internalStatus = 'failed';
            progress = 0;
            error = `Task timeout after ${Math.round(taskAge / 1000)}s`;
            console.log(`[API DEBUG] Task marked as failed due to timeout`);
          } else {
            internalStatus = 'processing';
            progress = 50;
          }
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
      // if (taskData.costTime) {
      //   updateData.kie_cost_time = taskData.costTime;
      // }
      // if (taskData.completeTime) {
      //   updateData.kie_complete_time = taskData.completeTime;
      // }

      const { error: updateError } = await getSupabaseAdmin()
        .from('video_jobs')
        .update(updateData)
        .eq('job_id', taskId);

      if (updateError) {
        console.error(`[API ERROR] Failed to update job record - taskId: ${taskId}:`, updateError);
      } else {
        console.log(`[API SUCCESS] Job record updated - taskId: ${taskId}, status: ${internalStatus}, progress: ${progress}`);
      }

      // Return status information
      return NextResponse.json({
        taskId: taskData.taskId,
        status: internalStatus,
        progress: progress,
        kieState: taskData.state,
        videoUrl: videoUrl,
        error: error,
        costTime: taskData.costTime,
        completeTime: taskData.completeTime,
        createTime: taskData.createTime
      });

    } catch (apiError) {
      console.error(`[API ERROR] Kie.ai task status query failed - taskId: ${taskId}:`, apiError);
      
      return NextResponse.json(
        { error: 'Failed to query task status' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[API ERROR] Task status query error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
