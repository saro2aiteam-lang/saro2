import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft } from 'lucide-react';

interface EmailConfirmationViewProps {
  mode: 'signin' | 'signup';
  email: string;
  onBack: () => void;
}

export function EmailConfirmationView({ mode, email, onBack }: EmailConfirmationViewProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <CheckCircle className="w-16 h-16 text-green-500" />
      </div>
      <div className="space-y-2">
        <p className="text-lg font-medium">
          {mode === 'signup' ? 'Confirmation email sent!' : 'Magic link sent!'}
        </p>
        <p className="text-muted-foreground">
          {mode === 'signup' ? (
            <>
              We've sent a confirmation link to <strong>{email}</strong>. Please check your email and click the link to verify your account.
            </>
          ) : (
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
        onClick={onBack}
        className="w-full"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to {mode === 'signup' ? 'Sign Up' : 'Sign In'}
      </Button>
    </div>
  );
}

