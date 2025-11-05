import { supabase } from './supabase';

// Supabase Storage 替代 Cloudflare R2
export async function uploadVideo(file: File, userId: string) {
  try {
    const fileName = `${userId}/${Date.now()}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(fileName, file);
      
    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload video: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(fileName);

    return {
      success: true,
      url: publicUrl,
      key: fileName
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload video: ${error}`);
  }
}

export async function getVideoUrl(key: string) {
  try {
    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(key);
      
    return publicUrl;
  } catch (error) {
    console.error('Get URL error:', error);
    throw new Error(`Failed to get video URL: ${error}`);
  }
}

export async function deleteVideo(key: string) {
  try {
    const { error } = await supabase.storage
      .from('videos')
      .remove([key]);
      
    if (error) {
      console.error('Delete error:', error);
      throw new Error(`Failed to delete video: ${error.message}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error(`Failed to delete video: ${error}`);
  }
}

export function generateVideoKey(userId: string, filename: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = filename.split('.').pop() || 'mp4';
  return `${userId}/${timestamp}-${randomId}.${extension}`;
}
