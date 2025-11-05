import { useEffect, useRef } from "react";

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

const AnimatedCounter = ({ 
  end, 
  duration = 2000, 
  suffix = "", 
  className = "" 
}: AnimatedCounterProps) => {
  const countRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<number>();

  useEffect(() => {
    const startTime = Date.now();
    const startValue = 0;

    const updateCount = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easeOut * (end - startValue) + startValue);
      
      if (countRef.current) {
        countRef.current.textContent = current.toString();
      }
      
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(updateCount);
      }
    };

    frameRef.current = requestAnimationFrame(updateCount);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration]);

  return (
    <span className={className}>
      <span ref={countRef}>0</span>
      {suffix}
    </span>
  );
};

export default AnimatedCounter;