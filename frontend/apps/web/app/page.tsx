import { Navbar }             from '@/components/Navbar'
import { BentoHeroSection }   from '@/components/BentoHeroSection'
import { ScrollToTop }        from '@/components/ScrollToTop'
import { FeaturesSection }    from '@/components/FeaturesSection'
import { PricingSection }     from '@/components/PricingSection'
import { SocialProofSection } from '@/components/SocialProofSection'
import { CtaSection }         from '@/components/CtaSection'
import { Footer }             from '@/components/Footer'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <BentoHeroSection />
        <FeaturesSection />
        <SocialProofSection />
        <PricingSection />
        <CtaSection />
      </main>
      <ScrollToTop />
      <Footer />
    </>
  )
}
