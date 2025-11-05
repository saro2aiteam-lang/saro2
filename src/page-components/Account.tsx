"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import GenerationHistory from "@/components/GenerationHistory";
import { Zap, History, Download, Crown } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import SubscriptionRequiredModal from '@/components/SubscriptionRequiredModal'
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/contexts/CreditsContext";

const Account = () => {
  const { user, isAuthenticated } = useAuth();
  const { subscription, generations, refreshCredits } = useCredits();
  const router = useRouter();
  const searchParams = useSearchParams();

  // User data from context and Supabase
  const userData = {
    name: user?.user_metadata?.full_name || user?.email || "User",
    email: user?.email || "",
    plan: subscription?.plan?.includes('creator') ? 'Creator Plan' : 
          subscription?.plan?.includes('studio') ? 'Studio Plan' : 
          subscription?.plan?.includes('enterprise') ? 'Enterprise Plan' : 
          subscription?.plan?.includes('pro') ? 'Pro Plan' :
          subscription?.plan?.includes('basic') ? 'Basic Plan' : 'Free Plan',
    credits: subscription?.credits || 0,
    totalCredits: subscription?.totalCredits || 0,
    totalGenerated: generations.length,
    subscriptionStatus: subscription?.status || "inactive",
    nextBilling: subscription?.resetDate || "N/A"
  };

  const recentGenerations = generations.slice(0, 10);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Handle payment success callback: refresh credits then clean URL
  useEffect(() => {
    try {
      const payment = (searchParams?.get("payment") || "").toString();
      if (payment === "success") {
        const planName = (searchParams?.get("plan") || "").toString();
        toast.success(`Payment successful${planName ? `: ${planName.replace(/_/g, " ")}` : ""}`);
        refreshCredits().catch(() => {});
        // Clean query params to avoid re-triggering on back/refresh
        router.replace("/account");
      }
    } catch (_e) {
      // no-op
    }
    // We only want to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              <span className="text-primary">Account Dashboard</span>
            </h1>
            <p className="text-muted-foreground">
              Manage your subscription, credits, and API access
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userData.credits}</p>
                  <p className="text-sm text-muted-foreground">Credits Available</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <History className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userData.totalGenerated}</p>
                  <p className="text-sm text-muted-foreground">Videos Generated</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Crown className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-lg font-semibold">{userData.plan}</p>
                  <p className="text-sm text-muted-foreground">Current Plan</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <Input defaultValue={userData.name} className="mt-1" readOnly />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <Input defaultValue={userData.email} className="mt-1" readOnly />
                    </div>
                    <Button variant="outline" className="w-full">
                      Update Profile
                    </Button>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Subscription Status</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Current Plan</span>
                      <Badge variant="default">{userData.plan}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status</span>
                      <Badge variant="outline" className="text-green-500 border-green-500">
                        Active
                      </Badge>
                    </div>
                    <div className="pt-2 space-y-2">
                      <Button variant="outline" className="w-full" onClick={() => setShowSubscriptionModal(true)}>
                        Upgrade Plan
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <GenerationHistory />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
      <SubscriptionRequiredModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        feature="upgrade your plan"
      />
    </div>
    </ProtectedRoute>
  );
};

export default Account;