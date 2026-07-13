
import type { Metadata } from 'next'
import './globals.css'
import 'leaflet/dist/leaflet.css'
import { CookieConsent } from '@/components/CookieConsent'

export const metadata: Metadata = {
  title:       'NextBooking — Türkiye\'nin En Hızlı Randevu Sistemi',
  description: 'Kuaför, güzellik salonu, diş kliniği ve daha fazlası için çevrimiçi randevu sistemi. Kolay kurulum, güçlü yönetim.',
  keywords:    'randevu sistemi, online randevu, kuaför randevu, güzellik salonu randevu',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="antialiased">
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
