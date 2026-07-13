'use client'

import { useEffect, useState, useRef } from 'react'
import axios from '@/lib/axios'
import Link from 'next/link'
import {
  ArrowLeft, User, Mail, Phone, Building2, KeyRound, Save, Eye, EyeOff, Camera, Loader2,
} from 'lucide-react'

export default function ProfilPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', company: '' })
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deactivateLoading, setDeactivateLoading] = useState(false)
  const [deactivateSuccess, setDeactivateSuccess] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [deactivatePassword, setDeactivatePassword] = useState('')
  const [deactivateError, setDeactivateError] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    try { return localStorage.getItem('profile_avatar') } catch { return null }
  })
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5280';

  useEffect(() => {
    axios.get('/api/v1/Users/me')
      .then((res: any) => {
        setForm({
          firstName: res.data.firstName || '',
          lastName:  res.data.lastName  || '',
          email:     res.data.email     || '',
          phone:     res.data.phone     || '',
          company:   '',
        })
        if (res.data.avatarUrl) {
          // Eğer path / ile başlıyorsa backend domainiyle birleştir
          const url = res.data.avatarUrl;
          const fullUrl = url.startsWith('/') ? `${API_BASE}${url}` : url;
          try { localStorage.setItem('profile_avatar', fullUrl) } catch {}
          setAvatarUrl(fullUrl)
        }
      })
      .catch(() => setError('Profil verileri alınamadı.'))
      .finally(() => setLoading(false))

    // Business-panel'deki gibi avatar güncellemelerini dinle
    function onStorage(e: StorageEvent) {
      if (e.key === 'profile_avatar') {
        setAvatarUrl(e.newValue)
      }
    }
    window.addEventListener('storage', onStorage)
    function onAvatarUpdate(e: Event) {
      setAvatarUrl((e as CustomEvent<string | null>).detail)
    }
    window.addEventListener('profile_avatar_updated', onAvatarUpdate)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('profile_avatar_updated', onAvatarUpdate)
    }
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(false)
    setError(null)
    try {
      await axios.put('/api/v1/Users/me', {
        firstName: form.firstName,
        lastName:  form.lastName,
        email:     form.email,
        phone:     form.phone,
        jobTitle:  form.company,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      if (typeof window !== 'undefined') {
        localStorage.setItem('fullName', `${form.firstName} ${form.lastName}`.trim())
      }
    } catch {
      setError('Profil güncellenemedi.')
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSaved(false)
    if (passwordForm.newPass !== passwordForm.confirm) {
      setPasswordError('Yeni şifreler eşleşmiyor.')
      return
    }
    if (passwordForm.newPass.length < 6) {
      setPasswordError('Şifre en az 6 karakter olmalıdır.')
      return
    }
    setPasswordSaving(true)
    try {
      await axios.put('/api/v1/Auth/change-password', {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.newPass,
      })
      setPasswordSaved(true)
      setPasswordForm({ current: '', newPass: '', confirm: '' })
      setTimeout(() => setPasswordSaved(false), 2500)
    } catch {
      setPasswordError('Şifre güncellenemedi. Mevcut şifrenizi kontrol edin.')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await axios.put('/api/v1/Users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const rawUrl = res.data.url || res.data.avatarUrl || '';
      let finalUrl = rawUrl;
      // Eğer data:image ile başlıyorsa sadece state'te göster, localStorage'a kaydetme
      if (rawUrl.startsWith('data:image')) {
        setAvatarUrl(rawUrl);
      } else if (rawUrl.startsWith('/')) {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5280';
        finalUrl = `${API_BASE}${rawUrl}`;
        setAvatarUrl(finalUrl);
        try { localStorage.setItem('profile_avatar', finalUrl) } catch {}
      } else {
        setAvatarUrl(rawUrl);
        try { localStorage.setItem('profile_avatar', rawUrl) } catch {}
      }
      window.dispatchEvent(new CustomEvent('profile_avatar_updated', { detail: finalUrl }))
    } catch {
      setError('Fotoğraf yüklenemedi.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (loading) return <div className="max-w-2xl mx-auto py-12 text-center text-gray-500">Yükleniyor...</div>;
  if (error && !form.firstName) return <div className="max-w-2xl mx-auto py-12 text-center text-red-500">{error}</div>;

  const handleDeactivate = async () => {
    setDeactivateError(null);
    if (!deactivatePassword) {
      setDeactivateError('Şifrenizi girmelisiniz.');
      return;
    }
    setDeactivateLoading(true);
    try {
      await axios.post('/api/v1/Business/me/deactivate', { password: deactivatePassword });
      setDeactivateSuccess(true);
      setShowDeactivateModal(false);
      setTimeout(() => {
        setDeactivateSuccess(false);
        window.location.href = '/login';
      }, 2000);
    } catch (e: any) {
      setDeactivateError(e?.response?.data?.message || 'Hesap kapatılamadı.');
    } finally {
      setDeactivateLoading(false);
      setDeactivatePassword('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/panel" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Profil Bilgileri</h1>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 rounded-2xl bg-white border border-gray-100 p-5">
        <div className="relative group">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-extrabold text-2xl select-none overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              `${form.firstName} ${form.lastName}`.trim()[0]?.toUpperCase() || 'U'
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-black shadow hover:bg-brand-600 transition-colors disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{`${form.firstName} ${form.lastName}`.trim() || 'Kullanıcı'}</p>
          <p className="text-sm text-gray-400">{form.email}</p>
        </div>
      </div>

      {/* Profil formu */}
      <form onSubmit={handleSave} className="rounded-2xl bg-white border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Kişisel Bilgiler</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Ad</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Soyad</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">E-posta</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Telefon</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <div className="flex items-center">
                <span className="pl-9 pr-2 py-2.5 text-sm text-gray-500 select-none bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg">+90</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={13}
                  placeholder="5XX XXX XX XX"
                  value={form.phone}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.startsWith('0')) val = val.slice(1); // baştaki 0'ı at
                    if (val.length > 10) val = val.slice(0, 10);
                    // 5XX XXX XX XX formatla
                    let formatted = '';
                    if (val.length > 0) formatted += val.slice(0, 3);
                    if (val.length > 3) formatted += ' ' + val.slice(3, 6);
                    if (val.length > 6) formatted += ' ' + val.slice(6, 8);
                    if (val.length > 8) formatted += ' ' + val.slice(8, 10);
                    setForm((p) => ({ ...p, phone: formatted }));
                  }}
                  className="w-full pr-3 py-2.5 text-sm border border-l-0 border-gray-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
                  style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                />
              </div>
            </div>
          </div>
        </div>

        {error && <div className="text-sm text-red-500">{error}</div>}

        <button
          type="submit"
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-black text-sm font-semibold rounded-lg transition-colors"
        >
          <Save className="h-4 w-4" />
          {saved ? 'Kaydedildi ✓' : 'Değişiklikleri Kaydet'}
        </button>
      </form>

      {/* Şifre değiştir */}
      <form onSubmit={handlePasswordUpdate} className="rounded-2xl bg-white border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Şifre Değiştir</h2>

        <div className="space-y-4">
          {[
            { name: 'current', label: 'Mevcut Şifre' },
            { name: 'newPass', label: 'Yeni Şifre' },
            { name: 'confirm', label: 'Yeni Şifre (Tekrar)' },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={passwordForm[name as keyof typeof passwordForm]}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, [name]: e.target.value }))}
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
                  required
                />
                {name === 'current' && (
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {passwordError && <div className="text-sm text-red-500">{passwordError}</div>}
        {passwordSaved && <div className="text-sm text-green-600 font-medium">Şifre başarıyla güncellendi.</div>}

        <button
          type="submit"
          disabled={passwordSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-900 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <KeyRound className="h-4 w-4" />
          {passwordSaving ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
        </button>
      </form>

      {/* Hesabı Kapat */}
      <div className="rounded-2xl bg-white border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Hesabı Kapat</h2>
        <p className="text-sm text-gray-500">Hesabınızı kapatmak isterseniz aşağıdaki butonu kullanabilirsiniz. Bu işlem hesabınızı pasifleştirir.</p>
        <div className="flex justify-end">
          <button
            className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
            onClick={() => setShowDeactivateModal(true)}
            disabled={deactivateLoading}
          >
            Hesabı Kapat
          </button>
        </div>
        {deactivateSuccess && (
          <div className="text-green-600 text-center font-semibold">Hesabınız kapatıldı, çıkış yapılıyor...</div>
        )}
      </div>

      {/* Hesap kapatma modalı */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm space-y-5 relative">
            <button className="absolute right-3 top-3 text-gray-400 hover:text-gray-600" onClick={() => { setShowDeactivateModal(false); setDeactivatePassword(''); setDeactivateError(null); }}>&times;</button>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Hesabı Kapat</h2>
            <p className="text-sm text-gray-600 mb-2">Hesabınızı kapatmak için şifrenizi girin. Bu işlem hesabınızı pasifleştirir, tekrar giriş yaparak hesabınızı yeniden aktif edebilirsiniz.</p>
            <input
              type="password"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              placeholder="Şifreniz"
              value={deactivatePassword}
              onChange={e => setDeactivatePassword(e.target.value)}
              disabled={deactivateLoading}
            />
            {deactivateError && <div className="text-red-600 text-sm">{deactivateError}</div>}
            <div className="flex gap-2 mt-4">
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
                onClick={() => { setShowDeactivateModal(false); setDeactivatePassword(''); setDeactivateError(null); }}
                disabled={deactivateLoading}
              >Vazgeç</button>
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                onClick={handleDeactivate}
                disabled={deactivateLoading}
              >{deactivateLoading ? 'Kapatılıyor...' : 'Hesabı Kapat'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
