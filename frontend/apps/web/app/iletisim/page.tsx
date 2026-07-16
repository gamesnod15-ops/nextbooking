﻿'use client'

import { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Mail, Phone, MapPin, Clock, Bot, MessageSquare, Send, CheckCircle, ExternalLink } from 'lucide-react'
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
    'w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors',
    err
      ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
      : 'border-gray-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
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
          </div>
          <div className="relative mx-auto max-w-3xl px-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 mb-3">İletişim</p>
            <h1 className="text-5xl font-extrabold leading-tight mb-6">Nasıl Yardımcı Olabiliriz?</h1>
            <p className="mx-auto max-w-xl text-lg text-gray-300">
              Sorularınız, önerileriniz veya özel ihtiyaçlarınız için bize ulaşın.
              Ekibimiz en kısa sürede size geri dönecek.
            </p>
          </div>
        </section>

        {/* Support channels */}
        <section className="bg-white py-16 border-b border-gray-100">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* 7/24 Support */}
              <div className="rounded-2xl border-2 border-brand-100 bg-brand-50 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500">
                  <Clock className="h-6 w-6 text-black" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">7/24 Destek</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Destek birimimiz haftanın 7 günü, günün 24 saati hizmetinizdedir. Acil durumlar için öncelikli destek hattımızı kullanın.
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Çevrimiçi
                </span>
              </div>

              {/* Chatbot */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100">
                  <Bot className="h-6 w-6 text-violet-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">AI Chatbot</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Yapay zeka destekli chatbot&apos;umuz sık sorulan sorulara anında yanıt verir. Panel içinde sağ alt köşedeki sohbet simgesinden erişebilirsiniz.
                </p>
                <a href="#chatbot" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:underline">
                  Chatbot&apos;u Aç ›
                </a>
              </div>

              {/* Live chat */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
                  <MessageSquare className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Canlı Destek</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Uzman destek ekibimizle gerçek zamanlı sohbet edin. Ortalama yanıt süremiz 2 dakika.
                </p>
                <p className="mt-3 text-xs text-gray-400">Pzt–Cum: 09:00–22:00<br />Cts–Paz: 10:00–18:00</p>
              </div>

              {/* Contact info */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                {[
                  { icon: Mail,   label: 'E-posta', value: 'destek@nextbooking.com' },
                  { icon: Phone,  label: 'Telefon', value: '+90 (212) 000 00 00' },
                  { icon: MapPin, label: 'Adres',   value: 'Maslak, İstanbul' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                      <Icon className="h-4 w-4 text-brand-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Social Media */}
        <section className="bg-white py-16 border-b border-gray-100">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 mb-3">Sosyal Medya</p>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Bizi Takip Edin</h2>
            <p className="text-sm text-gray-500 mb-8">Güncelleme ve duyurular için sosyal medya hesaplarımızı takip edin.</p>
            <div className="flex items-center justify-center gap-5">
              {[
                { icon: InstagramIcon, label: 'Instagram', href: '#', color: 'hover:bg-gradient-to-br from-pink-500 to-orange-500' },
                { icon: FacebookIcon, label: 'Facebook', href: '#', color: 'hover:bg-blue-600' },
                { icon: XIcon, label: 'X (Twitter)', href: '#', color: 'hover:bg-black' },
                { icon: YouTubeIcon, label: 'YouTube', href: '#', color: 'hover:bg-red-600' },
                { icon: LinkedInIcon, label: 'LinkedIn', href: '#', color: 'hover:bg-blue-700' },
                { icon: TikTokIcon, label: 'TikTok', href: '#', color: 'hover:bg-black' },
              ].map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-2">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-gray-100 bg-white text-gray-700 shadow-sm transition-all group-hover:shadow-lg group-hover:-translate-y-1 ${s.color} group-hover:text-white group-hover:border-transparent`}>
                    <s.icon size={22} />
                  </div>
                  <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">{s.label}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Contact form + FAQ */}
        <section className="bg-gray-50 py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_420px]">

              {/* Form */}
              <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
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
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 text-sm font-bold text-black shadow-md hover:bg-brand-600 transition-all hover:-translate-y-0.5 hover:shadow-lg">
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
                  <div key={q} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
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
