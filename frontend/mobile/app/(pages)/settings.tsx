import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Avatar } from '@/components/ui/Avatar';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { clearBusiness } from '@/store/slices/businessSlice';
import * as SecureStore from 'expo-secure-store';

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const INITIAL_HOURS = DAYS.map((day, i) => ({
  day, isOpen: i < 6, open: '09:00', close: '20:00',
}));

const TABS = ['Genel', 'Çalışma Saatleri', 'Bildirimler', 'Güvenlik'];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch();
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
  const [notifSettings, setNotifSettings] = useState([
    { key: 'newAppt', label: 'Yeni Randevu', value: true },
    { key: 'cancelAppt', label: 'İptal Edilen Randevu', value: true },
    { key: 'payment', label: 'Ödeme Bildirimi', value: true },
    { key: 'reminder', label: 'Randevu Hatırlatıcı', value: true },
    { key: 'lowStock', label: 'Düşük Stok', value: false },
    { key: 'marketing', label: 'Pazarlama', value: false },
  ]);

  const [securityItem, setSecurityItem] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [twoFA, setTwoFA] = useState({ enabled: false, phone: '' });
  const [savingPass, setSavingPass] = useState(false);

  function toggleDay(idx: number) {
    setHours(prev => prev.map((h, i) => i === idx ? { ...h, isOpen: !h.isOpen } : h));
  }

  function toggleNotif(key: string) {
    setNotifSettings(prev => prev.map(s => s.key === key ? { ...s, value: !s.value } : s));
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
              <Avatar name={auth.fullName ?? businessInfo.name} size={64} url={auth.avatarUrl ?? ''} />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{businessInfo.name}</Text>
                <Text style={styles.profileEmail}>{businessInfo.email}</Text>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={() => setEditMode(!editMode)}>
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
                      value={(businessInfo as any)[field.key]}
                      onChangeText={(v) => setBusinessInfo(p => ({ ...p, [field.key]: v }))}
                      placeholder={field.placeholder}
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType={(field as any).keyboardType ?? 'default'}
                    />
                  </View>
                ))}
                <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={() => { setEditMode(false); Alert.alert('Başarılı', 'İşletme bilgileri kaydedildi.'); }}>
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
                <Switch value={h.isOpen} onValueChange={() => toggleDay(idx)} trackColor={{ false: COLORS.border, true: COLORS.primary }} thumbColor={COLORS.white} />
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
                <Switch value={s.value} onValueChange={() => toggleNotif(s.key)} trackColor={{ false: COLORS.border, true: COLORS.primary }} thumbColor={COLORS.white} />
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
                  if (!passwordForm.current || !passwordForm.newPass) { Alert.alert('Uyarı', 'Tüm alanları doldurun.'); return; }
                  if (passwordForm.newPass !== passwordForm.confirm) { Alert.alert('Uyarı', 'Yeni şifreler eşleşmiyor.'); return; }
                  setSavingPass(true);
                  setTimeout(() => { setSavingPass(false); setSecurityItem(null); setPasswordForm({current:'',newPass:'',confirm:''}); Alert.alert('Başarılı', 'Şifre değiştirildi.'); }, 1000);
                }}>
                  {savingPass ? <ActivityIndicator size="small" color={COLORS.black} /> : <Text style={styles.saveBtnText}>Şifreyi Değiştir</Text>}
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
                  <Switch value={twoFA.enabled} onValueChange={v => setTwoFA(p => ({...p, enabled: v}))} trackColor={{false: COLORS.border, true: COLORS.primary}} thumbColor={COLORS.white} />
                </View>
                {twoFA.enabled && (
                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Doğrulama Telefonu</Text>
                    <TextInput style={styles.editInput} value={twoFA.phone} onChangeText={v => setTwoFA(p => ({...p, phone: v}))} placeholder="05XX XXX XX XX" keyboardType="phone-pad" placeholderTextColor={COLORS.textMuted} />
                  </View>
                )}
                <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={() => { setSecurityItem(null); Alert.alert('Başarılı', '2FA ayarları kaydedildi.'); }}>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: 'transparent', justifyContent: 'center' },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.black },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: SPACE[4], backgroundColor: COLORS.surface, marginHorizontal: SPACE[5], marginBottom: SPACE[4], borderRadius: RADIUS.xl, padding: SPACE[5], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
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
  saveBtnText: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.black },
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

