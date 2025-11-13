'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// 延迟加载非关键组件
const AnalyticsScripts = dynamic(() => import('@/components/AnalyticsScripts'), {
  ssr: false
});

const PageView = dynamic(() => import('./pageview'), {
  ssr: false
});

export function ClientComponents() {
  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsScripts />
      </Suspense>
      <Suspense fallback={null}>
        <PageView />
      </Suspense>
    </>
  )
}


