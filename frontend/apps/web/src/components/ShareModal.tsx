'use client'

import { X, Link, Check } from 'lucide-react'
import { useState } from 'react'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  url: string
  title: string
}

const platforms = [
  {
    name: 'WhatsApp',
    color: 'bg-emerald-500',
    getUrl: (u: string, t: string) => `https://wa.me/?text=${encodeURIComponent(t + ' ' + u)}`,
  },
  {
    name: 'X (Twitter)',
    color: 'bg-black',
    getUrl: (u: string, t: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}`,
  },
  {
    name: 'Facebook',
    color: 'bg-blue-600',
    getUrl: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
  },
  {
    name: 'Telegram',
    color: 'bg-sky-500',
    getUrl: (u: string, t: string) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
  },
  {
    name: 'LinkedIn',
    color: 'bg-blue-700',
    getUrl: (u: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}`,
  },
  {
    name: 'E-Posta',
    color: 'bg-gray-600',
    getUrl: (u: string, t: string) => `mailto:?subject=${encodeURIComponent(t)}&body=${encodeURIComponent(t + '\n\n' + u)}`,
  },
]

export function ShareModal({ open, onClose, url, title }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  if (!open) return null

  function copyLink() {
    const ta = document.createElement('textarea')
    ta.value = url
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
         onClick={onClose}>
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6"
           onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
          <X className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Paylaş</h3>
        <p className="text-xs text-gray-500 mb-5">İşletmeyi arkadaşlarınla paylaş</p>

        <button onClick={copyLink}
          className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:border-brand-300 hover:bg-brand-50 transition-all mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Link className="h-4 w-4 text-brand-500" />}
          </div>
          <span>{copied ? 'Kopyalandı!' : 'Bağlantıyı Kopyala'}</span>
        </button>

        <div className="grid grid-cols-3 gap-3">
          {platforms.map((p) => (
            <a key={p.name} href={p.getUrl(url, title)} target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-xs font-medium text-gray-700 hover:bg-gray-100 hover:border-gray-200 transition-all">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${p.color}`}>
                <span className="text-[10px] font-bold text-white">{p.name[0]}</span>
              </div>
              {p.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
