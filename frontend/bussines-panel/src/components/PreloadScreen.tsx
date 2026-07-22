import { useState, useEffect } from 'react'

export function PreloadScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'glitch' | 'fade-out'>('glitch')

  useEffect(() => {
    const glitchTimer = setTimeout(() => setPhase('fade-out'), 2500)
    const completeTimer = setTimeout(() => onComplete(), 3000)
    return () => {
      clearTimeout(glitchTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div className={`preload-screen ${phase === 'fade-out' ? 'preload-fade-out' : ''}`}>
      <div className="preload-content">
        {/* Speed lines */}
        <div className="speed-lines">
          <div className="speed-line sl-1" />
          <div className="speed-line sl-2" />
          <div className="speed-line sl-3" />
          <div className="speed-line sl-4" />
          <div className="speed-line sl-5" />
        </div>

        {/* Glitch icon */}
        <div className="glitch-wrapper">
          <img
            src="/icon-site.png"
            alt="JetRandevu"
            className="glitch-icon"
          />
          <img
            src="/icon-site.png"
            alt=""
            className="glitch-icon glitch-copy glitch-r"
            aria-hidden="true"
          />
          <img
            src="/icon-site.png"
            alt=""
            className="glitch-icon glitch-copy glitch-b"
            aria-hidden="true"
          />
        </div>

        {/* Brand text */}
        <div className="preload-brand">
          <span className="brand-jet">Jet</span>
          <span className="brand-randevu">Randevu</span>
        </div>
      </div>
    </div>
  )
}
