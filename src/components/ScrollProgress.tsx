"use client";

import { useEffect, useState } from "react";

interface ScrollProgressProps {
  className?: string;
}

const ScrollProgress = ({ className = "" }: ScrollProgressProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setProgress(progress);
    };

    window.addEventListener('scroll', updateProgress);
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <div className={`fixed top-0 left-0 w-full h-1 bg-secondary/30 z-50 ${className}`}>
      <div 
        className="h-full bg-primary transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ScrollProgress;