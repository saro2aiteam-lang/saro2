"use client";

import { useEffect } from 'react';
import { clearAllTracking, clearTrackingOnly } from '@/lib/tracking-cleaner';

interface TrackingCleanerProps {
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
   * 是否定期清除（毫秒）
   * 默认 0（不定期清除）
   */
  clearInterval?: number;
  
  /**
   * 是否在页面可见性变化时清除
   * 默认 false
   */
  clearOnVisibilityChange?: boolean;
}

/**
 * React 组件：自动清除追踪数据
 * 用于着陆页/跳转页面
 * 
 * @example
 * ```tsx
 * // 在着陆页中使用
 * function LandingPage() {
 *   return (
 *     <div>
 *       <TrackingCleaner clearAll={true} />
 *       <div>Landing Page Content</div>
 *     </div>
 *   );
 * }
 * ```
 */
export default function TrackingCleaner({
  clearAll = false,
  clearOnMount = true,
  clearInterval = 0,
  clearOnVisibilityChange = false,
}: TrackingCleanerProps) {
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
    if (clearInterval <= 0) return;

    // 定期清除
    const intervalId = setInterval(() => {
      if (clearAll) {
        clearAllTracking();
      } else {
        clearTrackingOnly();
      }
    }, clearInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [clearAll, clearInterval]);

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

  // 这是一个无渲染组件
  return null;
}

