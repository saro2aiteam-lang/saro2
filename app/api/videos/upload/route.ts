import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createServerClient } from '@supabase/ssr';
import { rateLimit, apiRateLimiter } from '@/lib/rate-limiter';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
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
      console.error('[API ERROR] Upload authentication failed:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Validate file type (support both images and videos)
    if (!file.type.startsWith('video/') && !file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only video and image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 100MB' },
        { status: 400 }
      );
    }

    // Log upload request
    console.log(`[API] Upload file - userId: ${userId}, fileName: ${file.name}, size: ${file.size}, type: ${file.type}`);

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${timestamp}_${randomStr}.${fileExt}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase Storage
    const { error } = await getSupabaseAdmin().storage
      .from('videos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error(`[API ERROR] Upload failed - userId: ${userId}, fileName: ${file.name}:`, error);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = getSupabaseAdmin().storage
      .from('videos')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      video_url: publicUrl,
      path: fileName,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
