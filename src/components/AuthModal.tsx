"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowLeft, CheckCircle, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  preventClose?: boolean; // Prevent closing when user is not authenticated
}

export default function AuthModal({ isOpen, onClose, preventClose = false }: AuthModalProps) {
  const router = useRouter();
  const { signUp, signIn, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [view, setView] = useState<'magic' | 'password'>('magic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: mode === 'signup', // Only create user in signup mode
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

  const handlePasswordAuth = async () => {
    // Validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (mode === 'signup') {
      // Signup validation
      if (!fullName.trim()) {
        setError('Please enter your full name');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { user, error } = await signUp(email, password, { full_name: fullName.trim() });

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        // Signup successful - show confirmation message
        setMagicLinkSent(true);
        setLoading(false);
      } catch (err: any) {
        setError(err?.message || 'Sign up failed');
        setLoading(false);
      }
    } else {
      // Signin logic
      setLoading(true);
      setError(null);

      try {
        const { user, error } = await signIn(email, password);

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        // Wait for session to be established before redirecting
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Small delay to ensure auth state is updated in context
          await new Promise(resolve => setTimeout(resolve, 300));
          
          onClose();
          // Redirect to saved path or default to text-to-video
          const redirectPath = typeof window !== 'undefined' 
            ? sessionStorage.getItem('redirectAfterLogin') || '/text-to-video'
            : '/text-to-video';
          
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('redirectAfterLogin');
          }
          
          router.replace(redirectPath);
          setLoading(false);
        } else {
          // Wait for auth state change if session not immediately available
          let subscriptionCleaned = false;
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session && !subscriptionCleaned) {
              subscriptionCleaned = true;
              subscription.unsubscribe();
              onClose();
              const redirectPath = typeof window !== 'undefined' 
                ? sessionStorage.getItem('redirectAfterLogin') || '/text-to-video'
                : '/text-to-video';
              
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('redirectAfterLogin');
              }
              
              router.replace(redirectPath);
              setLoading(false);
            }
          });
          
          // Timeout fallback - check session after delay
          setTimeout(async () => {
            if (!subscriptionCleaned) {
              subscriptionCleaned = true;
              subscription.unsubscribe();
              const { data: { session: currentSession } } = await supabase.auth.getSession();
              if (currentSession) {
                onClose();
                const redirectPath = typeof window !== 'undefined' 
                  ? sessionStorage.getItem('redirectAfterLogin') || '/text-to-video'
                  : '/text-to-video';
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem('redirectAfterLogin');
                }
                router.replace(redirectPath);
              }
              setLoading(false);
            }
          }, 2000);
        }
      } catch (err: any) {
        setError(err?.message || 'Sign in failed');
        setLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await signInWithGoogle();
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
    setFullName('');
    setConfirmPassword('');
    setError(null);
    setMagicLinkSent(false);
    setView('magic');
  };

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    resetForm();
    // Signup mode defaults to password view
    if (newMode === 'signup') {
      setView('password');
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !preventClose) {
        handleClose();
      }
    }}>
      <DialogContent className={`sm:max-w-md ${preventClose ? '[&>button]:hidden' : ''}`}>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {magicLinkSent 
              ? 'Check Your Email' 
              : mode === 'signup' 
                ? 'Create Your Account' 
                : 'Sign In to Sora2'}
          </DialogTitle>
        </DialogHeader>

        {magicLinkSent ? (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {mode === 'signup' ? 'Confirmation email sent!' : 'Magic link sent!'}
              </p>
              <p className="text-muted-foreground">
                {mode === 'signup' 
                  ? (
                    <>
                      We've sent a confirmation link to <strong>{email}</strong>. Please check your email and click the link to verify your account.
                    </>
                  )
                  : (
                    <>
                      We've sent a login link to <strong>{email}</strong>
                    </>
                  )}
              </p>
              <p className="text-sm text-muted-foreground">
                {mode === 'signup' 
                  ? 'After verification, you can sign in to your account.'
                  : 'Check your email and click the link to sign in.'}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setMagicLinkSent(false);
                resetForm();
              }}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {mode === 'signup' ? 'Sign Up' : 'Sign In'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {view === 'magic' && mode === 'signin' ? (
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
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input
                      id="full-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                )}
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
                    placeholder={mode === 'signup' ? 'Create a password (min. 6 characters)' : 'Enter your password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordAuth()}
                  />
                </div>
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handlePasswordAuth()}
                    />
                  </div>
                )}
                <Button
                  onClick={handlePasswordAuth}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  {mode === 'signup' ? (
                    <>
                      <User className="w-4 h-4 mr-2" />
                      Create Account
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Sign In
                    </>
                  )}
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

            {mode === 'signin' && view === 'password' && (
              <div className="text-center">
                <button
                  onClick={() => setView('magic')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Use magic link instead
                </button>
              </div>
            )}

            {mode === 'signin' && view === 'magic' && (
              <div className="text-center">
                <button
                  onClick={() => setView('password')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Use password instead
                </button>
              </div>
            )}

            <div className="text-center pt-2 border-t">
              <button
                onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {mode === 'signin' 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"}
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
