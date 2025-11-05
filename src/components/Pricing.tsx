import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import PendingButton from "@/components/PendingButton";
import { useAuth } from "@/contexts/AuthContext";
import { subscriptionPlans, oneTimePacks } from "@/config/pricing";
import AuthModal from "@/components/AuthModal";
import { startCheckout, CheckoutError } from "@/services/payments";
import { toast } from "@/components/ui/use-toast";

const Pricing = () => {
  // const { isSignedIn } = useUser();
  const { isAuthenticated } = useAuth();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const beginCheckout = async (planId: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      toast({
        variant: 'destructive',
        title: 'Please sign in',
        description: 'Sign in to continue to Creem checkout.',
      });
      return;
    }

    setLoadingPlanId(planId);

    try {
      await startCheckout(planId);
    } catch (error) {
      if (error instanceof CheckoutError && error.code === 'AUTH_REQUIRED') {
        setShowAuthModal(true);
        toast({
          variant: 'destructive',
          title: 'Session expired',
          description: 'Please sign in again to create a new checkout link.',
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
    <section className="py-24 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="text-primary">
              Choose Your Plan
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Pay-per-use pricing with subscription savings. No hidden fees, cancel anytime.
          </p>
          
          {/* Savings highlight */}
          <div className="inline-flex items-center bg-accent/20 text-accent-foreground border border-accent/30 rounded-lg px-4 py-2 text-sm font-medium">
            💡 Save up to 70% with subscription plans vs one-time purchases
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">
            Subscription Plans 
            <Badge variant="secondary" className="ml-2">Recommended</Badge>
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            {subscriptionPlans.map((plan, index) => (
              <Card 
                key={index}
                className={`relative p-8 ${
                  plan.popular 
                    ? 'border-primary shadow-primary/20 shadow-xl bg-card' 
                    : 'bg-card/50 backdrop-blur-sm border-border'
                } hover:shadow-lg transition-all duration-300`}
              >
                {/* Popular badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge 
                      variant={plan.popular ? "default" : "secondary"}
                      className={plan.popular ? "bg-primary" : ""}
                    >
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Header */}
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                      <plan.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {plan.credits} • {plan.creditValue}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start space-x-3">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <PendingButton
                    variant={plan.popular ? "hero" : "outline"}
                    className="w-full"
                    size="lg"
                    disabled={loadingPlanId === plan.id}
                    onAction={() => beginCheckout(plan.id)}
                  >
                    {plan.cta}
                  </PendingButton>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* One-time Credits */}
        <div>
          <h3 className="text-2xl font-bold text-center mb-4">
            One-Time Credit Packs
          </h3>
          <p className="text-center text-muted-foreground mb-8">
            For quick testing only. Limited features compared to subscriptions.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {oneTimePacks.map((pack, index) => (
              <Card key={index} className="p-6 bg-muted/30 border-muted">
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="font-semibold text-muted-foreground">{pack.name}</h4>
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-muted-foreground">{pack.price}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {pack.credits} • {pack.creditValue}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground text-center bg-muted/50 rounded p-2">
                    ⚠️ {pack.limitations}
                  </div>
                  
                  <PendingButton
                    variant="outline"
                    className="w-full"
                    size="sm"
                    disabled={loadingPlanId === pack.id}
                    onAction={() => beginCheckout(pack.id)}
                  >
                    Quick Test
                  </PendingButton>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Pro tip:</strong> Subscription plans include API access, webhooks, and priority support
            </p>
          </div>
        </div>

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    </section>
  );
};

export default Pricing;
