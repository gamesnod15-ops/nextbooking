import { Navbar }         from '@/components/Navbar'
import { PricingSection } from '@/components/PricingSection'
import { CtaSection }     from '@/components/CtaSection'
import { Footer }         from '@/components/Footer'

export const metadata = { title: 'Fiyatlandýrma — JetRandevu' }

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main>
        <PricingSection showComparison />
        <CtaSection />
      </main>
      <Footer />
    </>
  )
}
