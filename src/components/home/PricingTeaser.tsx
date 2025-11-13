"use client";

import React, { useState } from 'react';
import AuthModal from '@/components/AuthModal';
import SubscriptionPlans from '@/components/pricing/SubscriptionPlans';

const PricingTeaser = () => {
  // Use built-in toggle inside SubscriptionPlans; remove local billing toggle
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 font-display">
            Choose your <span className="text-primary">plan</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional AI video ads generation. Cancel anytime. Annual saves 50%.
          </p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto mt-4">
            Subscriptions cover compute usage for Sora-compatible models, Veo-compatible models and other third-party AI video engines. Saro.ai is not affiliated with OpenAI or Google.
          </p>

          {/* Billing Toggle removed to avoid duplication */}
        </div>

        {/* Pricing Cards via shared component */}
        <SubscriptionPlans
          variant="teaser"
          defaultInterval="year"
          onRequireAuth={() => setShowAuthModal(true)}
        />
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </section>
  );
};

export default PricingTeaser;
