"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

const AuthCallback = () => {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Processing auth callback...');
        console.log('Current URL:', window.location.href);
        console.log('URL hash:', window.location.hash);
        console.log('URL search:', window.location.search);

        // 先检查 URL 中是否有认证参数
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        console.log('URL params:', Object.fromEntries(urlParams));
        console.log('Hash params:', Object.fromEntries(hashParams));

        // Supabase v2 会自动处理 URL 中的认证参数
        // 直接检查 session 即可

        // Get the current session
        const { data, error } = await supabase.auth.getSession();
        console.log('Final getSession result:', {
          hasSession: !!data.session,
          error,
          userEmail: data.session?.user?.email
        });

        if (error) {
          console.error('Auth callback error:', error);
          setStatus('error');
          router.replace('/');
          return;
        }

        if (data.session) {
          console.log('Authentication successful:', data.session.user.email);
          setStatus('success');
          router.replace('/text-to-video');
        } else {
          console.log('No session found');
          setStatus('error');
          router.replace('/');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        router.replace('/');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">
          {status === 'loading' && 'Completing sign in...'}
          {status === 'success' && 'Sign in successful! Redirecting...'}
          {status === 'error' && 'Sign in failed. Redirecting...'}
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;