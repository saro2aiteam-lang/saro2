"use client";

import { usePathname } from 'next/navigation'

export default function RootLoading() {
  const pathname = usePathname()
  if (pathname?.startsWith('/auth')) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-xl bg-white/90 p-6 shadow-xl">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        <div className="text-sm text-gray-700">Loading page…</div>
      </div>
    </div>
  )
}


