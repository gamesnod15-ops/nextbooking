import Link from 'next/link'
import { Check, X } from 'lucide-react'

interface ApiPlan {
  name: string
  badgeLabel: string
  description: string
  price: number | null
  isCustomPricing: boolean
  buttonText: string
  features: string[]
  isHighlighted: boolean
  highlightLabel: string | null
  planKey: string | null
}

const accentClasses = ['border-slate-200 bg-slate-100 text-slate-700', 'border-blue-200 bg-blue-50 text-blue-700', 'border-amber-200 bg-amber-50 text-amber-700']

async function getPlans(): Promise<ApiPlan[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5280'
  try {
    // Uncached: a price edited in the manager panel has to show up on the next
    // page load. ISR here meant an admin saw a stale price for up to 5 minutes
    // and assumed the change hadn't saved.
    const res = await fetch(`${apiUrl}/api/v1/pricing-plans`, { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function PricingSection() {
  const plans = await getPlans()
  if (plans.length === 0) return null

  // Union of every feature across plans, in first-seen order — used for the
  // comparison table below the cards. Slot order runs cheapest → richest, so
  // this also groups the rows by the tier each feature is introduced in.
  const allFeatures: string[] = []
  for (const plan of plans) {
    for (const feature of plan.features) {
      if (!allFeatures.includes(feature)) allFeatures.push(feature)
    }
  }

  // Tiers are cumulative: each plan includes everything from the plans below
  // it, so a feature counts as present if it's listed on this plan or any
  // cheaper one — only genuinely higher-tier features show as missing.
  const includedFeatures = plans.map(
    (_, i) => new Set(plans.slice(0, i + 1).flatMap((p) => p.features))
  )

  let accentIdx = 0

  return (
    <section id="pricing" className="bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900">İşletmenize Uygun Plan</h2>
          <p className="mt-4 text-lg text-gray-600">14 gün ücretsiz deneyin. Kredi kartı gerekmez.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, i) => {
            const accentClass = plan.isHighlighted ? '' : accentClasses[accentIdx++ % accentClasses.length]
            const [borderClass, ...badgeClassParts] = accentClass.split(' ')
            const badgeClass = badgeClassParts.join(' ')

            return (
              <div
                key={i}
                className={`relative flex flex-col rounded-2xl border-2 p-6 ${
                  plan.isHighlighted
                    ? 'bg-brand-500 text-white border-brand-300 shadow-2xl scale-[1.03]'
                    : `bg-white ${borderClass} shadow-sm`
                }`}
              >
                {plan.isHighlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-brand-500 shadow">
                      {plan.highlightLabel || 'En Popüler'}
                    </span>
                  </div>
                )}

                <div className="mb-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${plan.isHighlighted ? 'bg-white/20 text-white' : badgeClass}`}>
                    {plan.badgeLabel}
                  </span>
                </div>

                <h3 className={`text-xl font-bold ${plan.isHighlighted ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <p className={`mt-1 text-xs leading-relaxed ${plan.isHighlighted ? 'text-white/70' : 'text-gray-500'}`}>{plan.description}</p>

                <div className="mt-5 flex items-baseline gap-0.5">
                  {plan.isCustomPricing ? (
                    <>
                      <span className={`text-4xl font-extrabold ${plan.isHighlighted ? 'text-white' : 'text-gray-900'}`}>Özel</span>
                      <span className={`text-sm font-medium ${plan.isHighlighted ? 'text-white/70' : 'text-gray-500'}`}> fiyat</span>
                    </>
                  ) : (
                    <>
                      <span className={`text-4xl font-extrabold ${plan.isHighlighted ? 'text-white' : 'text-gray-900'}`}>₺{plan.price}</span>
                      <span className={`text-sm font-medium ${plan.isHighlighted ? 'text-white/70' : 'text-gray-500'}`}>/ay</span>
                    </>
                  )}
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.isHighlighted ? 'text-white/60' : 'text-gray-900'}`} />
                      <span className={plan.isHighlighted ? 'text-white/80' : 'text-gray-700'}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.planKey === 'custom' ? '/iletisim' : '/register'}
                  className={`mt-8 block rounded-xl px-4 py-3 text-center text-sm font-semibold transition-all hover:-translate-y-0.5 ${
                    plan.isHighlighted
                      ? 'bg-black text-brand-500 hover:bg-gray-900 shadow'
                      : 'bg-brand-500 text-white hover:bg-brand-600'
                  }`}
                >
                  {plan.buttonText}
                </Link>
              </div>
            )
          })}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          Tüm planlar 14 gün ücretsiz deneme ile başlar. İstediğiniz zaman plan değiştirin veya iptal edin.
        </p>

        {allFeatures.length > 0 && (
          <div className="mt-20 overflow-x-auto rounded-2xl border border-gray-300 bg-white shadow-sm">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-5 py-4 text-left font-semibold text-gray-500">Özellik</th>
                  {plans.map((plan, i) => (
                    <th key={i} className="border border-gray-300 px-5 py-4 text-center font-bold text-gray-900">{plan.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((feature) => (
                  <tr key={feature}>
                    <td className="border border-gray-300 px-5 py-3 text-gray-700">{feature}</td>
                    {plans.map((_, i) => (
                      <td key={i} className="border border-gray-300 px-5 py-3 text-center">
                        {includedFeatures[i].has(feature)
                          ? <Check className="mx-auto h-4 w-4 text-emerald-500" />
                          : <X className="mx-auto h-4 w-4 text-red-300" />}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-5 py-3 font-semibold text-gray-900">Aylık Fiyat</td>
                  {plans.map((plan, i) => (
                    <td key={i} className="border border-gray-300 px-5 py-3 text-center font-bold text-gray-900">
                      {plan.isCustomPricing ? 'Özel fiyat' : `₺${plan.price}/ay`}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
