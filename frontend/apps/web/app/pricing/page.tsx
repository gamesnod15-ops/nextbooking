import { Navbar }         from '@/components/Navbar'
import { PricingSection } from '@/components/PricingSection'
import { CtaSection }     from '@/components/CtaSection'
import { Footer }         from '@/components/Footer'

export const metadata = { title: 'Fiyatlandırma — NextBooking' }

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main>
        <PricingSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  )
}
