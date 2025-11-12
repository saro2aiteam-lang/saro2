"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function PageView() {
  const pathname = usePathname();
  const hasInitialized = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 50; // 5 seconds max wait time

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Reset retry count on pathname change
    retryCount.current = 0;

    // Wait for gtag to be available with retry mechanism
    const trackPageView = () => {
      if (!window.gtag) {
        // Retry after a short delay if gtag isn't ready
        if (retryCount.current < maxRetries) {
          retryCount.current++;
          setTimeout(trackPageView, 100);
        }
        return;
      }

      // Track initial page view on first mount
      if (!hasInitialized.current) {
        hasInitialized.current = true;
        window.gtag("config", "G-P6GF9BE0RJ", {
          page_path: pathname,
        });
        return;
      }

      // Track page view on pathname change
      window.gtag("config", "G-P6GF9BE0RJ", {
        page_path: pathname,
      });
    };

    trackPageView();
  }, [pathname]);

  return null;
}


