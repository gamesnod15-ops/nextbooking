import Link from 'next/link'

const socialLinks = [
  {
    name: 'Instagram',
    href: '#',
    icon: (props: any) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
  },
  {
    name: 'Facebook',
    href: '#',
    icon: (props: any) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.931-1.956 1.886v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
      </svg>
    ),
  },
  {
    name: 'X',
    href: '#',
    icon: (props: any) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    href: '#',
    icon: (props: any) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
]

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-6">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo-black-last.png" alt="BookingAi" className="h-8 w-auto" />
            </Link>
            <p className="mt-3 text-sm text-gray-500 max-w-xs">Türkiye&apos;nin en hızlı büyüyen online randevu platformu.</p>
            {/* Social icons */}
            <div className="mt-4 flex items-center gap-3">
              {socialLinks.map((s) => (
                <Link
                  key={s.name}
                  href={s.href}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-all"
                  aria-label={s.name}
                >
                  <s.icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
            {/* Phone */}
            <p className="mt-3 flex items-center gap-2 text-sm text-gray-500">
              <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
              <a href="tel:+908505555555" className="hover:text-brand-500 transition-colors">0850 555 55 55</a>
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900">Ürün</h4>
            <ul className="mt-3 space-y-2">
              <li><Link href="/features" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Özellikler</Link></li>
              <li><Link href="/pricing" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Fiyatlandırma</Link></li>
              <li><Link href="/demo" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Demo</Link></li>
              <li><Link href="/isletmeler" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">İşletmeler</Link></li>
              <li><Link href="/reklamveren" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Reklamveren Ol</Link></li>
              <li><Link href="/sponsorlu" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Sponsorlu Öne Çıkan</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Şirket</h4>
            <ul className="mt-3 space-y-2">
              <li><Link href="/hakkimizda" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Hakkımızda</Link></li>
              <li><Link href="/iletisim" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">İletişim</Link></li>
              <li><Link href="/blog" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Destek</h4>
            <ul className="mt-3 space-y-2">
              <li><Link href="/faq" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Sık Sorulan Sorular</Link></li>
              <li><Link href="/docs" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Dokümantasyon</Link></li>
              <li><Link href="/iletisim" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Destek Merkezi</Link></li>
              <li><Link href="/login" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Giriş Yap</Link></li>
              <li><Link href="/register" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Kayıt Ol</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Yasal</h4>
            <ul className="mt-3 space-y-2">
              <li><Link href="/kvkk" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">KVKK</Link></li>
              <li><Link href="/cerez-politikasi" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Çerez Politikası</Link></li>
              <li><Link href="/guvenlik-politikasi" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Güvenlik Politikası</Link></li>
              <li><Link href="/gizlilik" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Gizlilik Politikası</Link></li>
              <li><Link href="/kullanim" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Kullanım Şartları</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-200 pt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-gray-400">© 2026 BookingAi. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              Güvenli Ödeme
            </span>
            {/* Mastercard */}
            <svg width="38" height="26" viewBox="0 0 38 26" fill="none">
              <rect x="0.5" y="0.5" width="37" height="25" rx="3.5" fill="white" stroke="#D1D5DB" />
              <circle cx="14" cy="13" r="8" fill="#EB001B" opacity="0.8" />
              <circle cx="24" cy="13" r="8" fill="#F79E1B" opacity="0.8" />
            </svg>
            {/* Visa */}
            <span className="flex h-7 w-auto items-center justify-center rounded-[4px] border border-gray-300 bg-white px-1.5">
              <img src="/visa.svg" alt="Visa" className="h-4 w-auto" />
            </span>
            <span className="w-px h-6 bg-gray-300" />
            {/* Google Play */}
            <span className="flex h-7 items-center gap-1 rounded-[4px] border border-gray-300 bg-white px-2.5">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
                <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.2a1.497 1.497 0 010 2.596z" fill="#EA4335" />
                <path d="M6.259 1.501h11.479a1.499 1.499 0 011.298.749l-3.515 3.521-10.237 10.24-3.019-1.738a1.498 1.498 0 01-.749-1.298V4.998a1.5 1.5 0 01.749-1.298l3.994-2.199z" fill="#34A853" />
                <path d="M4.028 20.252l3.994 2.199a1.5 1.5 0 001.498 0l10.498-6.052-3.919-2.218-12.07 12.071z" fill="#FBBC05" />
                <path d="M1.5 5v14l4.76-2.74L1.5 5z" fill="#4285F4" />
              </svg>
              <span className="text-[10px] font-semibold text-gray-600 whitespace-nowrap">Google Play</span>
            </span>
            {/* App Store */}
            <span className="flex h-7 items-center gap-1 rounded-[4px] border border-gray-300 bg-white px-2.5">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="#A3AAAE" />
              </svg>
              <span className="text-[10px] font-semibold text-gray-600 whitespace-nowrap">App Store</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
