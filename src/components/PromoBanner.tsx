"use client";

import { useState, useEffect } from "react";
import { X, Gift } from "lucide-react";
import Link from "next/link";

const PromoBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted before checking localStorage
  useEffect(() => {
    setIsMounted(true);
    const dismissed = localStorage.getItem('promo-banner-dismissed');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  // Update CSS variable for navigation positioning
  useEffect(() => {
    if (isMounted) {
      if (isVisible) {
        document.documentElement.style.setProperty('--banner-height', '60px');
      } else {
        document.documentElement.style.setProperty('--banner-height', '0px');
      }
    }
  }, [isVisible, isMounted]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('promo-banner-dismissed', 'true');
    document.documentElement.style.setProperty('--banner-height', '0px');
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted || !isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-secondary text-secondary-foreground shadow-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          {/* Left side - Gift icon and text */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Gift className="w-5 h-5 text-yellow-300" />
              <span className="font-semibold text-sm sm:text-base">
                Enjoy Limited-Time <span className="text-yellow-300 font-bold">50% OFF!</span>
              </span>
            </div>
          </div>

          {/* Right side - Get Offer button and Close button */}
          <div className="flex items-center space-x-3">
            <Link
              href="/plans"
              className="bg-yellow-300 text-gray-900 dark:text-gray-900 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-yellow-200 transition-colors duration-200 shadow-sm"
            >
              Get Offer
            </Link>
            <button
              onClick={handleClose}
              className="flex-shrink-0 p-1 rounded-full hover:bg-foreground/10 transition-colors duration-200"
              aria-label="Close banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;
