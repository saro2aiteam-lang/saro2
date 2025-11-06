"use client";

import { useEffect } from 'react';

interface CriticalCSSProps {
  css?: string;
}

const CriticalCSS = ({ css }: CriticalCSSProps) => {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Inline critical CSS for above-the-fold content
    const criticalCSS = css || `
      /* Critical CSS for above-the-fold content */
      body {
        margin: 0;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        background-color: hsl(var(--background));
        color: hsl(var(--foreground));
      }
      
      .min-h-screen {
        min-height: 100vh;
      }
      
      .bg-background {
        background-color: hsl(var(--background));
      }
      
      .text-foreground {
        color: hsl(var(--foreground));
      }
      
      /* Navigation critical styles */
      .fixed {
        position: fixed;
      }
      
      .top-0 {
        top: 0;
      }
      
      .left-0 {
        left: 0;
      }
      
      .right-0 {
        right: 0;
      }
      
      .z-50 {
        z-index: 50;
      }
      
      /* Hero section critical styles */
      .pt-20 {
        padding-top: 5rem;
      }
      
      .pb-16 {
        padding-bottom: 4rem;
      }
      
      .text-center {
        text-align: center;
      }
      
      .max-w-7xl {
        max-width: 80rem;
      }
      
      .mx-auto {
        margin-left: auto;
        margin-right: auto;
      }
      
      .px-4 {
        padding-left: 1rem;
        padding-right: 1rem;
      }
      
      /* Button critical styles */
      .inline-flex {
        display: inline-flex;
      }
      
      .items-center {
        align-items: center;
      }
      
      .justify-center {
        justify-content: center;
      }
      
      .rounded-lg {
        border-radius: 0.5rem;
      }
      
      .px-6 {
        padding-left: 1.5rem;
        padding-right: 1.5rem;
      }
      
      .py-3 {
        padding-top: 0.75rem;
        padding-bottom: 0.75rem;
      }
      
      .text-sm {
        font-size: 0.875rem;
        line-height: 1.25rem;
      }
      
      .font-medium {
        font-weight: 500;
      }
      
      .transition-colors {
        transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
      }
      
      /* Hide non-critical content initially */
      .lazy-load {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      
      .lazy-load.loaded {
        opacity: 1;
        transform: translateY(0);
      }
    `;

    // Create style element for critical CSS
    const style = document.createElement('style');
    style.textContent = criticalCSS;
    style.setAttribute('data-critical', 'true');
    
    // Insert at the beginning of head
    document.head.insertBefore(style, document.head.firstChild);
    
    // Cleanup function
    return () => {
      if (typeof window === 'undefined') return;
      const existingStyle = document.querySelector('style[data-critical="true"]');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [css]);

  return null; // This component doesn't render anything
};

export default CriticalCSS;











