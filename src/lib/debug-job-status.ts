// Debug tool to check job status and kie.ai API response
'use server';

export const debugJobStatus = async (jobId: string) => {
  try {
    const apiBase = process.env.KIE_API_BASE_URL;
    const apiKey = process.env.KIE_API_KEY;

    if (!apiBase || !apiKey) {
      throw new Error('KIE API credentials are not configured');
    }

    const statusUrl = `${apiBase}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(jobId)}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      'X-API-Key': apiKey,
    };

    console.log(`[DEBUG] Checking kie.ai status for job: ${jobId}`);
    console.log(`[DEBUG] API URL: ${statusUrl}`);
    
    const response = await fetch(statusUrl, { headers });
    console.log(`[DEBUG] Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`[DEBUG] Raw kie.ai response:`, JSON.stringify(data, null, 2));
      
      if (data?.data) {
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
          progress: progressField,
        } = data.data as Record<string, unknown>;
        
        console.log(`[DEBUG] Parsed fields:`, {
          state,
          statusField,
          taskStatus,
          taskState,
          progressField,
          failMsg,
          hasResultJson: !!resultJson,
          hasResult: !!result,
          resultUrl,
          mediaUrl,
          resourceUrl
        });
        
        const resolvedState = (state ?? statusField ?? taskStatus ?? taskState) as string | undefined;
        console.log(`[DEBUG] Resolved state: ${resolvedState}`);
        
        return {
          success: true,
          data: data.data,
          resolvedState,
          progress: progressField,
          error: failMsg
        };
      }
    } else {
      console.error(`[DEBUG] API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`[DEBUG] Error response:`, errorText);
    }
    
    return { success: false, error: 'API call failed' };
  } catch (error) {
    console.error(`[DEBUG] Exception:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
