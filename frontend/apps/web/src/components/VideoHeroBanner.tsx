import { VideoHeroPopup } from './VideoHeroPopup'

// Full-width silent autoplay video banner shown above the bento hero.
// Stock footage — swap `src` for real JetRandevu/salon footage when available.
export function VideoHeroBanner() {
  return (
    <section id="video-hero-banner" className="relative h-screen w-full overflow-hidden bg-brand-900">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="https://videos.pexels.com/video-files/7754398/7754398-hd_1280_720_30fps.mp4" type="video/mp4" />
      </video>
      {/* Warm brand tint up top, fading to white at the base so the video
          blends into BentoHeroSection's white background below it. */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-900/15 via-transparent to-white" />
      <VideoHeroPopup targetId="video-hero-banner" />
    </section>
  )
}
