/**
 * Performance optimization utilities
 */

// Debounce function for performance optimization
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function for performance optimization
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver | null => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }

  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
};

// Preload critical resources
export const preloadResource = (href: string, as: string): void => {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
};

// Prefetch resources for better performance
export const prefetchResource = (href: string): void => {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
};

// Check if user prefers reduced motion
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Get device pixel ratio for responsive images
export const getDevicePixelRatio = (): number => {
  if (typeof window === 'undefined') return 1;
  
  return window.devicePixelRatio || 1;
};

// Check if connection is slow
export const isSlowConnection = (): boolean => {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return false;
  }

  const connection = (navigator as any).connection;
  return connection && (
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    connection.saveData === true
  );
};

// Optimize images based on connection speed
export const getOptimizedImageSrc = (src: string, width?: number): string => {
  if (isSlowConnection()) {
    // Use lower quality for slow connections
    return `${src}?quality=75&width=${width || 800}`;
  }
  
  return `${src}?quality=90&width=${width || 1200}`;
};

// Performance timing utilities
export const measurePerformance = (name: string, fn: () => void): void => {
  if (typeof window === 'undefined' || !('performance' in window)) {
    fn();
    return;
  }

  const start = performance.now();
  fn();
  const end = performance.now();
  
  console.log(`Performance: ${name} took ${end - start} milliseconds`);
};

// Memory usage monitoring
export const getMemoryUsage = (): any => {
  if (typeof window === 'undefined' || !('memory' in performance)) {
    return null;
  }

  return (performance as any).memory;
};

// Log performance metrics
export const logPerformanceMetrics = (): void => {
  if (typeof window === 'undefined') return;

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const memory = getMemoryUsage();

  console.group('Performance Metrics');
  console.log('Page Load Time:', navigation.loadEventEnd - navigation.loadEventStart, 'ms');
  console.log('DOM Content Loaded:', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart, 'ms');
  console.log('First Paint:', performance.getEntriesByName('first-paint')[0]?.startTime, 'ms');
  console.log('First Contentful Paint:', performance.getEntriesByName('first-contentful-paint')[0]?.startTime, 'ms');
  
  if (memory) {
    console.log('Memory Usage:', {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB',
    });
  }
  
  console.groupEnd();
};
