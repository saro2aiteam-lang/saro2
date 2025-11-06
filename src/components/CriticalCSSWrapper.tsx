"use client";

import dynamic from 'next/dynamic';

const CriticalCSS = dynamic(() => import('@/components/CriticalCSS'), {
  ssr: false
});

export default function CriticalCSSWrapper() {
  return <CriticalCSS />;
}

