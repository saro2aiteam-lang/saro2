import { supabase } from '@/lib/supabase';

const API_BASE = '/api/kie';

async function getAuthToken(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) throw new Error('User not authenticated');
  return session.access_token;
}

export const watermarkApi = {
  async create(videoUrl: string, opts?: { callBackUrl?: string }): Promise<{ jobId: string; status: string; credits_consumed: number }> {
    const token = await getAuthToken();
    const resp = await fetch(`${API_BASE}/watermark/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ video_url: videoUrl, callBackUrl: opts?.callBackUrl }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(text || `HTTP ${resp.status}`);
    }
    const data = await resp.json();
    return { jobId: data.generation_id, status: data.status, credits_consumed: data.credits_consumed };
  },
};

export default watermarkApi;



