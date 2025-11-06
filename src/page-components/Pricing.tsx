"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { subscriptionPlans } from "@/config/pricing";
import AuthModal from "@/components/AuthModal";
import SubscriptionPlans from "@/components/pricing/SubscriptionPlans";

const PricingPage = () => {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('year');
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "view_pricing");
    }
  }, []);

  const displayedPlans = useMemo(() => {
    return subscriptionPlans.filter((plan) => plan.billingInterval === billingInterval);
  }, [billingInterval]);

  const marketPricePerCredit = 1.0;
  const bestPricePerCredit = useMemo(() => {
    const values = displayedPlans
      .map((plan) => plan.pricePerCredit)
      .filter((value): value is number => typeof value === 'number');
    if (!values.length) return undefined;
    return Math.min(...values);
  }, [displayedPlans]);

  const savingsPercent = bestPricePerCredit
    ? Math.round(Math.max(0, 100 - (bestPricePerCredit / marketPricePerCredit) * 100))
    : 0;

  const intervalLabel = billingInterval === 'year' ? 'Annual' : 'Monthly';

  const popularAnnualPlan = useMemo(() => {
    if (billingInterval !== 'year') return null;
    return displayedPlans.find((plan) => plan.popular) ?? displayedPlans[0] ?? null;
  }, [billingInterval, displayedPlans]);

  const monthlyCounterpart = useMemo(() => {
    if (!popularAnnualPlan || !popularAnnualPlan.groupId) return null;
    return subscriptionPlans.find(
      (plan) => plan.groupId === popularAnnualPlan.groupId && plan.billingInterval === 'month'
    ) ?? null;
  }, [popularAnnualPlan]);

  const annualVsMonthlyCopy = useMemo(() => {
    if (!popularAnnualPlan || !monthlyCounterpart) return null;
    const monthlyPrice = monthlyCounterpart.priceCents / 100;
    const annualPrice = popularAnnualPlan.priceCents / 100;
    const equivalentMonthly = annualPrice / 12;
    const savings = monthlyPrice * 12 - annualPrice;
    return {
      planName: popularAnnualPlan.name.split('·')[0].trim(),
      monthlyPrice,
      equivalentMonthly,
      savings,
    };
  }, [popularAnnualPlan, monthlyCounterpart]);

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      <SEOHead 
        title="Pricing Plans - Choose Your AI Video Generation Plan | Sora2"
        description="View Sora2 pricing plans. Choose from Basic, Creator, or Pro plans with monthly and annual options. Create professional videos with Sora 2 technology."
        canonical="https://aivido.ai/plans"
      />
      <Navigation />
      
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              <span className="text-primary">Pricing Plans</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-4">
              Choose the perfect plan for your AI video generation needs. Cancel anytime.
            </p>
          </div>

          

          {/* Pricing Plans (shared component) */}
          <div id="plans" className="mb-12">
            <SubscriptionPlans
              variant="page"
              defaultInterval={billingInterval}
              onRequireAuth={() => setShowAuthModal(true)}
              showToggle={true}
            />
          </div>

          {/* Price Comparison Banner (moved below plans) */}
          <div className="mb-2 max-w-5xl mx-auto">
            {/* Urgent Alert Banner */}
            <div className="bg-destructive rounded-xl py-1.5 px-3 sm:py-2 sm:px-4 mb-2 shadow-2xl">
              <div className="text-center flex items-center justify-center gap-2">
                <span className="text-base sm:text-lg animate-bounce">🚨</span>
                <p className="text-destructive-foreground font-bold text-xs sm:text-sm">
                  Price increase coming soon! Subscribe now to lock in low prices!
                </p>
                <span className="text-base sm:text-lg animate-bounce">🚨</span>
              </div>
            </div>
            
            {/* Price Comparison Card */}
            <div className="bg-card rounded-2xl p-3 sm:p-4 shadow-2xl border-2 border-primary/30 relative overflow-hidden">
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
              
              <div className="relative z-10">
                <div className="text-center mb-2">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1">
                    Price per Video Generation
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2 items-center max-w-4xl mx-auto">
                  {/* Market Price */}
                  <div className="text-center">
                    <p className="text-yellow-400 text-xs font-semibold mb-1 uppercase tracking-wide">
                      Market Price
                    </p>
                    <div className="text-2xl sm:text-3xl font-bold text-muted-foreground">
                      <span className="line-through">$0.10/s</span>
                    </div>
                  </div>
                  
                  {/* Savings Indicator with Animation */}
                  <div className="text-center">
                    <div className="inline-block animate-bounce mb-1">
                      <div className="text-2xl sm:text-3xl">⚡</div>
                    </div>
                    <div className="text-primary">
                      <p className="font-black text-sm sm:text-base md:text-lg mb-0.5 animate-pulse">
                        50% CHEAPER
                      </p>
                      <p className="font-bold text-[10px] sm:text-xs md:text-sm">
                        than market
                      </p>
                    </div>
                  </div>
                  
                  {/* Our Price with Sparkle Animation */}
                  <div className="text-center">
                    <p className="text-yellow-400 text-xs font-semibold mb-1 uppercase tracking-wide">
                      Our Price
                    </p>
                    <div className="text-xl sm:text-2xl md:text-3xl font-black">
                      <span className="text-primary animate-pulse">
                        $0.05/s
                      </span>
                      <span className="inline-block ml-1 sm:ml-2 text-lg sm:text-xl md:text-2xl animate-spin-slow">✨</span>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-8 sm:mb-12">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
              <div>
                <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes! All plans can be canceled anytime. You'll retain access until the end of your billing period.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Do unused credits roll over?</h3>
                <p className="text-sm text-muted-foreground">
                  Subscription bucket resets each billing period and does not roll over. One-time add-on credits go to the flexible bucket and are not cleared by subscription resets.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">What is aivido.ai refund policy?</h3>
                <p className="text-sm text-muted-foreground">
                  We offer a 7-day money-back guarantee for all subscription plans. Contact support@saro2.ai for refunds. For general inquiries and partnerships, contact team@saro2.ai. Refunds are processed within 5-7 business days.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Are there any video content restrictions?</h3>
                <p className="text-sm text-muted-foreground">
                  Our platform enforces strict content policies. We prohibit the generation of harmful, illegal, or inappropriate content. All generated videos undergo automatic screening to ensure policy compliance.
                </p>
              </div>

              {/* Credits & subscription reassurance */}
              <div>
                <h3 className="font-semibold mb-2">Will credits be deducted if generation fails?</h3>
                <p className="text-sm text-muted-foreground">
                  No. Credits are deducted atomically when a job starts, and automatically refunded if the generation fails or the upstream service returns an error. Refunds usually appear within a minute.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">What happens to credits if I cancel my subscription?</h3>
                <p className="text-sm text-muted-foreground">
                  You can cancel anytime. Flexible (one-time) credits remain available. Subscription bucket follows your billing period and stops refreshing after the current period ends.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <Footer />
    </div>
  );
};

export default PricingPage;
