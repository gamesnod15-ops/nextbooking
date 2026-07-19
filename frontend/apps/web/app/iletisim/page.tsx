'use client'

import { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Mail, Phone, MapPin, Clock, Bot, MessageSquare, Send, CheckCircle } from 'lucide-react'
import { InstagramIcon, FacebookIcon, XIcon, YouTubeIcon, LinkedInIcon, TikTokIcon } from '@/lib/icons'

export default function IletisimPage() {
  const [form, setForm] = useState({ ad: '', soyad: '', email: '', konu: '', mesaj: '' })
  const [errors, setErrors] = useState<{ ad?: string; soyad?: string; email?: string; konu?: string; mesaj?: string }>({})
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name as keyof typeof errors]) {
      setErrors({ ...errors, [e.target.name]: undefined })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: typeof errors = {}
    if (!form.ad.trim())     newErrors.ad = 'Bu alan zorunludur.'
    if (!form.soyad.trim())  newErrors.soyad = 'Bu alan zorunludur.'
    if (!form.email.trim())  newErrors.email = 'Bu alan zorunludur.'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = 'Geçerli bir e-posta girin.'
    if (!form.konu.trim())   newErrors.konu = 'Lütfen bir konu seçin.'
    if (!form.mesaj.trim())  newErrors.mesaj = 'Mesaj alanı boş bırakılamaz.'
    setErrors(newErrors)
    if (Object.keys(newErrors).length === 0) {
      setSubmitted(true)
      setForm({ ad: '', soyad: '', email: '', konu: '', mesaj: '' })
    }
  }

  const inputCls = (err?: string) => [
    'w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all duration-200',
    err
      ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
      : 'border-gray-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 hover:border-gray-300',
  ].join(' ')

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-28 text-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-[400px] w-[400px] rounded-full bg-brand-500/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-[300px] w-[300px] rounded-full bg-violet-500/10 blur-3xl" />
            <svg className="absolute top-20 right-1/4 h-48 w-48 opacity-[0.04]" viewBox="0 0 200 200" fill="none">
              <rect x="10" y="10" width="180" height="180" rx="30" className="stroke-white stroke-[1.5]" fill="none" />
              <circle cx="100" cy="100" r="70" className="stroke-white stroke-[1.5]" fill="none" />
            </svg>
            <svg className="absolute bottom-10 left-1/3 h-36 w-36 opacity-[0.03]" viewBox="0 0 200 200" fill="none">
              <polygon points="100,0 200,200 0,200" className="fill-white" />
            </svg>
          </div>
          <div className="relative mx-auto max-w-3xl px-5 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 mb-3">İletişim</p>
            <h1 className="text-5xl font-extrabold leading-tight mb-6">Nasıl Yardımcı Olabiliriz?</h1>
            <p className="mx-auto max-w-xl text-lg text-gray-300">
              Sorularınız, önerileriniz veya özel ihtiyaçlarınız için bize ulaşın.
              Ekibimiz en kısa sürede size geri dönecek.
            </p>
          </div>
        </section>

        {/* Support channels - Creative cards */}
        <section className="bg-white py-20 border-b border-gray-100">
          <div className="mx-auto max-w-6xl px-5">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-extrabold text-gray-900">Destek Kanallarımız</h2>
              <p className="text-sm text-gray-500 mt-2">Size en uygun kanaldan ulaşın</p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* 7/24 Support */}
              <div className="group relative rounded-3xl border-2 border-brand-100 bg-gradient-to-br from-brand-50 to-blue-50 p-6 hover:border-brand-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="absolute top-0 left-6 right-6 h-1 rounded-full bg-gradient-to-r from-brand-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-blue-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">7/24 Destek</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">
                  Destek birimimiz haftanın 7 günü, günün 24 saati hizmetinizdedir.
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Çevrimiçi
                </span>
              </div>

              {/* Chatbot */}
              <div className="group relative rounded-3xl border border-gray-200 bg-white p-6 shadow-sm hover:border-violet-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="absolute top-0 left-6 right-6 h-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 group-hover:from-violet-200 group-hover:to-purple-200 transition-all shadow-sm">
                  <Bot className="h-7 w-7 text-violet-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">AI Chatbot</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">
                  Yapay zeka destekli chatbot&apos;umuz sık sorulan sorulara anında yanıt verir.
                </p>
                <a href="#chatbot" className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:underline">
                  Chatbot&apos;u Aç ›
                </a>
              </div>

              {/* Live chat */}
              <div className="group relative rounded-3xl border border-gray-200 bg-white p-6 shadow-sm hover:border-emerald-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="absolute top-0 left-6 right-6 h-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 group-hover:from-emerald-200 group-hover:to-teal-200 transition-all shadow-sm">
                  <MessageSquare className="h-7 w-7 text-emerald-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">Canlı Destek</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">
                  Uzman destek ekibimizle gerçek zamanlı sohbet edin. Ortalama yanıt süremiz 2 dakika.
                </p>
                <p className="text-xs text-gray-400">Pzt–Cum: 09:00–22:00<br />Cts–Paz: 10:00–18:00</p>
              </div>

              {/* Contact info */}
              <div className="group relative rounded-3xl border border-gray-200 bg-white p-6 shadow-sm hover:border-amber-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="absolute top-0 left-6 right-6 h-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 group-hover:from-amber-200 group-hover:to-orange-200 transition-all shadow-sm">
                  <Mail className="h-7 w-7 text-amber-600" />
                </div>
                <div className="space-y-3">
                  {[
                    { icon: Mail,   label: 'E-posta', value: 'destek@bookingai.com' },
                    { icon: Phone,  label: 'Telefon', value: '+90 (212) 000 00 00' },
                    { icon: MapPin, label: 'Adres',   value: 'Maslak, İstanbul' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <div>
                        <p className="text-[11px] text-gray-400">{label}</p>
                        <p className="text-xs font-medium text-gray-700">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Media - Creative */}
        <section className="bg-white py-16 border-b border-gray-100">
          <div className="mx-auto max-w-3xl px-5 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 mb-3">Sosyal Medya</p>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Bizi Takip Edin</h2>
            <p className="text-sm text-gray-500 mb-10">Güncelleme ve duyurular için sosyal medya hesaplarımızı takip edin.</p>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              {[
                { icon: InstagramIcon, label: 'Instagram', href: '#', color: 'hover:bg-gradient-to-br hover:from-pink-500 hover:to-orange-500' },
                { icon: FacebookIcon, label: 'Facebook', href: '#', color: 'hover:bg-blue-600' },
                { icon: XIcon, label: 'X (Twitter)', href: '#', color: 'hover:bg-black' },
                { icon: YouTubeIcon, label: 'YouTube', href: '#', color: 'hover:bg-red-600' },
                { icon: LinkedInIcon, label: 'LinkedIn', href: '#', color: 'hover:bg-blue-700' },
                { icon: TikTokIcon, label: 'TikTok', href: '#', color: 'hover:bg-black' },
              ].map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-2.5">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-gray-100 bg-white text-gray-700 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-2 group-hover:scale-110 ${s.color} group-hover:text-white group-hover:border-transparent`}>
                    <s.icon size={24} />
                  </div>
                  <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700 transition-colors">{s.label}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Contact form + FAQ */}
        <section className="bg-gray-50 py-20">
          <div className="mx-auto max-w-5xl px-5">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_420px]">

              {/* Form */}
              <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Send className="h-5 w-5 text-brand-500" /> Bize Yazın
                </h2>
                <p className="text-sm text-gray-500 mb-6">En geç 1 iş günü içinde yanıt veriyoruz.</p>

                {submitted ? (
                  <div className="flex flex-col items-center py-10 text-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Mesajınız Alındı!</h3>
                    <p className="text-sm text-gray-600 max-w-sm">En kısa sürede size geri döneceğiz. Teşekkür ederiz!</p>
                    <button onClick={() => setSubmitted(false)} className="mt-2 text-sm text-brand-500 hover:underline font-medium">
                      Yeni mesaj gönder
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="iletisim-ad" className="mb-1.5 block text-sm font-medium text-gray-700">Ad *</label>
                        <input id="iletisim-ad" name="ad" type="text" placeholder="Ahmet" value={form.ad} onChange={handleChange} className={inputCls(errors.ad)} />
                        {errors.ad && <p className="mt-1 text-xs text-red-500">{errors.ad}</p>}
                      </div>
                      <div>
                        <label htmlFor="iletisim-soyad" className="mb-1.5 block text-sm font-medium text-gray-700">Soyad *</label>
                        <input id="iletisim-soyad" name="soyad" type="text" placeholder="Yılmaz" value={form.soyad} onChange={handleChange} className={inputCls(errors.soyad)} />
                        {errors.soyad && <p className="mt-1 text-xs text-red-500">{errors.soyad}</p>}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="iletisim-email" className="mb-1.5 block text-sm font-medium text-gray-700">E-posta *</label>
                      <input id="iletisim-email" name="email" type="email" placeholder="ornek@email.com" value={form.email} onChange={handleChange} className={inputCls(errors.email)} />
                      {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                    </div>
                    <div>
                      <label htmlFor="iletisim-konu" className="mb-1.5 block text-sm font-medium text-gray-700">Konu *</label>
                      <select id="iletisim-konu" name="konu" value={form.konu} onChange={handleChange} className={inputCls(errors.konu)}>
                        <option value="">Konu seçin…</option>
                        <option value="teknik">Teknik Destek</option>
                        <option value="fatura">Fatura & Ödeme</option>
                        <option value="satis">Satış & Fiyatlandırma</option>
                        <option value="ozellik">Özellik Talebi</option>
                        <option value="diger">Diğer</option>
                      </select>
                      {errors.konu && <p className="mt-1 text-xs text-red-500">{errors.konu}</p>}
                    </div>
                    <div>
                      <label htmlFor="iletisim-mesaj" className="mb-1.5 block text-sm font-medium text-gray-700">Mesajınız *</label>
                      <textarea id="iletisim-mesaj" name="mesaj" rows={5} placeholder="Nasıl yardımcı olabiliriz?" value={form.mesaj} onChange={handleChange}
                        className={`${inputCls(errors.mesaj)} resize-none`} />
                      {errors.mesaj && <p className="mt-1 text-xs text-red-500">{errors.mesaj}</p>}
                    </div>
                    <button type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 text-sm font-bold text-white shadow-md hover:bg-brand-600 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                      <Send className="h-4 w-4" /> Gönder
                    </button>
                  </form>
                )}
              </div>

              {/* FAQ */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Sık Sorulan Sorular</h2>
                {[
                  { q: '7/24 destek ücretsiz mi?', a: 'Evet, tüm planlarda 7/24 çevrimiçi chatbot ve e-posta desteği ücretsizdir. Business ve üzeri planlarda canlı destek de dahildir.' },
                  { q: 'AI Chatbot ne yapabilir?', a: 'Chatbot\'umuz randevu yönetimi, fatura sorguları, teknik sorunlar ve sık sorulan soruları anında yanıtlar. Yeterli olmazsa sizi canlı destek ekibine yönlendirir.' },
                  { q: 'Ortalama yanıt süresi ne kadar?', a: 'Chatbot anında yanıt verir. Canlı destek için ortalama 2 dakika, e-posta için 1 iş günüdür.' },
                  { q: 'Teknik sorunlar için ne yapmalıyım?', a: 'Önce AI Chatbot\'u deneyin. Çözüm bulamazsanız canlı destek veya destek formuyla bize ulaşın. Kritik sorunlara 1 saat içinde yanıt veriyoruz.' },
                  { q: 'Demo talep edebilir miyim?', a: 'Evet! Formu kullanarak "Satış & Fiyatlandırma" konusunu seçin, size en uygun zamanda ekibimiz arayacak.' },
                ].map(({ q, a }) => (
                  <div key={q} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-sm font-semibold text-gray-900 mb-1.5">{q}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
