"use client";

import Script from "next/script";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const transactionId = (searchParams?.get('transaction_id') || searchParams?.get('tx') || '').toString();
  const valueRaw = (searchParams?.get('value') || searchParams?.get('amount') || searchParams?.get('total') || '').toString();
  const valueNum = Number.parseFloat(valueRaw);
  const value = Number.isFinite(valueNum) && valueNum > 0 ? valueNum : 1.0;
  const currency = ((searchParams?.get('currency') || searchParams?.get('curr') || 'USD').toString().toUpperCase()).slice(0, 3);

  const plan = (searchParams?.get('plan') || '').toString();
  const target = `/account?payment=success${plan ? `&plan=${encodeURIComponent(plan)}` : ""}`;

  useEffect(() => {
    (window as any).__redirectAfterGA = () => {
      try { router.replace(target); } catch (e) {}
    };
    const fallback = setTimeout(() => {
      try { router.replace(target); } catch (e) {}
    }, 1000);
    return () => {
      try { delete (window as any).__redirectAfterGA; } catch (e) {}
      clearTimeout(fallback);
    };
  }, [router, target]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
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

      <div className="max-w-md w-full p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">Payment Successful</h1>
        <p className="text-muted-foreground mb-6">Thank you for your purchase. Redirecting to your account...</p>
        <div className="space-x-3">
          <Link href="/text-video" className="inline-block px-4 py-2 rounded-md bg-primary text-primary-foreground">
            Go to Studio
          </Link>
          <Link href="/account" className="inline-block px-4 py-2 rounded-md border">
            View Account
          </Link>
        </div>
      </div>
    </div>
  );
}


