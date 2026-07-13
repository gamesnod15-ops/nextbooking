'use client'

import { Loader2 } from 'lucide-react'

interface LoadingProps {
  text?: string
}

export function Loading({ text = 'Yükleniyor...' }: LoadingProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-8 py-6 shadow-xl border border-gray-100">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
        <p className="text-sm font-medium text-gray-600">{text}</p>
      </div>
    </div>
  )
}
