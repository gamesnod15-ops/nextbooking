import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { PatternOverlay } from '@/components/ui/PatternOverlay';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Avatar } from '@/components/ui/Avatar';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout, updateProfile } from '@/store/slices/authSlice';
import { clearBusiness, setBusiness } from '@/store/slices/businessSlice';
import * as SecureStore from 'expo-secure-store';
import { useToast } from '@/components/ui/Toast';
import api, { fixImageUrl } from '@/lib/api';

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const INITIAL_HOURS = DAYS.map((day, i) => ({
  day, isOpen: i < 6, open: '09:00', close: '20:00',
}));

const TABS = ['Profil', 'Genel', 'Çalışma Saatleri', 'Bildirimler', 'Güvenlik'];

const NOTIF_PREFS_KEY = 'business_notification_prefs';

const DEFAULT_NOTIF_SETTINGS = [
  { key: 'newAppt', label: 'Yeni Randevu', value: true },
  { key: 'cancelAppt', label: 'İptal Edilen Randevu', value: true },
  { key: 'payment', label: 'Ödeme Bildirimi', value: true },
  { key: 'reminder', label: 'Randevu Hatırlatıcı', value: true },
  { key: 'lowStock', label: 'Düşük Stok', value: false },
  { key: 'marketing', label: 'Pazarlama', value: false },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const toast = useToast();
  const auth = useAppSelector((s) => s.auth);
  const business = useAppSelector((s) => s.business.business);
  const [tab, setTab] = useState('Profil');

  // Profile state
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileInfo, setProfileInfo] = useState({
    fullName: auth.fullName ?? '',
    phone: auth.phone ?? '',
    jobTitle: auth.jobTitle ?? '',
    email: auth.email ?? '',
  });

  // Business state
  const [editMode, setEditMode] = useState(false);
  const [businessInfo, setBusinessInfo] = useState({
    name: business?.name ?? '',
    phone: business?.phone ?? '',
    email: business?.email ?? auth.email ?? '',
    address: business?.address ?? '',
    city: (business as any)?.city ?? '',
    website: business?.website ?? '',
    description: (business as any)?.description ?? '',
  });

  const [hours, setHours] = useState(INITIAL_HOURS);
  const [notifSettings, setNotifSettings] = useState(DEFAULT_NOTIF_SETTINGS);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [localCoverUri, setLocalCoverUri] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(NOTIF_PREFS_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved: Record<string, boolean> = JSON.parse(raw);
        setNotifSettings(prev => prev.map(s => (s.key in saved ? { ...s, value: saved[s.key] } : s)));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.get<{ fullName: string; phone: string | null; jobTitle: string | null; email: string; avatarUrl: string | null }>('/users/me')
      .then(r => setProfileInfo({
        fullName: r.data.fullName ?? '',
        phone: r.data.phone ?? '',
        jobTitle: r.data.jobTitle ?? '',
        email: r.data.email ?? '',
      }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'Genel') {
      api.get<any>('/business/me')
        .then(r => {
          setBusinessInfo({
            name: r.data.name ?? '',
            phone: r.data.phone ?? '',
            email: r.data.email ?? '',
            address: r.data.address ?? '',
            city: r.data.city ?? '',
            website: r.data.website ?? '',
            description: r.data.description ?? '',
          });
          dispatch(setBusiness(r.data));
        })
        .catch(() => {});
    }
  }, [tab, dispatch]);

  const [securityItem, setSecurityItem] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [twoFA, setTwoFA] = useState({ enabled: false, phone: '' });
  const [savingPass, setSavingPass] = useState(false);

  function toggleDay(idx: number) {
    setHours(prev => prev.map((h, i) => i === idx ? { ...h, isOpen: !h.isOpen } : h));
  }

  function toggleNotif(key: string) {
    setNotifSettings(prev => {
      const next = prev.map(s => s.key === key ? { ...s, value: !s.value } : s);
      const toPersist = Object.fromEntries(next.map(s => [s.key, s.value]));
      SecureStore.setItemAsync(NOTIF_PREFS_KEY, JSON.stringify(toPersist))
        .then(() => toast.success('Bildirim tercihi kaydedildi.'))
        .catch(() => toast.error('Bildirim tercihi kaydedilemedi.'));
      return next;
    });
  }

  function formatPhoneDisplay(raw: string) {
    const digits = raw.replace(/\D/g, '');
    const local = digits.startsWith('90') ? digits.slice(2) : digits.startsWith('0') ? digits.slice(1) : digits;
    const d = local.slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
  }

  function handleProfilePhoneChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    setProfileInfo(prev => ({ ...prev, phone: digits ? `+90${digits}` : '' }));
  }

  function handleBusinessPhoneChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    setBusinessInfo(prev => ({ ...prev, phone: digits ? `+90${digits}` : '' }));
  }

  function handleTwoFAPhoneChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    setTwoFA(prev => ({ ...prev, phone: digits ? `+90${digits}` : '' }));
  }

  async function uploadAvatar(uri: string) {
    setLocalAvatarUri(uri);
    setAvatarUploading(true);
    try {
      const filename = uri.split('/').pop() || `avatar_${Date.now()}.jpg`;
      const extMatch = /\.(\w+)$/.exec(filename);
      const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
      const formData = new FormData();
      formData.append('file', { uri, name: filename, type: mimeType } as any);
      const res = await api.put<{ url: string }>('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      dispatch(updateProfile({ avatarUrl: res.data.url }));
      setLocalAvatarUri(null);
      toast.success('Profil fotoğrafı güncellendi.');
    } catch {
      setLocalAvatarUri(null);
      toast.error('Profil fotoğrafı güncellenemedi.');
    } finally {
      setAvatarUploading(false);
    }
  }

  async function pickAvatarFrom(source: 'camera' | 'library') {
    try {
      let result: ImagePicker.ImagePickerResult;
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          toast.warning('Fotoğraf çekmek için kamera erişimine izin vermelisiniz.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          toast.warning('Fotoğraf seçmek için galeri erişimine izin vermelisiniz.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
      }
      if (result.canceled || !result.assets?.[0]?.uri) return;
      await uploadAvatar(result.assets[0].uri);
    } catch {
      toast.error('Fotoğraf seçilirken bir hata oluştu.');
    }
  }

  function handleAvatarPress() {
    if (avatarUploading) return;
    Alert.alert('Profil Fotoğrafı', 'Fotoğrafı nereden seçmek istersiniz?', [
      { text: 'Kameradan Çek', onPress: () => pickAvatarFrom('camera') },
      { text: 'Galeriden Seç', onPress: () => pickAvatarFrom('library') },
      { text: 'Vazgeç', style: 'cancel' },
    ]);
  }

  async function uploadCoverImage(uri: string) {
    setLocalCoverUri(uri);
    setCoverUploading(true);
    try {
      const filename = uri.split('/').pop() || `cover_${Date.now()}.jpg`;
      const extMatch = /\.(\w+)$/.exec(filename);
      const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      const formData = new FormData();
      formData.append('file', { uri, name: filename, type: mimeType } as any);
      const res = await api.post<{ url: string }>('/uploads/image?folder=business', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.url;
      await api.put('/business/me', { coverImageUrl: url });
      setLocalCoverUri(null);
      toast.success('Kapak fotoğrafı güncellendi.');
    } catch {
      setLocalCoverUri(null);
      toast.error('Kapak fotoğrafı güncellenemedi.');
    } finally {
      setCoverUploading(false);
    }
  }

  async function pickCoverFrom(source: 'camera' | 'library') {
    try {
      let result: ImagePicker.ImagePickerResult;
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          toast.warning('Fotoğraf çekmek için kamera erişimine izin vermelisiniz.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.7 });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          toast.warning('Fotoğraf seçmek için galeri erişimine izin vermelisiniz.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.7 });
      }
      if (result.canceled || !result.assets?.[0]?.uri) return;
      await uploadCoverImage(result.assets[0].uri);
    } catch {
      toast.error('Fotoğraf seçilirken bir hata oluştu.');
    }
  }

  function handleCoverPress() {
    if (coverUploading) return;
    Alert.alert('Kapak Fotoğrafı', 'Fotoğrafı nereden seçmek istersiniz?', [
      { text: 'Kameradan Çek', onPress: () => pickCoverFrom('camera') },
      { text: 'Galeriden Seç', onPress: () => pickCoverFrom('library') },
      { text: 'Vazgeç', style: 'cancel' },
    ]);
  }

  const profileFields = [
    { label: 'Ad Soyad', done: !!profileInfo.fullName.trim() },
    { label: 'Telefon', done: !!profileInfo.phone.trim() },
    { label: 'E-posta', done: !!profileInfo.email.trim() },
    { label: 'Unvan / Rol', done: !!profileInfo.jobTitle.trim() },
    { label: 'Profil fotoğrafı', done: !!(auth.avatarUrl || localAvatarUri) },
  ];
  const profileDone = profileFields.filter(f => f.done).length;
  const profileTotal = profileFields.length;
  const profilePct = Math.round((profileDone / profileTotal) * 100);
  const profileComplete = profileDone === profileTotal;

  const businessFields = [
    { label: 'İşletme Adı', done: !!businessInfo.name.trim() },
    { label: 'Telefon', done: !!businessInfo.phone.trim() },
    { label: 'E-posta', done: !!businessInfo.email.trim() },
    { label: 'Şehir', done: !!businessInfo.city.trim() },
    { label: 'Adres', done: !!businessInfo.address.trim() },
    { label: 'Web Sitesi', done: !!businessInfo.website.trim() },
    { label: 'Açıklama', done: !!businessInfo.description.trim() },
  ];
  const bizDone = businessFields.filter(f => f.done).length;
  const bizTotal = businessFields.length;
  const bizPct = Math.round((bizDone / bizTotal) * 100);
  const bizComplete = bizDone === bizTotal;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <PatternOverlay opacity={0.25} />
      <ScreenHeader title="Ayarlar" showBack />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: SPACE[5], paddingVertical: SPACE[3], gap: SPACE[2], alignItems: 'center' }}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} style={[styles.chip, tab === t && styles.chipActive]} onPress={() => setTab(t)} activeOpacity={0.8}>
            <Text style={[styles.chipText, tab === t && styles.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* ─── PROFİL ─────────────────────────────────────────────────── */}
        {tab === 'Profil' && (
          <>
            <View style={[styles.completionCard, profileComplete && styles.completionCardDone]}>
              <View style={styles.completionRow}>
                <View style={styles.completionInfo}>
                  <Text style={styles.completionTitle}>
                    {profileComplete ? 'Profil tamamlandı' : 'Profil tamamlanma durumu'}
                  </Text>
                  <Text style={styles.completionSub}>
                    {profileComplete ? 'Tüm bilgiler eksiksiz.' : `${profileTotal - profileDone} eksik alan kaldı`}
                  </Text>
                </View>
                <Text style={[styles.completionPct, profileComplete && styles.completionPctDone]}>%{profilePct}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${profilePct}%` }, profileComplete && styles.progressFillDone]} />
              </View>
              <View style={styles.checklist}>
                {profileFields.map(f => (
                  <View key={f.label} style={styles.checkItem}>
                    <Ionicons name={f.done ? 'checkmark-circle' : 'ellipse-outline'} size={15} color={f.done ? COLORS.success : COLORS.textMuted} />
                    <Text style={[styles.checkText, f.done && styles.checkTextDone]}>{f.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.profileCard}>
              <TouchableOpacity style={styles.avatarWrap} onPress={handleAvatarPress} activeOpacity={0.8} disabled={avatarUploading}>
                <Avatar name={profileInfo.fullName} size={64} url={localAvatarUri ?? auth.avatarUrl ?? ''} />
                <View style={styles.avatarEditBadge}>
                  {avatarUploading ? <ActivityIndicator size="small" color={STATIC_WHITE} /> : <Ionicons name="camera" size={12} color={STATIC_WHITE} />}
                </View>
              </TouchableOpacity>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{profileInfo.fullName || 'Kullanıcı'}</Text>
                <Text style={styles.profileEmail}>{profileInfo.email}</Text>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={() => setProfileEditMode(!profileEditMode)} activeOpacity={0.8}>
                <Ionicons name={profileEditMode ? 'close' : 'pencil'} size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {profileEditMode ? (
              <>
                {[
                  { key: 'fullName', label: 'Ad Soyad', placeholder: 'Adınız Soyadınız' },
                  { key: 'phone', label: 'Telefon', placeholder: '05XX XXX XX XX', keyboardType: 'phone-pad' as const },
                  { key: 'jobTitle', label: 'Unvan / Rol', placeholder: 'Örn: İşletme Sahibi' },
                ].map((field) => (
                  <View key={field.key} style={styles.editField}>
                    <Text style={styles.editLabel}>{field.label}</Text>
                    <TextInput
                      style={styles.editInput}
                      value={field.key === 'phone' ? formatPhoneDisplay(profileInfo.phone) : (profileInfo as any)[field.key]}
                      onChangeText={(v) => field.key === 'phone' ? handleProfilePhoneChange(v) : setProfileInfo(p => ({ ...p, [field.key]: v }))}
                      placeholder={field.placeholder}
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType={(field as any).keyboardType ?? 'default'}
                    />
                  </View>
                ))}
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>E-posta</Text>
                  <View style={[styles.editInput, { backgroundColor: COLORS.borderLight, justifyContent: 'center' }]}>
                    <Text style={{ color: COLORS.textMuted, fontSize: FONT.base }}>{profileInfo.email}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={async () => {
                  try {
                    const parts = profileInfo.fullName.trim().split(' ');
                    await api.put('/users/me', {
                      firstName: parts[0] ?? '',
                      lastName: (parts.slice(1).join(' ') || parts[0]) ?? '',
                      phone: profileInfo.phone || null,
                      jobTitle: profileInfo.jobTitle || null,
                    });
                    dispatch(updateProfile({ fullName: profileInfo.fullName, phone: profileInfo.phone, jobTitle: profileInfo.jobTitle }));
                    setProfileEditMode(false);
                    toast.success('Profil kaydedildi.');
                  } catch (err: any) {
                    const msg = err?.response?.data?.detail ?? err?.response?.data?.title ?? 'Profil kaydedilemedi.';
                    toast.error(msg);
                  }
                }}>
                  <Text style={styles.saveBtnText}>Profili Kaydet</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {[
                  { label: 'Ad Soyad', value: profileInfo.fullName },
                  { label: 'Telefon', value: profileInfo.phone },
                  { label: 'E-posta', value: profileInfo.email },
                  { label: 'Unvan / Rol', value: profileInfo.jobTitle },
                ].map((field) => (
                  <View key={field.label} style={styles.fieldCard}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <Text style={[styles.fieldValue, !field.value && { color: COLORS.textMuted }]}>{field.value || '—'}</Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {/* ─── GENEL (İşletme Bilgileri) ──────────────────────────────── */}
        {tab === 'Genel' && (
          <>
            <View style={[styles.completionCard, bizComplete && styles.completionCardDone]}>
              <View style={styles.completionRow}>
                <View style={styles.completionInfo}>
                  <Text style={styles.completionTitle}>
                    {bizComplete ? 'İşletme profili tamamlandı' : 'İşletme profili tamamlanma durumu'}
                  </Text>
                  <Text style={styles.completionSub}>
                    {bizComplete ? 'Tüm bilgiler eksiksiz.' : `${bizTotal - bizDone} eksik alan kaldı`}
                  </Text>
                </View>
                <Text style={[styles.completionPct, bizComplete && styles.completionPctDone]}>%{bizPct}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${bizPct}%` }, bizComplete && styles.progressFillDone]} />
              </View>
              <View style={styles.checklist}>
                {businessFields.map(f => (
                  <View key={f.label} style={styles.checkItem}>
                    <Ionicons name={f.done ? 'checkmark-circle' : 'ellipse-outline'} size={15} color={f.done ? COLORS.success : COLORS.textMuted} />
                    <Text style={[styles.checkText, f.done && styles.checkTextDone]}>{f.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.profileCard}>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{businessInfo.name || 'İşletme'}</Text>
                <Text style={styles.profileEmail}>{businessInfo.email}</Text>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={() => setEditMode(!editMode)} activeOpacity={0.8}>
                <Ionicons name={editMode ? 'close' : 'pencil'} size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {editMode ? (
              <>
                {[
                  { key: 'name', label: 'İşletme Adı', placeholder: 'İşletme adı' },
                  { key: 'phone', label: 'Telefon', placeholder: '05XX XXX XX XX', keyboardType: 'phone-pad' as const },
                  { key: 'email', label: 'E-posta', placeholder: 'ornek@mail.com', keyboardType: 'email-address' as const },
                  { key: 'city', label: 'Şehir', placeholder: 'İstanbul' },
                  { key: 'address', label: 'Adres', placeholder: 'Adres' },
                  { key: 'website', label: 'Web Sitesi', placeholder: 'ornek.com' },
                  { key: 'description', label: 'Açıklama', placeholder: 'İşletmeniz hakkında kısa açıklama' },
                ].map((field) => (
                  <View key={field.key} style={styles.editField}>
                    <Text style={styles.editLabel}>{field.label}</Text>
                    <TextInput
                      style={styles.editInput}
                      value={field.key === 'phone' ? formatPhoneDisplay(businessInfo.phone) : (businessInfo as any)[field.key]}
                      onChangeText={(v) => field.key === 'phone' ? handleBusinessPhoneChange(v) : setBusinessInfo(p => ({ ...p, [field.key]: v }))}
                      placeholder={field.placeholder}
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType={(field as any).keyboardType ?? 'default'}
                      multiline={field.key === 'description'}
                      numberOfLines={field.key === 'description' ? 3 : 1}
                    />
                  </View>
                ))}
                <View style={styles.coverSection}>
                  <TouchableOpacity style={styles.coverPicker} onPress={handleCoverPress} activeOpacity={0.8} disabled={coverUploading}>
                    {localCoverUri || (business as any)?.coverImageUrl ? (
                      <Image source={{ uri: fixImageUrl(localCoverUri ?? (business as any)?.coverImageUrl) }} style={styles.coverPreview} resizeMode="cover" />
                    ) : (
                      <View style={styles.coverPlaceholder}>
                        <Ionicons name="image-outline" size={32} color={COLORS.textMuted} />
                        <Text style={styles.coverPlaceholderText}>Kapak Fotoğrafı Ekle</Text>
                      </View>
                    )}
                    <View style={styles.coverBadge}>
                      {coverUploading ? <ActivityIndicator size="small" color={STATIC_WHITE} /> : <Ionicons name="camera" size={16} color={STATIC_WHITE} />}
                    </View>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={async () => {
                  try {
                    await api.put('/business/me', {
                      name: businessInfo.name,
                      phone: businessInfo.phone,
                      email: businessInfo.email,
                      address: businessInfo.address,
                      city: businessInfo.city,
                      website: businessInfo.website,
                      description: businessInfo.description,
                    });
                    setEditMode(false);
                    toast.success('İşletme bilgileri kaydedildi.');
                  } catch (err: any) {
                    const msg = err?.response?.data?.detail ?? err?.response?.data?.title ?? 'İşletme bilgileri kaydedilemedi.';
                    toast.error(msg);
                  }
                }}>
                  <Text style={styles.saveBtnText}>Kaydet</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.coverSection}>
                  <TouchableOpacity style={styles.coverPicker} onPress={handleCoverPress} activeOpacity={0.8} disabled={coverUploading}>
                    {(business as any)?.coverImageUrl ? (
                      <Image source={{ uri: fixImageUrl((business as any)?.coverImageUrl) }} style={styles.coverPreview} resizeMode="cover" />
                    ) : (
                      <View style={styles.coverPlaceholder}>
                        <Ionicons name="image-outline" size={32} color={COLORS.textMuted} />
                        <Text style={styles.coverPlaceholderText}>Kapak Fotoğrafı Ekle</Text>
                      </View>
                    )}
                    <View style={styles.coverBadge}>
                      {coverUploading ? <ActivityIndicator size="small" color={STATIC_WHITE} /> : <Ionicons name="camera" size={16} color={STATIC_WHITE} />}
                    </View>
                  </TouchableOpacity>
                </View>

                {[
                  { label: 'İşletme Adı', value: businessInfo.name },
                  { label: 'Telefon', value: businessInfo.phone },
                  { label: 'E-posta', value: businessInfo.email },
                  { label: 'Şehir', value: businessInfo.city },
                  { label: 'Adres', value: businessInfo.address },
                  { label: 'Web Sitesi', value: businessInfo.website },
                  { label: 'Açıklama', value: businessInfo.description },
                ].map((field) => (
                  <View key={field.label} style={styles.fieldCard}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <Text style={[styles.fieldValue, !field.value && { color: COLORS.textMuted }]}>{field.value || '—'}</Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {/* ─── ÇALIŞMA SAATLERİ ───────────────────────────────────────── */}
        {tab === 'Çalışma Saatleri' && (
          <View style={styles.hoursCard}>
            {hours.map((h, idx) => (
              <View key={h.day} style={[styles.hourRow, idx < hours.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight }]}>
                <Text style={[styles.dayLabel, !h.isOpen && { color: COLORS.textMuted }]}>{h.day}</Text>
                <Switch value={h.isOpen} onValueChange={() => toggleDay(idx)} trackColor={{ false: COLORS.border, true: COLORS.primary }} thumbColor={STATIC_WHITE} />
                {h.isOpen ? (
                  <Text style={styles.hourRange}>{h.open} – {h.close}</Text>
                ) : (
                  <Text style={[styles.hourRange, { color: COLORS.textMuted }]}>Kapalı</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ─── BİLDİRİMLER ────────────────────────────────────────────── */}
        {tab === 'Bildirimler' && (
          <View style={styles.notifCard}>
            {notifSettings.map((s, idx) => (
              <View key={s.key} style={[styles.settingRow, idx < notifSettings.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight }]}>
                <Text style={styles.settingLabel}>{s.label}</Text>
                <Switch value={s.value} onValueChange={() => toggleNotif(s.key)} trackColor={{ false: COLORS.border, true: COLORS.primary }} thumbColor={STATIC_WHITE} />
              </View>
            ))}
          </View>
        )}

        {/* ─── GÜVENLİK ───────────────────────────────────────────────── */}
        {tab === 'Güvenlik' && (
          <>
            <TouchableOpacity style={[styles.securityRow, securityItem === 'password' && styles.securityRowOpen]} onPress={() => setSecurityItem(securityItem === 'password' ? null : 'password')} activeOpacity={0.8}>
              <Ionicons name="key-outline" size={20} color={COLORS.text} />
              <Text style={styles.securityLabel}>Şifre Değiştir</Text>
              <Ionicons name={securityItem === 'password' ? 'chevron-up' : 'chevron-forward'} size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
            {securityItem === 'password' && (
              <View style={styles.securityForm}>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Mevcut Şifre</Text>
                  <TextInput style={styles.editInput} value={passwordForm.current} onChangeText={v => setPasswordForm(p => ({...p, current: v}))} placeholder="••••••••" secureTextEntry placeholderTextColor={COLORS.textMuted} />
                </View>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Yeni Şifre</Text>
                  <TextInput style={styles.editInput} value={passwordForm.newPass} onChangeText={v => setPasswordForm(p => ({...p, newPass: v}))} placeholder="••••••••" secureTextEntry placeholderTextColor={COLORS.textMuted} />
                </View>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Yeni Şifre (Tekrar)</Text>
                  <TextInput style={styles.editInput} value={passwordForm.confirm} onChangeText={v => setPasswordForm(p => ({...p, confirm: v}))} placeholder="••••••••" secureTextEntry placeholderTextColor={COLORS.textMuted} />
                </View>
                <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={async () => {
                  if (!passwordForm.current || !passwordForm.newPass) { toast.warning('Tüm alanları doldurun.'); return; }
                  if (passwordForm.newPass !== passwordForm.confirm) { toast.warning('Yeni şifreler eşleşmiyor.'); return; }
                  setSavingPass(true);
                  try {
                    await api.put('/users/me/password', { currentPassword: passwordForm.current, newPassword: passwordForm.newPass });
                    setSecurityItem(null);
                    setPasswordForm({current:'',newPass:'',confirm:''});
                    toast.success('Şifre değiştirildi.');
                  } catch {
                    toast.error('Şifre değiştirilemedi.');
                  } finally {
                    setSavingPass(false);
                  }
                }}>
                  {savingPass ? <ActivityIndicator size="small" color={STATIC_WHITE} /> : <Text style={styles.saveBtnText}>Şifreyi Değiştir</Text>}
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={[styles.securityRow, securityItem === '2fa' && styles.securityRowOpen]} onPress={() => setSecurityItem(securityItem === '2fa' ? null : '2fa')} activeOpacity={0.8}>
              <Ionicons name="phone-portrait-outline" size={20} color={COLORS.text} />
              <Text style={styles.securityLabel}>2 Faktörlü Doğrulama</Text>
              <Ionicons name={securityItem === '2fa' ? 'chevron-up' : 'chevron-forward'} size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
            {securityItem === '2fa' && (
              <View style={styles.securityForm}>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>2FA'yı Etkinleştir</Text>
                  <Switch value={twoFA.enabled} onValueChange={v => setTwoFA(p => ({...p, enabled: v}))} trackColor={{false: COLORS.border, true: COLORS.primary}} thumbColor={STATIC_WHITE} />
                </View>
                {twoFA.enabled && (
                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Doğrulama Telefonu</Text>
                    <TextInput style={styles.editInput} value={formatPhoneDisplay(twoFA.phone)} onChangeText={handleTwoFAPhoneChange} placeholder="05XX XXX XX XX" keyboardType="phone-pad" placeholderTextColor={COLORS.textMuted} />
                  </View>
                )}
                <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={async () => {
                  try {
                    await api.patch('/business/me/settings', { twoFactorEnabled: String(twoFA.enabled), twoFactorPhone: twoFA.phone });
                    setSecurityItem(null);
                    toast.success('2FA ayarları kaydedildi.');
                  } catch (err: any) {
                    const msg = err?.response?.data?.detail ?? err?.response?.data?.title ?? '2FA ayarları kaydedilemedi.';
                    toast.error(msg);
                  }
                }}>
                  <Text style={styles.saveBtnText}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={[styles.securityRow, { borderColor: COLORS.error + '30' }]} onPress={() => Alert.alert('Onay', 'Tüm cihazlardan çıkış yapılacak. Devam etmek istediğinize emin misiniz?', [{text:'İptal',style:'cancel'},{text:'Çıkış Yap',style:'destructive',onPress:async () => { await SecureStore.deleteItemAsync('access_token'); await SecureStore.deleteItemAsync('auth_data'); dispatch(logout()); dispatch(clearBusiness()); router.replace('/'); }}])} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
              <Text style={[styles.securityLabel, { color: COLORS.error }]}>Tüm Cihazlardan Çıkış</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  chip: { paddingHorizontal: 16, paddingVertical: 10, minHeight: 40, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: 'transparent', justifyContent: 'center', flexShrink: 0 },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  chipTextActive: { color: STATIC_WHITE },
  completionCard: { marginHorizontal: SPACE[5], marginBottom: SPACE[5], borderRadius: RADIUS['2xl'], borderWidth: 1, borderColor: COLORS.primary + '25', backgroundColor: COLORS.primary + '0A', padding: SPACE[5], ...SHADOW.md },
  completionCardDone: { borderColor: COLORS.success + '35', backgroundColor: COLORS.success + '0A' },
  completionRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: SPACE[3], marginBottom: SPACE[3] },
  completionInfo: { flex: 1, gap: 4 },
  completionTitle: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.text, letterSpacing: -0.2 },
  completionSub: { fontSize: FONT.xs, color: COLORS.textMuted, lineHeight: 16 },
  completionPct: { fontSize: FONT['2xl'], fontWeight: FONT.extrabold, color: COLORS.primary },
  completionPctDone: { color: COLORS.success },
  progressTrack: { height: 7, borderRadius: RADIUS.full, backgroundColor: COLORS.border, overflow: 'hidden', marginBottom: SPACE[4] },
  progressFill: { height: '100%', borderRadius: RADIUS.full, backgroundColor: COLORS.primary },
  progressFillDone: { backgroundColor: COLORS.success },
  checklist: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[3] },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '47%' },
  checkText: { fontSize: FONT.xs, color: COLORS.textMuted, flexShrink: 1 },
  checkTextDone: { color: COLORS.text, fontWeight: FONT.medium },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: SPACE[4], backgroundColor: COLORS.surface, marginHorizontal: SPACE[5], marginBottom: SPACE[4], borderRadius: RADIUS.xl, padding: SPACE[5], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  avatarWrap: { position: 'relative' },
  avatarEditBadge: {
    position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.surface,
  },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: FONT.lg, fontWeight: FONT.bold, color: COLORS.text },
  profileEmail: { fontSize: FONT.xs, color: COLORS.textMuted },
  editBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  fieldCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, marginHorizontal: SPACE[5], marginBottom: SPACE[2], borderRadius: RADIUS.xl, padding: SPACE[4], borderWidth: 1, borderColor: COLORS.borderLight },
  fieldLabel: { fontSize: FONT.xs, color: COLORS.textMuted, width: 100, fontWeight: FONT.medium },
  fieldValue: { fontSize: FONT.sm, color: COLORS.text, flex: 1 },
  editField: { marginHorizontal: SPACE[5], marginBottom: SPACE[3], gap: SPACE[1] },
  editLabel: { fontSize: FONT.xs, fontWeight: FONT.semibold, color: COLORS.textMuted, marginLeft: SPACE[1] },
  editInput: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, paddingHorizontal: SPACE[4], paddingVertical: SPACE[3], fontSize: FONT.base, color: COLORS.text, borderWidth: 1.5, borderColor: COLORS.border },
  saveBtn: { marginHorizontal: SPACE[5], marginTop: SPACE[2], backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: SPACE[4], alignItems: 'center', ...SHADOW.primary },
  saveBtnText: { fontSize: FONT.md, fontWeight: FONT.bold, color: STATIC_WHITE },
  hoursCard: { marginHorizontal: SPACE[5], backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.borderLight, overflow: 'hidden', ...SHADOW.sm },
  hourRow: { flexDirection: 'row', alignItems: 'center', padding: SPACE[4], gap: SPACE[4] },
  dayLabel: { width: 36, fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  hourRange: { fontSize: FONT.sm, color: COLORS.text, flex: 1, textAlign: 'right' },
  notifCard: { marginHorizontal: SPACE[5], backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.borderLight, overflow: 'hidden', ...SHADOW.sm },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACE[4] },
  settingLabel: { fontSize: FONT.base, color: COLORS.text },
  coverSection: { marginHorizontal: SPACE[5], marginBottom: SPACE[4] },
  coverPicker: { width: '100%', height: 160, borderRadius: RADIUS.xl, overflow: 'hidden', backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.borderLight, borderStyle: 'dashed' },
  coverPreview: { width: '100%', height: '100%' },
  coverPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACE[2] },
  coverPlaceholderText: { fontSize: FONT.sm, color: COLORS.textMuted },
  coverBadge: { position: 'absolute', right: SPACE[3], bottom: SPACE[3], width: 32, height: 32, borderRadius: RADIUS.full, backgroundColor: COLORS.primary + 'CC', alignItems: 'center', justifyContent: 'center' },
  securityRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[4], backgroundColor: COLORS.surface, marginHorizontal: SPACE[5], marginBottom: SPACE[2], borderRadius: RADIUS.xl, padding: SPACE[4], borderWidth: 1, borderColor: COLORS.borderLight },
  securityRowOpen: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 0 },
  securityForm: { backgroundColor: COLORS.surface, marginHorizontal: SPACE[5], padding: SPACE[4], paddingTop: 0, borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl, borderWidth: 1, borderTopWidth: 0, borderColor: COLORS.borderLight, marginBottom: SPACE[2] },
  securityLabel: { flex: 1, fontSize: FONT.base, color: COLORS.text },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACE[3] },
  switchLabel: { fontSize: FONT.base, color: COLORS.text },
});
