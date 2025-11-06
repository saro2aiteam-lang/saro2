import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Check, ArrowRight } from "lucide-react";
import { subscriptionPlans, oneTimePacks } from "@/config/pricing";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan?: 'basic' | 'creator' | 'pro' | null;
  onSuccess?: (plan: string, paymentMethod: string) => void;
}

const PaymentModal = ({ isOpen, onClose, selectedPlan = null, onSuccess }: PaymentModalProps) => {
  const [currentStep, setCurrentStep] = useState<'plan' | 'payment' | 'processing' | 'success'>('plan');
  const [chosenPlan, setChosenPlan] = useState(selectedPlan);
  const [paymentMethod, setPaymentMethod] = useState<'subscription' | 'one-time'>('subscription');

  // Creem payment integration IDs
  const creemPlanIds = {
    basic: "plan_basic_monthly",
    creator: "plan_creator_monthly",
    pro: "plan_pro_monthly"
  };

  const creemProductIds = {
    starter: "pack_starter_10",
    creator_pack: "pack_creator_25",
    dev_team: "pack_dev_60"
  };

  const handlePlanSelect = (planId: string) => {
    setChosenPlan(planId as any);
    setCurrentStep('payment');
  };

  const handlePayment = async () => {
    setCurrentStep('processing');
    
    try {
      // Mock Creem payment integration (delay only in development)
      const isDev = process.env.NEXT_PUBLIC_API_ENV === 'development';
      if (paymentMethod === 'subscription') {
        const planId = creemPlanIds[chosenPlan as keyof typeof creemPlanIds];
        if (planId) {
          if (isDev) {
            await simulateCreemCheckout(planId, 'subscription');
          }
        }
      } else {
        const productId = creemProductIds[chosenPlan as keyof typeof creemProductIds];
        if (productId) {
          if (isDev) {
            await simulateCreemCheckout(productId, 'one-time');
          }
        }
      }
      
      setCurrentStep('success');
      if (isDev) {
        setTimeout(() => {
          onSuccess?.(chosenPlan || '', paymentMethod);
          onClose();
          setCurrentStep('plan');
        }, 2000);
      } else {
        onSuccess?.(chosenPlan || '', paymentMethod);
        onClose();
        setCurrentStep('plan');
      }
    } catch (error) {
      console.error('Payment failed:', error);
      setCurrentStep('payment');
    }
  };

  const simulateCreemCheckout = async (productId: string, type: string): Promise<void> => {
    return new Promise((resolve) => {
      // Mock API call to Creem
      console.log(`Processing ${type} payment for ${productId}`);
      setTimeout(resolve, 2000);
    });
  };

  const resetAndClose = () => {
    setCurrentStep('plan');
    setChosenPlan(selectedPlan);
    setPaymentMethod('subscription');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {currentStep === 'plan' && "Choose Your Plan"}
            {currentStep === 'payment' && "Complete Payment"}
            {currentStep === 'processing' && "Processing Payment"}
            {currentStep === 'success' && "Payment Successful!"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {currentStep === 'plan' && "Select a subscription plan or one-time credit pack"}
            {currentStep === 'payment' && "Complete your payment to activate your plan"}
            {currentStep === 'processing' && "Your payment is being processed"}
            {currentStep === 'success' && "Your payment was successful"}
          </DialogDescription>
        </DialogHeader>

        {/* Plan Selection Step */}
        {currentStep === 'plan' && (
          <div className="space-y-6">
            <Tabs defaultValue="subscription" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="subscription" onClick={() => setPaymentMethod('subscription')}>
                  Subscription Plans <Badge className="ml-2">70% Savings</Badge>
                </TabsTrigger>
                <TabsTrigger value="one-time" onClick={() => setPaymentMethod('one-time')}>
                  One-Time Credits
                </TabsTrigger>
              </TabsList>

              <TabsContent value="subscription" className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  {subscriptionPlans.map((plan) => (
                    <Card 
                      key={plan.id}
                      className={`relative p-6 cursor-pointer transition-all hover:shadow-lg ${
                        plan.popular ? 'border-primary shadow-primary/20' : ''
                      }`}
                      onClick={() => handlePlanSelect(plan.id)}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-primary">Most Popular</Badge>
                        </div>
                      )}
                      
                      <div className="text-center space-y-4">
                        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto">
                          <plan.icon className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">{plan.name}</h3>
                          <div className="mt-2">
                            <span className="text-2xl font-bold">{plan.price}</span>
                            <span className="text-muted-foreground">{plan.period}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {plan.credits} • {plan.creditValue}
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-left">
                          {plan.features.slice(0, 3).map((feature, index) => (
                            <div key={index} className="flex items-start space-x-2 text-sm">
                              <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="one-time" className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-muted-foreground">
                    ⚠️ Limited features • No API access • No priority queue
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {oneTimePacks.map((pack) => (
                    <Card 
                      key={pack.id}
                      className="p-6 cursor-pointer transition-all hover:shadow-lg bg-muted/30"
                      onClick={() => handlePlanSelect(pack.id)}
                    >
                      <div className="text-center space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-muted-foreground">{pack.name}</h3>
                          <div className="mt-2">
                            <span className="text-2xl font-bold text-muted-foreground">{pack.price}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {pack.credits} • {pack.creditValue}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Payment Step */}
        {currentStep === 'payment' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-lg font-semibold mb-2">
                {paymentMethod === 'subscription' ? (
                  subscriptionPlans.find(p => p.id === chosenPlan)?.name
                ) : (
                  oneTimePacks.find(p => p.id === chosenPlan)?.name
                )}
              </div>
              <div className="text-2xl font-bold">
                {paymentMethod === 'subscription' ? (
                  subscriptionPlans.find(p => p.id === chosenPlan)?.price + subscriptionPlans.find(p => p.id === chosenPlan)?.period
                ) : (
                  oneTimePacks.find(p => p.id === chosenPlan)?.price
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Payment Method</h3>
              <Card className="p-6">
                <div className="flex items-center space-x-4">
                  <CreditCard className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-semibold">Credit Card via Creem</p>
                    <p className="text-sm text-muted-foreground">
                      Secure payment processing with industry-standard encryption
                    </p>
                  </div>
                </div>
              </Card>

              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => setCurrentStep('plan')} className="flex-1">
                  Back to Plans
                </Button>
                <Button onClick={handlePayment} className="flex-1">
                  Continue to Payment
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {currentStep === 'processing' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold mb-2">Processing Payment</h3>
            <p className="text-muted-foreground">
              Please wait while we securely process your payment...
            </p>
          </div>
        )}

        {/* Success Step */}
        {currentStep === 'success' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-gray-800 dark:text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground">
              Your {paymentMethod === 'subscription' ? 'subscription' : 'credits'} will be activated shortly.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;