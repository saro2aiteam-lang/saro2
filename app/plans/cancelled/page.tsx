"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentCancelledPage() {
  const searchParams = useSearchParams();
  const plan = searchParams?.get('plan') || '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full p-6 text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-4">
            <XCircle className="h-12 w-12 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Payment Cancelled</h1>
          <p className="text-muted-foreground">
            Your payment was cancelled. No charges were made to your account.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {plan && (
              <Button asChild className="w-full sm:w-auto">
                <Link href={`/plans?plan=${encodeURIComponent(plan)}`}>
                  Try Again
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/plans">
                View All Plans
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Need help? Contact us at{" "}
            <a 
              href="mailto:support@saro2.ai?subject=Payment Question" 
              className="text-primary hover:underline"
            >
              support@saro2.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

