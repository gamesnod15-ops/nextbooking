'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Package,
  Receipt,
  ShoppingBag,
  CreditCard,
  User,
  Globe,
  ExternalLink,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import axios from '@/lib/axios'

interface SummaryCard {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  href: string
  status?: 'ok' | 'warn' | 'neutral'
}

export default function PanelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [businessPanelUrl, setBusinessPanelUrl] = useState(process.env.NEXT_PUBLIC_BUSINESS_PANEL_URL || 'http://localhost:3000');
  const [cards, setCards] = useState<SummaryCard[]>([]);
  const [hasSiteBuilder, setHasSiteBuilder] = useState(false);
  const [domain, setDomain] = useState('');
  const [activePackage, setActivePackage] = useState('');
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/');
      return;
    }
    setFullName(localStorage.getItem('fullName') ?? '');
    const userId   = localStorage.getItem('userId') ?? '';
    const role     = localStorage.getItem('role') ?? '';
    const tenantId = localStorage.getItem('tenantId') ?? '';
    const fullName = localStorage.getItem('fullName') ?? '';
    const params = new URLSearchParams({ autologin: token, userId, role, tenantId, fullName });
    setBusinessPanelUrl(`${process.env.NEXT_PUBLIC_BUSINESS_PANEL_URL || 'http://localhost:3000'}?${params.toString()}`);

    Promise.all([
      axios.get('/api/v1/Business/me'),
      axios.get('/api/v1/Receivables').catch(() => ({ data: { items: [] } })),
    ]).then(([businessRes, receivablesRes]) => {
      const data = businessRes.data;
      const orders = receivablesRes.data.items || receivablesRes.data || [];
      const planName = ({ starter: 'Başlangıç', business: 'Büyüme', professional: 'Otomasyon', custom: 'Kurumsal' } as Record<string, string>)[data.plan] || 'Professional';
      setActivePackage(planName);
      setSubscriptionEnd(data.subscriptionEndsAt || null);

      const totalSpent = orders
        .filter((o: any) => o.status === 'Paid')
        .reduce((sum: number, o: any) => sum + (o.totalAmount ?? 0), 0);
      const activeOrders = orders.filter((o: any) => o.status === 'Open' || o.status === 'PartiallyPaid');
      const processingCount = activeOrders.filter((o: any) => o.status === 'Open').length;

      const computedCards: SummaryCard[] = [
        {
          label:  'Paket Bilgisi',
          value:  planName,
          sub:    subscriptionEnd ? `Kalan: ${getRemainingLabel(subscriptionEnd)}` : `Plan: ${data.plan || 'starter'}`,
          icon:   Package,
          href:   '/panel/paket',
          status: subscriptionEnd && new Date(subscriptionEnd) <= new Date() ? 'warn' : 'ok',
        },
        {
          label:  'Toplam Harcama',
          value:  `₺${totalSpent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
          sub:    `${orders.length} fatura`,
          icon:   Receipt,
          href:   '/panel/fatura',
          status: 'ok',
        },
        {
          label:  'Aktif Sipariş',
          value:  String(activeOrders.length),
          sub:    `${processingCount} işlemde`,
          icon:   ShoppingBag,
          href:   '/panel/siparisler',
          status: activeOrders.length > 0 ? 'warn' : 'ok',
        },
        {
          label:  'Ödeme Yöntemi',
          value:  data.paymentMethod || '**** 4242',
          sub:    data.paymentMethodExpiry || 'Visa',
          icon:   CreditCard,
          href:   '/panel/odeme-yontemleri',
          status: 'ok',
        },
        {
          label:  'Profil',
          value:  data.name || fullName || 'Kullanıcı',
          sub:    'Profil bilgilerini güncelle',
          icon:   User,
          href:   '/panel/profil',
          status: 'neutral',
        },
      ];
      setCards(computedCards);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [router]);

  function getRemainingLabel(endsAt: string) {
    const end = new Date(endsAt)
    const now = new Date()
    if (end <= now) return 'Süresi doldu'
    const totalDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const months = Math.floor(totalDays / 30)
    const days = totalDays % 30
    if (months > 0) return `${months} ay ${days} gün`
    return `${days} gün`
  }

  if (loading) return <div className="max-w-5xl mx-auto py-12 text-center text-gray-500">Yükleniyor...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Merhaba{fullName ? `, ${fullName.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">Hesap panelinize hoş geldiniz. Tüm bilgilerinizi buradan yönetebilirsiniz.</p>
      </div>

      <a
        href={businessPanelUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 rounded-2xl bg-black p-5 text-white shadow-md hover:shadow-lg transition-shadow border border-white/10"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500">
          <Globe className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-base">İşletme Paneline Git</p>
          <p className="text-sm text-gray-400">Randevularınızı, müşterilerinizi ve personelinizi yönetin.</p>
        </div>
        <ExternalLink className="h-5 w-5 text-gray-500" />
      </a>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ label, value, sub, icon: Icon, href, status }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col items-center justify-center gap-2 rounded-xl bg-white border border-gray-100 px-4 py-4 min-h-[140px] min-w-0 max-w-full hover:shadow-md hover:border-brand-100 transition-all"
            style={{ height: 160, minWidth: 0 }}
          >
            <div className="flex flex-col items-center justify-center flex-1 w-full">
              <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-brand-50 mb-2">
                <Icon className="h-5 w-5 text-brand-500" />
              </div>
              <p className="text-[1.6rem] font-extrabold text-gray-900 leading-tight text-center">{value}</p>
              <p className="text-base font-bold text-gray-700 text-center mb-1">{label}</p>
              {sub && <p className="text-xs text-gray-400 text-center">{sub}</p>}
            </div>
            <div className="flex items-center gap-1 text-xs text-brand-500 font-medium group-hover:gap-2 transition-all mt-2">
              <span>Detaylar</span>
              <ArrowRight className="h-3 w-3" />
              {status === 'ok'   && <CheckCircle2 className="h-4 w-4 text-green-500 ml-2" />}
              {status === 'warn' && <AlertCircle  className="h-4 w-4 text-amber-500 ml-2" />}
            </div>
          </Link>
        ))}
      </div>

      {hasSiteBuilder && domain && (
        <div className="rounded-2xl bg-white border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-5 w-5 text-brand-500" />
            <h2 className="font-semibold text-gray-900">Alan Adı (Domain)</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="font-mono text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 inline-block">
                {domain}
              </p>
              <p className="mt-1.5 text-xs text-gray-400">Özel domain atamak için paket ayarlarınızı inceleyin.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full font-medium">
              <CheckCircle2 className="h-3 w-3" /> Aktif
            </span>
          </div>
        </div>
      )}

      {hasSiteBuilder && !domain && (
        <div className="rounded-2xl bg-white border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="h-5 w-5 text-brand-500" />
            <h2 className="font-semibold text-gray-900">Web Siteniz</h2>
          </div>
          <p className="text-sm text-gray-600">İşletme panelinizden site oluşturma özelliğiniz bulunuyor. Henüz bir domain ayarlanmamış.</p>
        </div>
      )}
    </div>
  )
}
