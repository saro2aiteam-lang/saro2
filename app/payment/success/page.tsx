"use client";

import Script from "next/script";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const transactionId = (searchParams?.get('transaction_id') || searchParams?.get('tx') || '').toString();
  const valueRaw = (searchParams?.get('value') || searchParams?.get('amount') || searchParams?.get('total') || '').toString();
  const valueNum = Number.parseFloat(valueRaw);
  const value = Number.isFinite(valueNum) && valueNum > 0 ? valueNum : 1.0;
  const currency = ((searchParams?.get('currency') || searchParams?.get('curr') || 'USD').toString().toUpperCase()).slice(0, 3);

  const plan = (searchParams?.get('plan') || '').toString();
  const target = `/account?payment=success${plan ? `&plan=${encodeURIComponent(plan)}` : ""}`;

  useEffect(() => {
    (window as any).__redirectAfterGA = () => {
      setIsRedirecting(true);
      try { router.replace(target); } catch (e) {}
    };
    const fallback = setTimeout(() => {
      setIsRedirecting(true);
      try { router.replace(target); } catch (e) {}
    }, 3000); // Increased timeout to 3 seconds for better UX
    return () => {
      try { delete (window as any).__redirectAfterGA; } catch (e) {}
      clearTimeout(fallback);
    };
  }, [router, target]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Event snippet for 购买 conversion page */}
      <Script id="ga-purchase-conversion" strategy="afterInteractive">
        {`
  (function(t,v,c){
    try {
      console.log('Google Ads Conversion Tracking:', {
        transaction_id: t,
        value: v,
        currency: c,
        conversion_id: 'AW-17666304096/jAYQCI3El7IbEODQ-edB'
      });
      
      gtag('event', 'conversion', {
        'send_to': 'AW-17666304096/jAYQCI3El7IbEODQ-edB',
        'value': v,
        'currency': c,
        'transaction_id': t,
        'event_callback': function(){ 
          console.log('Google Ads conversion tracked successfully');
          try { window.__redirectAfterGA && window.__redirectAfterGA(); } catch (e) {} 
        }
      });
    } catch (e) {
      console.error('Google Ads conversion tracking error:', e);
    }
  })(${JSON.stringify(transactionId)}, ${JSON.stringify(value)}, ${JSON.stringify(currency)});
        `}
      </Script>

      <div className="max-w-md w-full p-6 text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Thank you for your purchase. Your credits have been added to your account.
          </p>
          {value > 0 && (
            <p className="text-sm font-semibold text-foreground">
              Amount: {currency} ${value.toFixed(2)}
            </p>
          )}
        </div>

        {isRedirecting ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Redirecting to your account...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                href="/text-to-video" 
                className="inline-flex items-center justify-center px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
              >
                Go to Studio
              </Link>
              <Link 
                href="/account" 
                className="inline-flex items-center justify-center px-6 py-2 rounded-md border border-border hover:bg-accent transition-colors font-medium"
              >
                View Account
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              You will be automatically redirected in a few seconds...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


