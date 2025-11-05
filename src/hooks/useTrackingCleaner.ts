"use client";

import { useEffect } from 'react';
import { clearAllTracking, clearTrackingOnly } from '@/lib/tracking-cleaner';

interface UseTrackingCleanerOptions {
  /**
   * 是否清除所有数据（包括非追踪的）
   * 默认 false，只清除追踪相关的
   */
  clearAll?: boolean;
  
  /**
   * 是否在组件挂载时立即清除
   * 默认 true
   */
  clearOnMount?: boolean;
  
  /**
   * 是否在页面可见性变化时清除
   * 默认 false
   */
  clearOnVisibilityChange?: boolean;
  
  /**
   * 是否在页面卸载时清除
   * 默认 false
   */
  clearOnUnmount?: boolean;
}

/**
 * React Hook：自动清除追踪数据
 * 用于着陆页/跳转页面
 * 
 * @example
 * ```tsx
 * // 在着陆页组件中使用
 * function LandingPage() {
 *   useTrackingCleaner({ clearAll: true });
 *   return <div>Landing Page</div>;
 * }
 * ```
 */
export function useTrackingCleaner(options: UseTrackingCleanerOptions = {}) {
  const {
    clearAll = false,
    clearOnMount = true,
    clearOnVisibilityChange = false,
    clearOnUnmount = false,
  } = options;

  useEffect(() => {
    if (!clearOnMount) return;

    // 组件挂载时清除
    if (clearAll) {
      clearAllTracking();
    } else {
      clearTrackingOnly();
    }
  }, [clearAll, clearOnMount]);

  useEffect(() => {
    if (!clearOnVisibilityChange) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (clearAll) {
          clearAllTracking();
        } else {
          clearTrackingOnly();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clearAll, clearOnVisibilityChange]);

  useEffect(() => {
    if (!clearOnUnmount) return;

    return () => {
      // 组件卸载时清除
      if (clearAll) {
        clearAllTracking();
      } else {
        clearTrackingOnly();
      }
    };
  }, [clearAll, clearOnUnmount]);
}

export default useTrackingCleaner;

