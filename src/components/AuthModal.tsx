"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const [view, setView] = useState<'magic' | 'password'>('magic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const isProduction = process.env.NODE_ENV === 'production';
  const baseUrl = isProduction
    ? (process.env.NEXT_PUBLIC_APP_URL || 'https://saro2.ai')
    : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

  const handleMagicLink = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${baseUrl}/auth/callback`,
        }
      });

      if (error) {
        setError(error.message);
      } else {
        setMagicLinkSent(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSignIn = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        onClose();
        router.push('/text-to-video');
      }
    } catch (err: any) {
      setError(err?.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      // 检测移动端设备
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${baseUrl}/auth/callback`,
          ...(isMobile && {
            queryParams: {
              access_type: 'online',
              prompt: 'select_account'
            }
          })
        }
      });

      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError(null);
    setMagicLinkSent(false);
    setView('magic');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? null : handleClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {magicLinkSent ? 'Check Your Email' : 'Sign In to Sora2'}
          </DialogTitle>
        </DialogHeader>

        {magicLinkSent ? (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">Magic link sent!</p>
              <p className="text-muted-foreground">
                We've sent a login link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Check your email and click the link to sign in.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setMagicLinkSent(false)}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {view === 'magic' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleMagicLink()}
                  />
                </div>
                <Button
                  onClick={handleMagicLink}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Continue with Magic Link
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email-password">Email</Label>
                  <Input
                    id="email-password"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordSignIn()}
                  />
                </div>
                <Button
                  onClick={handlePasswordSignIn}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="text-center">
              <button
                onClick={() => setView(view === 'magic' ? 'password' : 'magic')}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {view === 'magic' ? 'Use password instead' : 'Use magic link instead'}
              </button>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md">
                {error}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
