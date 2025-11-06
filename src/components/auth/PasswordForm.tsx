import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, User } from 'lucide-react';

interface PasswordFormProps {
  mode: 'signin' | 'signup';
  email: string;
  password: string;
  fullName?: string;
  confirmPassword?: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onFullNameChange?: (name: string) => void;
  onConfirmPasswordChange?: (password: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function PasswordForm({
  mode,
  email,
  password,
  fullName = '',
  confirmPassword = '',
  onEmailChange,
  onPasswordChange,
  onFullNameChange,
  onConfirmPasswordChange,
  onSubmit,
  loading,
}: PasswordFormProps) {
  return (
    <>
      {mode === 'signup' && (
        <div className="space-y-2">
          <Label htmlFor="full-name">Full Name</Label>
          <Input
            id="full-name"
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => onFullNameChange?.(e.target.value)}
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
          onChange={(e) => onEmailChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder={mode === 'signup' ? 'Create a password (min. 6 characters)' : 'Enter your password'}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
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
            onChange={(e) => onConfirmPasswordChange?.(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          />
        </div>
      )}
      <Button
        onClick={onSubmit}
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
  );
}

