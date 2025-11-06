"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function PageView() {
  const pathname = usePathname();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.gtag) {
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
  }, [pathname]);

  return null;
}

