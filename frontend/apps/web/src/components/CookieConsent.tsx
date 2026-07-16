'use client'

import React, { useState, useEffect } from 'react';
import { X, Cookie, Check } from 'lucide-react';

const STORAGE_KEY = 'nextbooking-cookie-consent';

const COOKIE_CATEGORIES = [
  { key: 'necessary', label: 'Zorunlu Çerezler', description: 'Web sitesinin çalışması için gereklidir.' },
  { key: 'analytics', label: 'Analitik Çerezler', description: 'Site kullanımını analiz etmemizi sağlar.' },
  { key: 'marketing', label: 'Pazarlama Çerezleri', description: 'Kişiselleştirilmiş reklamlar sunar.' },
];

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [choices, setChoices] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setOpen(true);
    }
  }, []);

  const handleChange = (key: string) => {
    if (key === 'necessary') return;
    setChoices((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const save = (c: typeof choices) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    setChoices(c);
    setOpen(false);
  };

  const acceptAll = () => {
    save({ necessary: true, analytics: true, marketing: true });
  };

  const rejectAll = () => {
    save({ necessary: true, analytics: false, marketing: false });
  };

  const acceptSelected = () => {
    save(choices);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-black border border-white/10 p-6 shadow-2xl animate-fade-in">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500">
              <Cookie className="h-5 w-5 text-black" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Çerez Politikası</h3>
              <p className="text-sm text-gray-400">Deneyiminizi iyileştirmek için çerezler kullanıyoruz.</p>
            </div>
          </div>
          <button onClick={rejectAll} aria-label="Kapat ve sadece zorunlu çerezlere izin ver" className="rounded-lg p-1.5 text-gray-500 hover:bg-white/10 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2 mb-6">
          {COOKIE_CATEGORIES.map((cat) => (
            <label
              key={cat.key}
              className={`flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors ${
                choices[cat.key as keyof typeof choices]
                  ? 'border-brand-500/30 bg-brand-500/5'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                  choices[cat.key as keyof typeof choices]
                    ? 'border-brand-500 bg-brand-500'
                    : 'border-white/20 bg-transparent'
                }`}
              >
                {choices[cat.key as keyof typeof choices] && <Check className="h-3 w-3 text-black" />}
              </div>
              <input
                type="checkbox"
                checked={choices[cat.key as keyof typeof choices]}
                disabled={cat.key === 'necessary'}
                onChange={() => handleChange(cat.key)}
                className="sr-only"
              />
              <div className="flex-1">
                <p className={`text-sm font-medium ${choices[cat.key as keyof typeof choices] ? 'text-white' : 'text-gray-300'}`}>
                  {cat.label}
                  {cat.key === 'necessary' && <span className="ml-1.5 text-xs text-gray-500">(zorunlu)</span>}
                </p>
                <p className="text-xs text-gray-500">{cat.description}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={acceptAll} className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-black hover:bg-brand-600 transition-all">
            <Check className="h-4 w-4" /> Tüm Çerezlere İzin Ver
          </button>
          <button onClick={acceptSelected} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors">
            Seçilenlere İzin Ver
          </button>
          <button onClick={rejectAll} className="rounded-xl px-4 py-2.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Sadece Zorunlu Çerezler
          </button>
        </div>
      </div>
    </div>
  );
}
