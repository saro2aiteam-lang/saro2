import { FC, useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Wallet, ArrowRight, Loader2, CreditCard } from 'lucide-react';
import { subscriptionPlans } from '@/config/pricing';
import { startCheckout, CheckoutError } from '@/services/payments';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

interface InsufficientCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredCredits?: number;
  availableCredits?: number;
  onRequestAuth?: () => void;
}

const InsufficientCreditsDialog: FC<InsufficientCreditsDialogProps> = ({
  open,
  onOpenChange,
  requiredCredits,
  availableCredits,
  onRequestAuth
}) => {
  const { isAuthenticated } = useAuth();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const handleCheckout = async (planId: string) => {
    if (!isAuthenticated) {
      onRequestAuth?.();
      toast({
        variant: 'destructive',
        title: 'Please sign in',
        description: 'Sign in to continue top-up or upgrade.',
      });
      return;
    }

    setLoadingPlanId(planId);

    try {
      await startCheckout(planId);
    } catch (error) {
      if (error instanceof CheckoutError && error.code === 'AUTH_REQUIRED') {
        onRequestAuth?.();
        toast({
          variant: 'destructive',
          title: 'Session expired',
          description: 'After authentication you will be redirected to Creem checkout.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to create checkout link',
          description: error instanceof Error ? error.message : 'Please try again later or contact support.',
        });
      }
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Insufficient credits
          </DialogTitle>
          <DialogDescription>
            This generation needs {requiredCredits ?? '—'} credits. You have {availableCredits ?? '—'} remaining.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm text-muted-foreground">
          <p>Select any Creem plan below to instantly top up credits. You will be redirected to Creem checkout.</p>

          <div className="space-y-3">
            {subscriptionPlans.map((plan) => (
              <Button
                key={plan.id}
                variant="outline"
                className="w-full justify-between border-border/60 text-left"
                disabled={loadingPlanId === plan.id}
                onClick={() => handleCheckout(plan.id)}
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="font-medium text-foreground">{plan.name}</span>
                  <span className="text-xs text-muted-foreground">{plan.credits} · {plan.creditValue}</span>
                </div>
                <div className="flex items-center gap-2">
                  {loadingPlanId === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Redirecting…</span>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-foreground">{plan.price}{plan.period}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </div>
              </Button>
            ))}
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-foreground">
              <Wallet className="h-4 w-4" />
              <span className="font-medium">Benefits of upgrading</span>
            </div>
            <ul className="list-disc list-inside space-y-1">
              <li>Instant credit top-up, no waiting</li>
              <li>Multiple plans available, pay as you need</li>
              <li>Premium plans offer more quota and priority queuing</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
          <Button asChild variant="cyber" className="group">
            <Link href="/plans" className="flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              View All Plans
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InsufficientCreditsDialog;
