"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Remove Tabs to match Pricing page's toggle style
import { Check, Crown, Download, Zap, Loader2, AlertCircle } from 'lucide-react';
import { subscriptionPlans } from '@/config/pricing';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import { startCheckout, CheckoutError } from '@/services/payments';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import SubscriptionPlans from '@/components/pricing/SubscriptionPlans';

interface SubscriptionRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string; // e.g., "download videos"
}

const SubscriptionRequiredModal: React.FC<SubscriptionRequiredModalProps> = ({
  isOpen,
  onClose,
  feature = "download videos"
}) => {
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  // Default to Annual to match pricing pages
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>(() => 'year');

  const beginCheckout = async (planId: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      toast({
        variant: 'destructive',
        title: 'Please log in first',
        description: 'Log in to proceed to subscription.',
      });
      return;
    }

    setLoadingPlanId(planId);

    try {
      await startCheckout(planId);
      onClose();
    } catch (error) {
      if (error instanceof CheckoutError && error.code === 'AUTH_REQUIRED') {
        setShowAuthModal(true);
        toast({
          variant: 'destructive',
          title: 'Login session expired',
          description: 'Please log in again to continue your subscription.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Subscription failed',
          description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        });
      }
    } finally {
      setLoadingPlanId(null);
    }
  };

  const displayedPlans = subscriptionPlans.filter(plan => plan.billingInterval === billingInterval);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              {feature === "generate videos" ? (
                <AlertCircle className="w-6 h-6 text-orange-500" />
              ) : (
                <Crown className="w-6 h-6 text-yellow-500" />
              )}
              {feature === "generate videos" ? "Insufficient Credits" : 
               feature === "upgrade your plan" ? "Upgrade Your Plan" : 
               "Subscription Required"}
            </DialogTitle>
            <DialogDescription className="text-lg">
              {feature === "generate videos" ? 
                "Your current credits are not enough to generate this video. Subscribe to a plan and unlock unlimited creative possibilities with more credits!" :
               feature === "upgrade your plan" ? 
                "Choose a subscription plan to access premium features." :
                `To ${feature}, you need an active subscription plan.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Pricing Plans */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Choose Your Plan</h3>
                {/* Toggle lives inside SubscriptionPlans to keep styles unified */}
              </div>

              {/* Shared plans component */}
              <SubscriptionPlans 
                variant="modal" 
                defaultInterval={billingInterval}
                onRequireAuth={() => setShowAuthModal(true)}
                afterRedirect={onClose}
              />
            </div>

            {/* One-time packs removed as requested */}

            {/* Footer */}
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                💡 <strong>Pro tip:</strong> Subscription plans include API access, webhooks, and priority support
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};

export default SubscriptionRequiredModal;
