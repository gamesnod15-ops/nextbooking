'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'

const WHATSAPP_NUMBER = '905055555555'

export function WhatsAppWidget() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [showBubble, setShowBubble] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setShowBubble(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  const send = () => {
    const text = message.trim()
    if (!text) return
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`,
      '_blank'
    )
    setMessage('')
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <>
      {/* Dikey sabit buton */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed right-0 top-1/2 z-50 -translate-y-1/2 rounded-l-xl bg-[#25D366] px-2.5 py-4 text-white shadow-lg transition-all duration-300 hover:bg-[#20ba5a] hover:pr-4 group"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        <span className="flex items-center gap-2 text-xs font-semibold tracking-wide">
          <MessageCircle className="h-4 w-4 rotate-90 shrink-0" />
          Whatsapp'tan Bize Yazın
        </span>
      </button>

      {/* Sohbet kutusu */}
      <div
        className={`fixed bottom-0 right-0 z-50 flex w-full max-w-sm flex-col overflow-hidden rounded-t-2xl shadow-2xl transition-all duration-500 ease-out ${
          open
            ? 'translate-x-0 opacity-100'
            : 'translate-x-full opacity-0 pointer-events-none'
        }`}
        style={{ height: 'min(480px, 80vh)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 bg-[#25D366] px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">JetRandevu</p>
            <p className="text-xs text-white/80">Genellikle birkaç dakika içinde yanıt verir</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mesaj alani */}
        <div className="flex-1 overflow-y-auto bg-[#e5ddd5] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgwLDAsMCwwLjAzKSIvPjwvc3ZnPg==')] p-4">
          <div className="mx-auto max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
            <p className="text-sm text-gray-800">Merhaba! ??</p>
            <p className="mt-1 text-sm text-gray-800">
              Size nasıl yardımcı olabiliriz? Mesajınızı yazın, WhatsApp üzerinden size dönüş yapalım.
            </p>
            <p className="mt-2 text-[10px] text-gray-400 text-right">bugün</p>
          </div>
        </div>

        {/* Input alani */}
        <div className="flex items-end gap-2 border-t border-gray-200 bg-white p-3">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mesajınızı yazın..."
            rows={1}
            className="max-h-24 flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366]"
          />
          <button
            onClick={send}
            disabled={!message.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md transition-all duration-200 hover:bg-[#20ba5a] hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 transition-opacity md:bg-transparent"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}
