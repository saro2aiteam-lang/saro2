'use client';

import { useEffect } from 'react';
import { initClarity } from '@/lib/clarity';

export default function ClarityScript() {
  useEffect(() => {
    initClarity();
  }, []);

  return null;
}
