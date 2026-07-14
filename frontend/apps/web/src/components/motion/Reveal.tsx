'use client'

import { motion, useReducedMotion, type Variants } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

/**
 * Renders a plain element on the server + first client paint (matching SSR
 * output exactly), then swaps to the animated motion element post-hydration.
 * Motion applies `initial` styles only on the client, so animating from the
 * very first render would desync from the server-rendered HTML.
 */
function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

/** Fades + slides an element up once it scrolls into view. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const shouldReduceMotion = useReducedMotion()
  const mounted = useMounted()

  if (!mounted) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

/** Wrap a group of <StaggerItem> children to reveal them in sequence. */
export function StaggerGroup({ children, className }: { children: ReactNode; className?: string }) {
  const mounted = useMounted()

  if (!mounted) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const shouldReduceMotion = useReducedMotion()
  const mounted = useMounted()

  if (!mounted) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      variants={{
        hidden: shouldReduceMotion ? {} : { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
