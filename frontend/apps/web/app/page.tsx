import { Navbar }             from '@/components/Navbar'
import { VideoHeroBanner }    from '@/components/VideoHeroBanner'
import { BentoHeroSection }   from '@/components/BentoHeroSection'
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
        <VideoHeroBanner />
        <BentoHeroSection />
        <FeaturesSection />
        <SocialProofSection />
        <PricingSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  )
}
