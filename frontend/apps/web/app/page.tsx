import { Navbar }             from '@/components/Navbar'
import { SearchHeroSection }  from '@/components/SearchHeroSection'
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
        <SearchHeroSection />
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
