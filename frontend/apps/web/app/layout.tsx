
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import 'leaflet/dist/leaflet.css'
import { CookieConsent } from '@/components/CookieConsent'
import { ScrollToTop } from '@/components/ScrollToTop'
import { WhatsAppWidget } from '@/components/WhatsAppWidget'
import { PreloadScreen } from '@/components/PreloadScreen'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title:       'JetRandevu — Türkiye\'nin En Hýzlý Randevu Sistemi',
  description: 'Kuaför, güzellik salonu, diþ kliniði ve daha fazlasý için çevrimiçi randevu sistemi. Kolay kurulum, güçlü yönetim.',
  keywords:    'randevu sistemi, online randevu, kuaför randevu, güzellik salonu randevu',
  icons: {
    icon: '/icon-title.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={inter.variable}>
      <body className="antialiased">
        <PreloadScreen />
        {children}
        <ScrollToTop />
        <WhatsAppWidget />
        <CookieConsent />
      </body>
    </html>
  )
}
