
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import 'leaflet/dist/leaflet.css'
import { CookieConsent } from '@/components/CookieConsent'
import { ScrollToTop } from '@/components/ScrollToTop'
import { WhatsAppWidget } from '@/components/WhatsAppWidget'

// Self-hosted by Next at build time. Previously globals.css did
// `@import url(fonts.googleapis.com…)`, which is render-blocking *and*
// serialised: the browser had to fetch our CSS, discover the import, then
// wait on a third-party round trip before it could paint anything.
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title:       'JetRandevu — Türkiye\'nin En Hızlı Randevu Sistemi',
  description: 'Kuaför, güzellik salonu, diş kliniği ve daha fazlası için çevrimiçi randevu sistemi. Kolay kurulum, güçlü yönetim.',
  keywords:    'randevu sistemi, online randevu, kuaför randevu, güzellik salonu randevu',
  icons: {
    icon: '/icon-title.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={inter.variable}>
      <body className="antialiased">
        {children}
        <ScrollToTop />
        <WhatsAppWidget />
        <CookieConsent />
      </body>
    </html>
  )
}
