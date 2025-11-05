import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createServerClient } from '@supabase/ssr';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
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
      console.error('[API ERROR] Usage tracking authentication failed:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const { action, metadata } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    console.log(`[API] Track usage - userId: ${userId}, action: ${action}`);

    const today = new Date().toISOString().split('T')[0];

    // Get or create today's usage record
    const { data: existingStats, error: fetchError } = await getSupabaseAdmin()
      .from('usage_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching usage stats:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch usage stats' },
        { status: 500 }
      );
    }

    let updateData: any = {
      user_id: userId,
      date: today,
    };

    if (existingStats) {
      // Update existing record
      switch (action) {
        case 'video_generated':
          updateData.videos_generated = (existingStats.videos_generated || 0) + 1;
          updateData.credits_used = (existingStats.credits_used || 0) + (metadata?.credits || 1);
          break;
        case 'storage_used':
          updateData.storage_used = (existingStats.storage_used || 0) + (metadata?.bytes || 0);
          break;
      }

    const { error: updateError } = await getSupabaseAdmin()
        .from('usage_stats')
        .update(updateData)
        .eq('id', existingStats.id);

      if (updateError) {
        console.error('Error updating usage stats:', updateError);
        return NextResponse.json(
          { error: 'Failed to update usage stats' },
          { status: 500 }
        );
      }
    } else {
      // Create new record
      switch (action) {
        case 'video_generated':
          updateData.videos_generated = 1;
          updateData.credits_used = metadata?.credits || 1;
          break;
        case 'storage_used':
          updateData.storage_used = metadata?.bytes || 0;
          break;
      }

      const { error: insertError } = await getSupabaseAdmin()
        .from('usage_stats')
        .insert(updateData);

      if (insertError) {
        console.error('Error creating usage stats:', insertError);
        return NextResponse.json(
          { error: 'Failed to create usage stats' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Usage tracked successfully',
    });

  } catch (error) {
    console.error('Usage tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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
      console.error('[API ERROR] Usage stats authentication failed:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    console.log(`[API] Get usage stats - userId: ${userId}, days: ${days}`);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data: stats, error } = await getSupabaseAdmin()
      .from('usage_stats')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching usage stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch usage stats' },
        { status: 500 }
      );
    }

    // Calculate totals
    const totals = stats.reduce((acc, stat) => ({
      videos_generated: acc.videos_generated + (stat.videos_generated || 0),
      credits_used: acc.credits_used + (stat.credits_used || 0),
      storage_used: acc.storage_used + (stat.storage_used || 0),
    }), { videos_generated: 0, credits_used: 0, storage_used: 0 });

    return NextResponse.json({
      success: true,
      stats,
      totals,
      period: { days, start_date: startDateStr },
    });

  } catch (error) {
    console.error('Usage stats fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
