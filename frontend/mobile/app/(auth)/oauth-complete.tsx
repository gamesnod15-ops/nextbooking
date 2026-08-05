import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { PatternOverlay } from '@/components/ui/PatternOverlay';
import { useToast } from '@/components/ui/Toast';
import { useAppDispatch } from '@/store';
import { setCredentials } from '@/store/slices/authSlice';
import api from '@/lib/api';
import * as SecureStore from 'expo-secure-store';

// Mirrors the backend's BusinessCategory enum — same list used on the web
// app's and business-panel's own register pages.
const BUSINESS_CATEGORIES = [
  { value: 1,  label: 'Güzellik Salonu' },
  { value: 2,  label: 'Kuaför / Berber' },
  { value: 3,  label: 'Klinik' },
  { value: 4,  label: 'Diş Kliniği' },
  { value: 5,  label: 'Fizyoterapi' },
  { value: 6,  label: 'Spor Salonu' },
  { value: 7,  label: 'Kişisel Antrenör' },
  { value: 8,  label: 'Yoga & Pilates' },
  { value: 9,  label: 'Spa & Masaj' },
  { value: 10, label: 'Tırnak Salonu' },
  { value: 11, label: 'Dövme Stüdyosu' },
  { value: 12, label: 'Veteriner' },
  { value: 13, label: 'Oto Servis' },
  { value: 14, label: 'Oto Yıkama' },
  { value: 15, label: 'Teknik Servis' },
  { value: 16, label: 'Danışmanlık' },
  { value: 17, label: 'Psikolog' },
  { value: 18, label: 'Beslenme Uzmanı' },
  { value: 19, label: 'Özel Ders' },
  { value: 20, label: 'Fotoğrafçı' },
  { value: 99, label: 'Diğer' },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function OAuthCompleteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const toast = useToast();
  const params = useLocalSearchParams<{
    provider: string;
    providerUserId: string;
    email: string;
    fullName: string;
    avatarUrl: string;
    role: 'business' | 'customer';
  }>();

  const isBusiness = params.role === 'business';
  const [firstName, lastName0] = (params.fullName || '').trim().split(/\s+/, 2);

  const [form, setForm] = useState({
    firstName: firstName || '',
    lastName: lastName0 || '',
    phone: '',
    username: params.email ? params.email.split('@')[0] : '',
    businessName: '',
    subdomain: '',
    businessCategory: '',
    agreedToTerms: false,
  });
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  function set(field: keyof typeof form) {
    return (value: string | boolean) => {
      setForm((prev) => {
        const next = { ...prev, [field]: value };
        if (field === 'businessName' && typeof value === 'string') {
          next.subdomain = slugify(value);
        }
        return next;
      });
    };
  }

  function formatPhoneDisplay(raw: string) {
    const digits = raw.replace(/\D/g, '');
    const d = digits.slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
  }

  function handlePhoneChange(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 10);
    setForm((prev) => ({ ...prev, phone: digits }));
  }

  const canSubmit =
    form.firstName.trim() && form.lastName.trim() && form.phone.replace(/\D/g, '').length >= 10 &&
    form.username.trim() && form.agreedToTerms &&
    (!isBusiness || (form.businessName.trim() && form.subdomain.trim() && form.businessCategory));

  async function handleSubmit() {
    if (!canSubmit) {
      toast.warning('Lütfen tüm alanları doldurun.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/oauth/complete-registration', {
        provider: params.provider,
        providerUserId: params.providerUserId,
        email: params.email,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: `+90${form.phone.replace(/\D/g, '')}`,
        username: form.username.trim(),
        businessName: isBusiness ? form.businessName.trim() : undefined,
        subdomain: isBusiness ? form.subdomain : undefined,
        businessCategory: isBusiness ? parseInt(form.businessCategory, 10) : undefined,
        agreedToTerms: form.agreedToTerms,
        avatarUrl: params.avatarUrl || null,
      });
      const data = res.data;

      const authData = {
        accessToken: data.accessToken,
        userId: data.userId,
        role: data.role,
        tenantId: data.tenantId ?? null,
        fullName: data.fullName ?? '',
        email: params.email,
        phone: null,
        jobTitle: null,
        avatarUrl: params.avatarUrl || null,
        appRole: params.role,
      };
      await SecureStore.setItemAsync('access_token', authData.accessToken);
      await SecureStore.setItemAsync('auth_data', JSON.stringify(authData));
      dispatch(setCredentials(authData));

      toast.success('Hesabınız oluşturuldu.');
      router.replace(params.role === 'business' ? '/(business)' : ('/(customer)' as any));
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.detail || err.message || 'Kayıt tamamlanamadı.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <PatternOverlay opacity={0.15} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + SPACE[4], paddingBottom: insets.bottom + SPACE[6] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(auth)/login')} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
          <Text style={styles.backLabel}>Geri</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          {!!params.avatarUrl && (
            <Image source={{ uri: params.avatarUrl }} style={styles.avatar} />
          )}
          <Text style={styles.title}>Son bir adım</Text>
          <Text style={styles.subtitle}>
            {params.email} ile devam ediyorsunuz. Hesabınızı tamamlamak için birkaç bilgi daha gerekiyor.
          </Text>

          <View style={styles.form}>
            <View style={styles.row2}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Ad</Text>
                <TextInput style={styles.input} value={form.firstName} onChangeText={(v) => set('firstName')(v)} placeholder="Adınız" placeholderTextColor={COLORS.textMuted} />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Soyad</Text>
                <TextInput style={styles.input} value={form.lastName} onChangeText={(v) => set('lastName')(v)} placeholder="Soyadınız" placeholderTextColor={COLORS.textMuted} />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Telefon</Text>
              <View style={styles.phoneWrap}>
                <Text style={styles.phonePrefix}>🇹🇷 +90</Text>
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0 }]}
                  value={formatPhoneDisplay(form.phone)}
                  onChangeText={handlePhoneChange}
                  placeholder="555 000 00 00"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Kullanıcı Adı</Text>
              <TextInput style={styles.input} value={form.username} onChangeText={(v) => set('username')(v)} placeholder="kullaniciadiniz" placeholderTextColor={COLORS.textMuted} autoCapitalize="none" />
            </View>

            {isBusiness && (
              <>
                <View style={styles.sectionDivider} />
                <Text style={styles.sectionLabel}>İşletme Bilgileri</Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>İşletme Adı</Text>
                  <TextInput style={styles.input} value={form.businessName} onChangeText={(v) => set('businessName')(v)} placeholder="Yılmaz Kuaför" placeholderTextColor={COLORS.textMuted} />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Firma Kullanıcı Adı</Text>
                  <View style={styles.subdomainWrap}>
                    <Text style={styles.subdomainPrefix}>jetrandevu.com/</Text>
                    <TextInput style={[styles.input, { flex: 1, borderWidth: 0 }]} value={form.subdomain} onChangeText={(v) => set('subdomain')(v)} placeholder="isletme-adi" placeholderTextColor={COLORS.textMuted} autoCapitalize="none" />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>İşletme Kategorisi</Text>
                  <TouchableOpacity style={styles.input} onPress={() => setCategoryModalOpen(true)} activeOpacity={0.7}>
                    <Text style={{ color: form.businessCategory ? COLORS.text : COLORS.textMuted }}>
                      {BUSINESS_CATEGORIES.find((c) => String(c.value) === form.businessCategory)?.label || 'Kategori seçin'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <TouchableOpacity style={styles.checkRow} onPress={() => set('agreedToTerms')(!form.agreedToTerms)} activeOpacity={0.7}>
              <View style={[styles.checkbox, form.agreedToTerms && styles.checkboxChecked]}>
                {form.agreedToTerms && <Ionicons name="checkmark" size={14} color={STATIC_WHITE} />}
              </View>
              <Text style={styles.checkText}>Kullanım şartlarını kabul ediyorum.</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading || !canSubmit} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color={STATIC_WHITE} /> : <Text style={styles.submitBtnText}>Hesabı Tamamla</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={categoryModalOpen} animationType="slide" transparent onRequestClose={() => setCategoryModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kategori Seçin</Text>
              <TouchableOpacity onPress={() => setCategoryModalOpen(false)}>
                <Ionicons name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 420 }}>
              {BUSINESS_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={styles.categoryItem}
                  onPress={() => { set('businessCategory')(String(cat.value)); setCategoryModalOpen(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categoryItemText, String(cat.value) === form.businessCategory && { color: COLORS.primary, fontWeight: FONT.bold }]}>
                    {cat.label}
                  </Text>
                  {String(cat.value) === form.businessCategory && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: SPACE[5], gap: SPACE[4] },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  backLabel: { fontSize: FONT.sm, color: COLORS.textSecondary, fontWeight: FONT.medium },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS['2xl'], padding: SPACE[6], alignItems: 'center', ...SHADOW.lg },
  avatar: { width: 64, height: 64, borderRadius: 32, marginBottom: SPACE[3], borderWidth: 3, borderColor: COLORS.primaryLight },
  title: { fontSize: FONT.xl, fontWeight: FONT.extrabold, color: COLORS.text, letterSpacing: -0.3 },
  subtitle: { fontSize: FONT.sm, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACE[1], marginBottom: SPACE[5] },
  form: { width: '100%', gap: SPACE[4] },
  row2: { flexDirection: 'row', gap: SPACE[3] },
  fieldGroup: { flex: 1, gap: SPACE[2] },
  label: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[3] + 2,
    fontSize: FONT.base,
    color: COLORS.text,
  },
  phoneWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.border, paddingLeft: SPACE[4],
  },
  phonePrefix: { fontSize: FONT.sm, color: COLORS.textMuted, paddingRight: SPACE[2], borderRightWidth: 1, borderRightColor: COLORS.borderLight },
  subdomainWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.border, paddingLeft: SPACE[3],
  },
  subdomainPrefix: { fontSize: FONT.xs, color: COLORS.textMuted },
  sectionDivider: { height: 1, backgroundColor: COLORS.borderLight, marginVertical: SPACE[1] },
  sectionLabel: { fontSize: FONT.xs, fontWeight: FONT.bold, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2] },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkText: { fontSize: FONT.xs, color: COLORS.textSecondary, flex: 1 },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: SPACE[4], alignItems: 'center', ...SHADOW.primary },
  submitBtnText: { fontSize: FONT.md, fontWeight: FONT.bold, color: STATIC_WHITE },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'], padding: SPACE[5], maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACE[3] },
  modalTitle: { fontSize: FONT.lg, fontWeight: FONT.bold, color: COLORS.text },
  categoryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACE[3], borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  categoryItemText: { fontSize: FONT.base, color: COLORS.text },
});
