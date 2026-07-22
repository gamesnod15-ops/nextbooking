import { useState, useEffect, useMemo } from 'react'
import { formatCurrency } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, DollarSign,
  Plus, Trash2, Calculator, BarChart3,
} from 'lucide-react'

interface PackageRow {
  id: string
  name: string
  price: number
  customers: number
}

interface ExpenseRow {
  id: string
  label: string
  amount: number
}

const STORAGE_KEY = 'finance_calc_data'

const defaultPackages: PackageRow[] = [
  { id: '1', name: 'Başlangıç', price: 799, customers: 0 },
  { id: '2', name: 'Büyüme', price: 1299, customers: 0 },
  { id: '3', name: 'Profesyonel', price: 1699, customers: 0 },
  { id: '4', name: 'Kurumsal', price: 0, customers: 0 },
]

const defaultExpenses: ExpenseRow[] = [
  { id: '1', label: 'Personel Maaşları', amount: 0 },
  { id: '2', label: 'Ofis Kirası', amount: 0 },
  { id: '3', label: 'Reklam Bütçesi', amount: 0 },
  { id: '4', label: 'Altyapı (Sunucu, Domain vb.)', amount: 0 },
  { id: '5', label: 'SIGORTA & Vergi', amount: 0 },
]

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function saveData(data: { packages: PackageRow[]; expenses: ExpenseRow[]; customPrice: number }) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* quota */ }
}

let _id = 100
function nextId() { return String(++_id) }

export function FinanceCalculatorPage() {
  const saved = useMemo(() => loadSaved(), [])

  const [packages, setPackages] = useState<PackageRow[]>(
    saved?.packages ?? defaultPackages
  )
  const [customPrice, setCustomPrice] = useState<number>(saved?.customPrice ?? 0)
  const [expenses, setExpenses] = useState<ExpenseRow[]>(
    saved?.expenses ?? defaultExpenses
  )

  // Persist on every change
  useEffect(() => { saveData({ packages, expenses, customPrice }) }, [packages, expenses, customPrice])

  // ── Revenue calculations ──
  const totalMonthlyRevenue = useMemo(() => {
    return packages.reduce((sum, p) => {
      const price = p.name === 'Kurumsal' ? customPrice : p.price
      return sum + price * p.customers
    }, 0)
  }, [packages, customPrice])

  const totalYearlyRevenue = totalMonthlyRevenue * 12

  // ── Expense calculations ──
  const totalMonthlyExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0)
  }, [expenses])

  const totalYearlyExpenses = totalMonthlyExpenses * 12

  // ── Net profit ──
  const netMonthly = totalMonthlyRevenue - totalMonthlyExpenses
  const netYearly = netMonthly * 12
  const profitMargin = totalMonthlyRevenue > 0
    ? ((netMonthly / totalMonthlyRevenue) * 100).toFixed(1)
    : '0.0'

  // ── Package helpers ──
  function updatePackage(id: string, field: 'price' | 'customers', value: number) {
    setPackages(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  function addPackage() {
    setPackages(prev => [...prev, { id: nextId(), name: 'Yeni Paket', price: 0, customers: 0 }])
  }

  function removePackage(id: string) {
    setPackages(prev => prev.filter(p => p.id !== id))
  }

  function updatePackageName(id: string, name: string) {
    setPackages(prev => prev.map(p => p.id === id ? { ...p, name } : p))
  }

  // ── Expense helpers ──
  function updateExpense(id: string, amount: number) {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, amount } : e))
  }

  function updateExpenseLabel(id: string, label: string) {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, label } : e))
  }

  function addExpense() {
    setExpenses(prev => [...prev, { id: nextId(), label: 'Yeni Gider', amount: 0 }])
  }

  function removeExpense(id: string) {
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const profitColor = netMonthly >= 0 ? 'text-emerald-600' : 'text-red-600'
  const profitBg = netMonthly >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
          <Calculator className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finans Hesaplayıcı</h1>
          <p className="text-sm text-gray-500">Aylık ve yıllık gelir-gider analizi</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
          label="Aylık Gelir"
          value={formatCurrency(totalMonthlyRevenue)}
          bg="bg-emerald-50 border-emerald-200"
        />
        <SummaryCard
          icon={<TrendingDown className="h-5 w-5 text-red-500" />}
          label="Aylık Gider"
          value={formatCurrency(totalMonthlyExpenses)}
          bg="bg-red-50 border-red-200"
        />
        <div className={`rounded-xl border-2 p-4 ${profitBg}`}>
          <div className="flex items-center gap-2">
            <DollarSign className={`h-5 w-5 ${profitColor}`} />
            <span className="text-sm font-medium text-gray-600">Net Aylık Kâr</span>
          </div>
          <p className={`mt-2 text-2xl font-bold ${profitColor}`}>{formatCurrency(netMonthly)}</p>
          <p className="text-xs text-gray-500 mt-1">Marj: %{profitMargin}</p>
        </div>
        <SummaryCard
          icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
          label="Net Yıllık Kâr"
          value={formatCurrency(netYearly)}
          bg="bg-blue-50 border-blue-200"
          valueClass="text-blue-700"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* ─── REVENUE SECTION ─── */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-gray-900">Gelir (Paketler)</h2>
            </div>
            <button
              onClick={addPackage}
              className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Ekle
            </button>
          </div>

          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-[1fr_100px_90px_36px] gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Paket Adı</span>
              <span className="text-right">Aylık Ücret</span>
              <span className="text-right">Müşteri</span>
              <span />
            </div>

            {packages.map((pkg) => (
              <div key={pkg.id} className="grid grid-cols-[1fr_100px_90px_36px] gap-2 items-center">
                <input
                  type="text"
                  value={pkg.name}
                  onChange={(e) => updatePackageName(pkg.id, e.target.value)}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 focus:border-brand-400 focus:ring-1 focus:ring-brand-400 outline-none"
                />
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">₺</span>
                  <input
                    type="number"
                    value={pkg.price || ''}
                    onChange={(e) => updatePackage(pkg.id, 'price', Number(e.target.value) || 0)}
                    disabled={pkg.name === 'Kurumsal'}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-6 pr-2 py-2 text-sm text-right text-gray-900 focus:border-brand-400 focus:ring-1 focus:ring-brand-400 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
                <input
                  type="number"
                  value={pkg.customers || ''}
                  onChange={(e) => updatePackage(pkg.id, 'customers', Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-sm text-right text-gray-900 focus:border-brand-400 focus:ring-1 focus:ring-brand-400 outline-none"
                />
                <button
                  onClick={() => removePackage(pkg.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {/* Kurumsal custom price */}
            {packages.some(p => p.name === 'Kurumsal') && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                <span className="text-xs font-medium text-amber-700">Kurumsal birim fiyat:</span>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-amber-500">₺</span>
                  <input
                    type="number"
                    value={customPrice || ''}
                    onChange={(e) => setCustomPrice(Number(e.target.value) || 0)}
                    className="w-28 rounded border border-amber-300 bg-white pl-5 pr-2 py-1 text-sm text-right text-amber-900 focus:ring-1 focus:ring-amber-400 outline-none"
                  />
                </div>
                <span className="text-xs text-amber-600">/ay</span>
              </div>
            )}

            {/* Subtotals per package */}
            <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
              {packages.map((pkg) => {
                const price = pkg.name === 'Kurumsal' ? customPrice : pkg.price
                const sub = price * pkg.customers
                return (
                  <div key={pkg.id} className="flex justify-between text-xs text-gray-500">
                    <span>{pkg.name} × {pkg.customers} müşteri</span>
                    <span className="font-medium text-gray-700">{formatCurrency(sub)}</span>
                  </div>
                )
              })}
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-100">
                <span>Toplam Aylık Gelir</span>
                <span>{formatCurrency(totalMonthlyRevenue)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Yıllık Gelir (×12)</span>
                <span className="font-semibold text-gray-700">{formatCurrency(totalYearlyRevenue)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── EXPENSE SECTION ─── */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-bold text-gray-900">Giderler</h2>
            </div>
            <button
              onClick={addExpense}
              className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Ekle
            </button>
          </div>

          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-[1fr_130px_36px] gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Gider Kalemi</span>
              <span className="text-right">Aylık Tutar</span>
              <span />
            </div>

            {expenses.map((exp) => (
              <div key={exp.id} className="grid grid-cols-[1fr_130px_36px] gap-2 items-center">
                <input
                  type="text"
                  value={exp.label}
                  onChange={(e) => updateExpenseLabel(exp.id, e.target.value)}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:ring-1 focus:ring-brand-400 outline-none"
                />
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">₺</span>
                  <input
                    type="number"
                    value={exp.amount || ''}
                    onChange={(e) => updateExpense(exp.id, Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-6 pr-2 py-2 text-sm text-right text-gray-900 focus:border-brand-400 focus:ring-1 focus:ring-brand-400 outline-none"
                  />
                </div>
                <button
                  onClick={() => removeExpense(exp.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {/* Totals */}
            <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
              {/* Expense breakdown */}
              {expenses.filter(e => e.amount > 0).map((exp) => (
                <div key={exp.id} className="flex justify-between text-xs text-gray-500">
                  <span>{exp.label}</span>
                  <span className="font-medium text-gray-700">{formatCurrency(exp.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-100">
                <span>Toplam Aylık Gider</span>
                <span>{formatCurrency(totalMonthlyExpenses)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Yıllık Gider (×12)</span>
                <span className="font-semibold text-gray-700">{formatCurrency(totalYearlyExpenses)}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom profit summary bar */}
      <div className={`rounded-2xl border-2 p-6 ${profitBg}`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Aylık Gelir</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">{formatCurrency(totalMonthlyRevenue)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Aylık Gider</p>
            <p className="mt-1 text-xl font-bold text-red-600">{formatCurrency(totalMonthlyExpenses)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Net Aylık Kâr</p>
            <p className={`mt-1 text-3xl font-extrabold ${profitColor}`}>{formatCurrency(netMonthly)}</p>
            <p className="text-xs text-gray-500 mt-1">
              Yıllık: <span className={`font-bold ${profitColor}`}>{formatCurrency(netYearly)}</span>
              {' · '}Marj: <span className="font-bold">{profitMargin}%</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ icon, label, value, bg, valueClass }: {
  icon: React.ReactNode
  label: string
  value: string
  bg: string
  valueClass?: string
}) {
  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <p className={`mt-2 text-2xl font-bold ${valueClass ?? 'text-gray-900'}`}>{value}</p>
    </div>
  )
}
