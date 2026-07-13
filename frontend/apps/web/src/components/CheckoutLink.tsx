'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { ReactNode } from 'react'

interface Props {
  type: 'ad' | 'sponsored'
  plan: string
  className?: string
  children: ReactNode
}

export default function CheckoutLink({ type, plan, className, children }: Props) {
  const [href, setHref] = useState('/register')

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      setHref(`/satin-al?type=${type}&plan=${encodeURIComponent(plan)}`)
    } else {
      setHref(`/register?redirect=${encodeURIComponent(`/satin-al?type=${type}&plan=${encodeURIComponent(plan)}`)}`)
    }
  }, [type, plan])

  return <Link href={href} className={className}>{children}</Link>
}
