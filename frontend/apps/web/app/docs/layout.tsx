import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dokümantasyon — BookingAi',
  description: 'BookingAi API dokümantasyonu, entegrasyon rehberleri ve sık sorulan sorular.',
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children
}
