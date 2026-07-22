import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dokümantasyon — JetRandevu',
  description: 'JetRandevu API dokümantasyonu, entegrasyon rehberleri ve sýk sorulan sorular.',
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children
}
