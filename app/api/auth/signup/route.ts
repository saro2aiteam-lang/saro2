import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit, authRateLimiter } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check (5 attempts per 15 minutes per IP)
    const rateLimitResponse = await rateLimit(request, authRateLimiter);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    const { email, password, fullName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await getSupabaseAdmin().auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email confirmation
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 400 }
      );
    }

    // Create user profile in our database
    const { data: userData, error: userError } = await getSupabaseAdmin()
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName || '',
        subscription_plan: 'basic',
        subscription_status: 'inactive',
        credits_limit: 50,
      })
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        subscription_plan: userData.subscription_plan,
        credits_limit: userData.credits_limit,
      },
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
