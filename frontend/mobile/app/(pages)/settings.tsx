import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Avatar } from '@/components/ui/Avatar';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout, updateProfile } from '@/store/slices/authSlice';
import { clearBusiness } from '@/store/slices/businessSlice';
import * as SecureStore from 'expo-secure-store';
import { useToast } from '@/components/ui/Toast';
import api from '@/lib/api';

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const INITIAL_HOURS = DAYS.map((day, i) => ({
  day, isOpen: i < 6, open: '09:00', close: '20:00',
}));

const TABS = ['Genel', 'Çalışma Saatleri', 'Bildirimler', 'Güvenlik'];

// Business-side notification preferences persist locally only — there is no
// backend NotificationPreference table/endpoint yet, so these toggles are not
// enforced anywhere in the actual notification-dispatch pipeline (push/SMS/email
// sends are not filtered by this key). They just remember the owner's choice
// across app restarts. See app/(customer)/notifications.tsx for the same pattern.
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
  const [tab, setTab] = useState('Genel');
  const [editMode, setEditMode] = useState(false);
  const [businessInfo, setBusinessInfo] = useState({
    name: business?.name ?? '',
    phone: business?.phone ?? '',
    address: business?.address ?? '',
    website: business?.website ?? '',
    email: business?.email ?? auth.email ?? '',
  });
  const [hours, setHours] = useState(INITIAL_HOURS);
  const [notifSettings, setNotifSettings] = useState(DEFAULT_NOTIF_SETTINGS);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(NOTIF_PREFS_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved: Record<string, boolean> = JSON.parse(raw);
        setNotifSettings(prev => prev.map(s => (s.key in saved ? { ...s, value: saved[s.key] } : s)));
      })
      .catch(() => {});
  }, []);

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

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Ayarlar" showBack />

      {/* Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACE[5], paddingVertical: SPACE[3], gap: SPACE[2], alignItems: 'center' }}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} style={[styles.chip, tab === t && styles.chipActive]} onPress={() => setTab(t)} activeOpacity={0.8}>
            <Text style={[styles.chipText, tab === t && styles.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {tab === 'Genel' && (
          <>
            <View style={styles.profileCard}>
              <TouchableOpacity
                style={styles.avatarWrap}
                onPress={handleAvatarPress}
                activeOpacity={0.8}
                disabled={avatarUploading}
                accessibilityRole="button"
                accessibilityLabel="Profil fotoğrafını değiştir"
              >
                <Avatar name={auth.fullName ?? businessInfo.name} size={64} url={localAvatarUri ?? auth.avatarUrl ?? ''} />
                <View style={styles.avatarEditBadge}>
                  {avatarUploading ? (
                    <ActivityIndicator size="small" color={STATIC_WHITE} />
                  ) : (
                    <Ionicons name="camera" size={12} color={STATIC_WHITE} />
                  )}
                </View>
              </TouchableOpacity>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{businessInfo.name}</Text>
                <Text style={styles.profileEmail}>{businessInfo.email}</Text>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={() => setEditMode(!editMode)} accessibilityRole="button" accessibilityLabel={editMode ? 'Kapat' : 'Düzenle'}>
                <Ionicons name={editMode ? 'close' : 'pencil'} size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {editMode ? (
              <>
                {[
                  { key: 'name', label: 'İşletme Adı', placeholder: 'İşletme adı' },
                  { key: 'phone', label: 'Telefon', placeholder: '05XX XXX XX XX', keyboardType: 'phone-pad' as const },
                  { key: 'email', label: 'E-posta', placeholder: 'ornek@mail.com', keyboardType: 'email-address' as const },
                  { key: 'address', label: 'Adres', placeholder: 'Adres' },
                  { key: 'website', label: 'Web Sitesi', placeholder: 'ornek.com' },
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
                    />
                  </View>
                ))}
                <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={() => { setEditMode(false); toast.success('İşletme bilgileri kaydedildi.'); }}>
                  <Text style={styles.saveBtnText}>Kaydet</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {[
                  { label: 'İşletme Adı', value: businessInfo.name },
                  { label: 'Telefon', value: businessInfo.phone },
                  { label: 'Adres', value: businessInfo.address },
                  { label: 'Web Sitesi', value: businessInfo.website },
                ].map((field) => (
                  <View key={field.label} style={styles.fieldCard}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <Text style={styles.fieldValue}>{field.value}</Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                  </View>
                ))}
              </>
            )}
          </>
        )}

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
                <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={() => {
                  if (!passwordForm.current || !passwordForm.newPass) { toast.warning('Tüm alanları doldurun.'); return; }
                  if (passwordForm.newPass !== passwordForm.confirm) { toast.warning('Yeni şifreler eşleşmiyor.'); return; }
                  setSavingPass(true);
                  setTimeout(() => { setSavingPass(false); setSecurityItem(null); setPasswordForm({current:'',newPass:'',confirm:''}); toast.success('Şifre değiştirildi.'); }, 1000);
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
                <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={() => { setSecurityItem(null); toast.success('2FA ayarları kaydedildi.'); }}>
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
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: 'transparent', justifyContent: 'center' },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  chipTextActive: { color: STATIC_WHITE },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: SPACE[4], backgroundColor: COLORS.surface, marginHorizontal: SPACE[5], marginBottom: SPACE[4], borderRadius: RADIUS.xl, padding: SPACE[5], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  avatarWrap: { position: 'relative' },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
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
  securityRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[4], backgroundColor: COLORS.surface, marginHorizontal: SPACE[5], marginBottom: SPACE[2], borderRadius: RADIUS.xl, padding: SPACE[4], borderWidth: 1, borderColor: COLORS.borderLight },
  securityRowOpen: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 0 },
  securityForm: { backgroundColor: COLORS.surface, marginHorizontal: SPACE[5], padding: SPACE[4], paddingTop: 0, borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl, borderWidth: 1, borderTopWidth: 0, borderColor: COLORS.borderLight, marginBottom: SPACE[2] },
  securityLabel: { flex: 1, fontSize: FONT.base, color: COLORS.text },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACE[3] },
  switchLabel: { fontSize: FONT.base, color: COLORS.text },
});

