"use client";

import { useEffect, useRef, useState } from 'react';

interface LazyCSSProps {
  href: string;
  media?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyCSS = ({ href, media = 'all', onLoad, onError }: LazyCSSProps) => {
  const linkRef = useRef<HTMLLinkElement | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = media;
    
    // Add loading state
    link.setAttribute('data-loading', 'true');
    
    link.onload = () => {
      link.setAttribute('data-loaded', 'true');
      link.removeAttribute('data-loading');
      loadedRef.current = true;
      onLoad?.();
    };
    
    link.onerror = () => {
      link.setAttribute('data-error', 'true');
      link.removeAttribute('data-loading');
      onError?.();
    };

    // Insert after existing stylesheets
    const existingStylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    if (existingStylesheets.length > 0) {
      const lastStylesheet = existingStylesheets[existingStylesheets.length - 1];
      lastStylesheet.parentNode?.insertBefore(link, lastStylesheet.nextSibling);
    } else {
      document.head.appendChild(link);
    }

    linkRef.current = link;

    return () => {
      if (linkRef.current && linkRef.current.parentNode) {
        linkRef.current.parentNode.removeChild(linkRef.current);
      }
    };
  }, [href, media, onLoad, onError]);

  return null;
};

export default LazyCSS;

// Hook for lazy loading CSS
export const useLazyCSS = (href: string, media?: string) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = media || 'all';
    
    link.onload = () => setIsLoaded(true);
    link.onerror = () => setHasError(true);

    document.head.appendChild(link);

    return () => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, [href, media]);

  return { isLoaded, hasError };
};

// Utility function to preload CSS
export const preloadCSS = (href: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    
    link.onload = () => {
      // Convert preload to stylesheet
      link.rel = 'stylesheet';
      resolve();
    };
    
    link.onerror = reject;
    
    document.head.appendChild(link);
  });
};

// Utility function to load CSS with priority
export const loadCriticalCSS = (href: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-critical', 'true');
    
    link.onload = () => resolve();
    link.onerror = reject;
    
    // Insert at the beginning of head for priority
    document.head.insertBefore(link, document.head.firstChild);
  });
};
