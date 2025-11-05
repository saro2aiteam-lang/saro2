"use client";

import { useState } from "react";
import AuthModal from "@/components/AuthModal";
import SubscriptionPlans from "@/components/pricing/SubscriptionPlans";

const PricingSection = () => {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('year');
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 font-display">
            <span className="text-primary">Pricing Plans</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-4">
            Choose the perfect plan for your AI video generation needs. Cancel anytime.
          </p>
        </div>

        {/* Shared component */}
        <SubscriptionPlans
          variant="teaser"
          defaultInterval={billingInterval}
          onRequireAuth={() => setShowAuthModal(true)}
        />

        {/* Trust Badges */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="bg-muted/30 rounded-lg p-4 text-center border border-border/50">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">Secure checkout</p>
            <p className="text-xs text-muted-foreground mt-1">安全结账</p>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-4 text-center border border-border/50">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">Cancel anytime</p>
            <p className="text-xs text-muted-foreground mt-1">随时取消</p>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-4 text-center border border-border/50">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1.16l.818.78A1.5 1.5 0 010 8.18v5.64A1.5 1.5 0 001.818 15h16.364A1.5 1.5 0 0020 13.82V8.18a1.5 1.5 0 00-.818-1.24L18 6.16V4a2 2 0 00-2-2H4z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">No surprise charges</p>
            <p className="text-xs text-muted-foreground mt-1">无意外收费</p>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-4 text-center border border-border/50">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">Fast support</p>
            <p className="text-xs text-muted-foreground mt-1">快速支持</p>
          </div>
        </div>
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </section>
  );
};

export default PricingSection;
