// Full-width silent autoplay video banner shown above the bento hero.
// Stock footage — swap `src` for real BookingAi/salon footage when available.
export function VideoHeroBanner() {
  return (
    <section className="relative h-[42vh] min-h-[280px] w-full overflow-hidden bg-gray-900 sm:h-[56vh] lg:h-[68vh]">
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
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </section>
  )
}
