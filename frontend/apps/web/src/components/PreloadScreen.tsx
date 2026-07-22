'use client'

import { useState, useEffect } from 'react'

const preloadCSS = `
#preload-screen {
  position: fixed; inset: 0; z-index: 99999;
  display: flex; align-items: center; justify-content: center;
  background: #ffffff;
  transition: opacity 0.5s ease, visibility 0.5s ease;
}
#preload-screen.hide { opacity: 0; visibility: hidden; pointer-events: none; }
.preload-inner { display: flex; flex-direction: column; align-items: center; gap: 20px; position: relative; }
.ps-lines { position: absolute; inset: -80px; pointer-events: none; overflow: hidden; }
.ps-line { position: absolute; height: 2px; background: linear-gradient(90deg, transparent, rgba(1,84,240,0.5), transparent); border-radius: 2px; opacity: 0; animation: psSpeed 1.2s ease-out infinite; }
.ps-l1 { top: 20%; left: -40%; width: 60%; animation-delay: 0s; }
.ps-l2 { top: 40%; left: -30%; width: 50%; animation-delay: 0.2s; }
.ps-l3 { top: 55%; left: -50%; width: 70%; animation-delay: 0.4s; }
.ps-l4 { top: 70%; left: -35%; width: 55%; animation-delay: 0.15s; }
.ps-l5 { top: 85%; left: -45%; width: 65%; animation-delay: 0.35s; }
@keyframes psSpeed { 0% { opacity: 0; transform: translateX(-100%); } 30% { opacity: 1; } 100% { opacity: 0; transform: translateX(300%); } }
.ps-icon-wrap { position: relative; width: 80px; height: 80px; animation: psEntry 0.8s cubic-bezier(0.25,0.46,0.45,0.94) both; }
.ps-icon { width: 80px; height: 80px; object-fit: contain; filter: drop-shadow(0 0 20px rgba(1,84,240,0.3)); }
.ps-copy { position: absolute; top: 0; left: 0; mix-blend-mode: multiply; }
.ps-r { animation: psGlitchR 3s infinite; }
.ps-b { animation: psGlitchB 3s infinite; }
@keyframes psEntry { 0% { opacity: 0; transform: scale(0.3) translateX(-60px); filter: blur(10px); } 50% { opacity: 1; transform: scale(1.1) translateX(5px); filter: blur(0); } 70% { transform: scale(0.95) translateX(-2px); } 100% { transform: scale(1) translateX(0); } }
@keyframes psGlitchR { 0%, 100% { clip-path: inset(0 0 100% 0); transform: translate(0); } 5% { clip-path: inset(20% 0 60% 0); transform: translate(4px, -2px); } 10% { clip-path: inset(50% 0 20% 0); transform: translate(-3px, 1px); } 15% { clip-path: inset(10% 0 70% 0); transform: translate(2px, 3px); } 20%, 44% { clip-path: inset(0 0 100% 0); transform: translate(0); } 50% { clip-path: inset(30% 0 40% 0); transform: translate(-5px, 2px); } 55% { clip-path: inset(60% 0 10% 0); transform: translate(3px, -1px); } 60%, 84% { clip-path: inset(0 0 100% 0); transform: translate(0); } 87% { clip-path: inset(40% 0 30% 0); transform: translate(2px, 2px); } 90% { clip-path: inset(0 0 100% 0); transform: translate(0); } }
@keyframes psGlitchB { 0%, 100% { clip-path: inset(100% 0 0 0); transform: translate(0); } 5% { clip-path: inset(60% 0 20% 0); transform: translate(-4px, 2px); } 10% { clip-path: inset(20% 0 50% 0); transform: translate(3px, -1px); } 15% { clip-path: inset(70% 0 10% 0); transform: translate(-2px, -3px); } 20%, 44% { clip-path: inset(100% 0 0 0); transform: translate(0); } 50% { clip-path: inset(40% 0 30% 0); transform: translate(5px, -2px); } 55% { clip-path: inset(10% 0 60% 0); transform: translate(-3px, 1px); } 60%, 84% { clip-path: inset(100% 0 0 0); transform: translate(0); } 87% { clip-path: inset(30% 0 40% 0); transform: translate(-2px, -2px); } 90% { clip-path: inset(100% 0 0 0); transform: translate(0); } }
`

export function PreloadScreen() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 3000)
    const hideTimer = setTimeout(() => setVisible(false), 3500)
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer) }
  }, [])

  if (!visible) return null

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: preloadCSS }} />
      <div id="preload-screen" className={fading ? 'hide' : ''}>
        <div className="preload-inner">
          <div className="ps-lines">
            <div className="ps-line ps-l1" />
            <div className="ps-line ps-l2" />
            <div className="ps-line ps-l3" />
            <div className="ps-line ps-l4" />
            <div className="ps-line ps-l5" />
          </div>
          <div className="ps-icon-wrap">
            <img src="/icon-site.png" alt="JetRandevu" className="ps-icon" />
            <img src="/icon-site.png" alt="" className="ps-icon ps-copy ps-r" aria-hidden="true" />
            <img src="/icon-site.png" alt="" className="ps-icon ps-copy ps-b" aria-hidden="true" />
          </div>
        </div>
      </div>
    </>
  )
}
