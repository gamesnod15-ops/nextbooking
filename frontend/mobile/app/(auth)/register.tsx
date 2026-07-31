import React, { useEffect, useMemo, useState } from 'react';
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { useToast } from '@/components/ui/Toast';
import { PatternOverlay } from '@/components/ui/PatternOverlay';
import api from '@/lib/api';

const TERMS_TEXT = `
KULLANICI SÖZLEŞMESİ

1. Taraflar
İşbu sözleşme, BookingAi uygulaması ("Uygulama") ile kullanıcı ("Kullanıcı") arasında akdedilmiştir.

2. Hizmet Tanımı
Uygulama, işletme ve müşteri kullanıcılarına randevu yönetimi, takip ve bildirim hizmetleri sunar.

3. Kullanıcı Yükümlülükleri
Kullanıcı, uygulamayı yasalara uygun şekilde kullanmayı, başka kullanıcıların haklarına saygı göstermeyi ve doğru bilgi sağlamayı kabul eder.

4. Gizlilik
Kullanıcı bilgileri, Aydınlatma Metni'nde belirtilen kapsamda işlenir ve korunur.

5. Sorumluluğun Sınırlandırılması
Uygulama, sunulan hizmetlerin kesintisiz veya hatasız olacağını garanti etmez.

6. Fesih
Kullanıcı, istediği zaman hesabını kapatma hakkına sahiptir.
`;

const PRIVACY_TEXT = `
AYDINLATMA METNİ

Veri Sorumlusu
BookingAi ("Şirket"), 6698 sayılı KVKK kapsamında veri sorumlusudur.

İşlenen Kişisel Veriler
- Kimlik bilgileri (ad, soyad)
- İletişim bilgileri (e-posta, telefon)
- Kullanım verileri (randevu geçmişi, tercihler)

Veri İşleme Amaçları
- Hesap oluşturma ve yönetimi
- Randevu hizmetlerinin sağlanması
- Kullanıcı deneyiminin iyileştirilmesi
- Yasal yükümlülüklerin yerine getirilmesi

Veri Aktarımı
Kişisel veriler, hizmet sağlayıcılarımız aracılığıyla ve kanuni zorunluluk hallerinde üçüncü kişilerle paylaşılabilir.

Haklarınız
KVKK'nın 11. maddesi kapsamında; bilgi talep etme, verilerin düzeltilmesi, silinmesi ve işleme amaçlarına aykırı kullanımın durdurulması haklarına sahipsiniz.
`;

const CATEGORIES: { label: string; value: string }[] = [
  { label: 'Güzellik Salonu', value: 'beautySalon' },
  { label: 'Kuaför & Berber', value: 'barbershop' },
  { label: 'Klinik', value: 'clinic' },
  { label: 'Diş Kliniği', value: 'dentist' },
  { label: 'Fizyoterapi', value: 'physiotherapy' },
  { label: 'Spor Salonu', value: 'gym' },
  { label: 'Kişisel Antrenör', value: 'personalTrainer' },
  { label: 'Yoga & Pilates', value: 'yoga' },
  { label: 'Spa & Masaj', value: 'spa' },
  { label: 'Tırnak Salonu', value: 'nailSalon' },
  { label: 'Dövme Stüdyosu', value: 'tattoo' },
  { label: 'Veteriner', value: 'veterinarian' },
  { label: 'Oto Servis', value: 'carService' },
  { label: 'Oto Yıkama', value: 'carWash' },
  { label: 'Teknik Servis', value: 'repairService' },
  { label: 'Danışmanlık', value: 'consultant' },
  { label: 'Psikolog', value: 'psychologist' },
  { label: 'Beslenme Uzmanı', value: 'nutritionist' },
  { label: 'Özel Ders', value: 'tutor' },
  { label: 'Fotoğrafçı', value: 'photographer' },
  { label: 'Diger', value: 'other' },
];

function slugify(text: string): string {
  const map: Record<string, string> = {
    'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c',
    'İ': 'i', 'Ğ': 'g', 'Ü': 'u', 'Ş': 's', 'Ö': 'o', 'Ç': 'c',
  };
  return text
    .replace(/[ıİğĞüÜşŞöÖçÇ]/g, (ch) => map[ch] ?? ch)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

function formatPhone(text: string): string {
  const digits = text.replace(/[^\d]/g, '');
  if (!digits.startsWith('90')) return '+90 ';
  const rest = digits.slice(2, 12);
  let out = '+90 ';
  if (rest.length > 0) out += rest.slice(0, 3);
  if (rest.length > 3) out += ' ' + rest.slice(3, 6);
  if (rest.length > 6) out += ' ' + rest.slice(6, 8);
  if (rest.length > 8) out += ' ' + rest.slice(8, 10);
  return out;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: 'business' | 'customer' }>();
  const insets = useSafeAreaInsets();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const toast = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [modalContent, setModalContent] = useState<'terms' | 'privacy' | 'category' | null>(null);

  const [businessName, setBusinessName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fullNameFocused, setFullNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [businessNameFocused, setBusinessNameFocused] = useState(false);
  const [subdomainFocused, setSubdomainFocused] = useState(false);
  const [addressFocused, setAddressFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  useEffect(() => {
    if (businessName) {
      setSubdomain(slugify(businessName));
    }
  }, [businessName]);

  const isBusiness = role === 'business';
  const title = isBusiness ? 'İşletme Kaydı' : 'Müşteri Kaydı';

  const passwordsMatch = password === confirmPassword;
  const canSubmit = agreedTerms && agreedPrivacy &&
    fullName.trim() && email.trim() && phone.trim() && password.trim() &&
    (!isBusiness || (businessName.trim() && subdomain.trim() && category && passwordsMatch));

  async function handleRegister() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || fullName.trim();
      const lastName = nameParts.slice(1).join(' ') || ' ';
      const cleanPhone = phone.replace(/\s/g, '');

      if (isBusiness) {
        await api.post('/tenants/register', {
          businessName: businessName.trim(),
          subdomain: subdomain.trim(),
          ownerFirstName: firstName,
          ownerLastName: lastName,
          ownerEmail: email.trim(),
          ownerPassword: password,
          ownerPhone: cleanPhone,
          ownerAddress: address.trim(),
          businessCategory: category,
          plan: 'free',
        });
      } else {
        await api.post('/auth/register', {
          firstName,
          lastName,
          email: email.trim(),
          phone: cleanPhone,
          password,
        });
      }
      router.replace({ pathname: '/(auth)/login', params: { role } } as any);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Bir hata oluştu';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function handlePhoneChange(text: string) {
    const digits = text.replace(/[^\d]/g, '');
    if (digits.length === 0) {
      setPhone('');
      return;
    }
    if (!digits.startsWith('90')) {
      setPhone('+90 ');
      return;
    }
    setPhone(formatPhone(text));
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#E8F0FE', '#D4E4F7', '#EBF2FF']} style={StyleSheet.absoluteFill} />
      <PatternOverlay opacity={0.15} />
      <View style={styles.blobBlue} />
      <View style={styles.blobAccent} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + SPACE[4], paddingBottom: insets.bottom + SPACE[6] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
          <Text style={styles.backLabel}>Geri</Text>
        </TouchableOpacity>

        <View style={styles.formCard}>
          <View style={styles.header}>
            <View style={[styles.roleTag, isBusiness ? styles.businessTag : styles.customerTag]}>
              <Ionicons
                name={isBusiness ? 'business-outline' : 'person-outline'}
                size={14}
                color={STATIC_WHITE}
              />
              <Text style={styles.roleTagText}>
                {isBusiness ? 'İşletme' : 'Müşteri'}
              </Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>Hesap oluşturmak için bilgilerinizi girin</Text>
          </View>

          <View style={styles.form}>
            {isBusiness && (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>İşletme Adı</Text>
                  <View style={[styles.inputWrap, businessNameFocused && styles.inputWrapFocused]}>
                    <Ionicons name="business-outline" size={18} color={businessNameFocused ? COLORS.primary : COLORS.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={businessName}
                      onChangeText={setBusinessName}
                      onFocus={() => setBusinessNameFocused(true)}
                      onBlur={() => setBusinessNameFocused(false)}
                      placeholder="İşletme adınız"
                      placeholderTextColor={COLORS.textMuted}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Firma Kullanıcı Adı</Text>
                  <View style={[styles.inputWrap, subdomainFocused && styles.inputWrapFocused]}>
                    <Ionicons name="at-outline" size={18} color={subdomainFocused ? COLORS.primary : COLORS.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={subdomain}
                      onChangeText={setSubdomain}
                      onFocus={() => setSubdomainFocused(true)}
                      onBlur={() => setSubdomainFocused(false)}
                      placeholder="firma-adiniz"
                      placeholderTextColor={COLORS.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Kategori</Text>
                  <TouchableOpacity
                    style={[styles.inputWrap, styles.pickerBtn]}
                    onPress={() => setModalContent('category')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="grid-outline" size={18} color={COLORS.textMuted} />
                    <Text style={[styles.input, !category && { color: COLORS.textMuted }]}>
                      {CATEGORIES.find((c) => c.value === category)?.label || 'Kategori seçin'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Adres</Text>
                  <View style={[styles.inputWrap, addressFocused && styles.inputWrapFocused]}>
                    <Ionicons name="location-outline" size={18} color={addressFocused ? COLORS.primary : COLORS.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={address}
                      onChangeText={setAddress}
                      onFocus={() => setAddressFocused(true)}
                      onBlur={() => setAddressFocused(false)}
                      placeholder="İşletme adresi"
                      placeholderTextColor={COLORS.textMuted}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              </>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Ad Soyad</Text>
              <View style={[styles.inputWrap, fullNameFocused && styles.inputWrapFocused]}>
                <Ionicons name="person-outline" size={18} color={fullNameFocused ? COLORS.primary : COLORS.textMuted} />
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setFullNameFocused(true)}
                  onBlur={() => setFullNameFocused(false)}
                  placeholder="Ad Soyad"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>E-posta</Text>
              <View style={[styles.inputWrap, emailFocused && styles.inputWrapFocused]}>
                <Ionicons name="mail-outline" size={18} color={emailFocused ? COLORS.primary : COLORS.textMuted} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="ornek@email.com"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Telefon</Text>
              <View style={[styles.inputWrap, phoneFocused && styles.inputWrapFocused]}>
                <Ionicons name="call-outline" size={18} color={phoneFocused ? COLORS.primary : COLORS.textMuted} />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => setPhoneFocused(false)}
                  placeholder="+90 5XX XXX XX XX"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Şifre</Text>
              <View style={[styles.inputWrap, passwordFocused && styles.inputWrapFocused]}>
                <Ionicons name="lock-closed-outline" size={18} color={passwordFocused ? COLORS.primary : COLORS.textMuted} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {isBusiness && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Şifre Tekrar</Text>
                <View style={[styles.inputWrap, confirmPasswordFocused && styles.inputWrapFocused]}>
                  <Ionicons name="lock-closed-outline" size={18} color={confirmPasswordFocused ? COLORS.primary : COLORS.textMuted} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => setConfirmPasswordFocused(false)}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={showConfirmPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}>
                    <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <Text style={styles.errorText}>Şifreler eşleşmiyor</Text>
                )}
              </View>
            )}

            <View style={styles.agreements}>
              <TouchableOpacity
                style={styles.agreementRow}
                onPress={() => setAgreedTerms(!agreedTerms)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={agreedTerms ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={agreedTerms ? COLORS.primary : COLORS.textMuted}
                />
                <Text style={styles.agreementText}>
                  <Text style={styles.agreementLink} onPress={() => setModalContent('terms')}>
                    Kullanıcı Sözleşmesi
                  </Text>
                  {' '}okudum ve kabul ediyorum
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.agreementRow}
                onPress={() => setAgreedPrivacy(!agreedPrivacy)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={agreedPrivacy ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={agreedPrivacy ? COLORS.primary : COLORS.textMuted}
                />
                <Text style={styles.agreementText}>
                  <Text style={styles.agreementLink} onPress={() => setModalContent('privacy')}>
                    Aydınlatma Metni
                  </Text>
                  {' '}okudum ve kabul ediyorum
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.registerBtn, !canSubmit && styles.disabledBtn]}
              onPress={handleRegister}
              disabled={loading || !canSubmit}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={STATIC_WHITE} />
              ) : (
                <>
                  <Text style={styles.registerBtnText}>Kayıt Ol</Text>
                  <Ionicons name="arrow-forward" size={18} color={STATIC_WHITE} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Zaten hesabınız var mı? </Text>
          <TouchableOpacity onPress={() => router.replace(`/(auth)/login?role=${role}`)} activeOpacity={0.7}>
            <Text style={styles.loginLink}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={modalContent !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, modalContent === 'category' && { backgroundColor: COLORS.white }]}>
            {modalContent === 'category' ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: COLORS.text }]}>Kategori Seçin</Text>
                  <TouchableOpacity onPress={() => setModalContent(null)} activeOpacity={0.7}>
                    <Ionicons name="close-circle" size={28} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.categoryList}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[styles.categoryItem, category === cat.value && styles.categoryItemActive]}
                      onPress={() => { setCategory(cat.value); setModalContent(null); }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.categoryItemText, category === cat.value && styles.categoryItemTextActive]}>
                        {cat.label}
                      </Text>
                      {category === cat.value && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {modalContent === 'terms' ? 'Kullanıcı Sözleşmesi' : 'Aydınlatma Metni'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setModalContent(null);
                      if (modalContent === 'terms') setAgreedTerms(true);
                      if (modalContent === 'privacy') setAgreedPrivacy(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={28} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator>
                  <Text style={styles.modalText}>
                    {modalContent === 'terms' ? TERMS_TEXT : PRIVACY_TEXT}
                  </Text>
                </ScrollView>
                <TouchableOpacity
                  style={styles.modalAcceptBtn}
                  onPress={() => {
                    if (modalContent === 'terms') setAgreedTerms(true);
                    if (modalContent === 'privacy') setAgreedPrivacy(true);
                    setModalContent(null);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalAcceptBtnText}>Okudum, Kabul Ediyorum</Text>
                  <Ionicons name="checkmark-circle" size={20} color={STATIC_WHITE} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1 },
  blobBlue: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#3B82F6',
    opacity: 0.08,
  },
  blobAccent: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#60A5FA',
    opacity: 0.06,
  },
  scroll: {
    paddingHorizontal: SPACE[5],
    gap: SPACE[4],
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  backLabel: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT.medium,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: SPACE[6],
    ...SHADOW.lg,
  },
  header: {
    gap: SPACE[2],
    marginBottom: SPACE[5],
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  businessTag: { backgroundColor: COLORS.primary },
  customerTag: { backgroundColor: COLORS.primary },
  roleTagText: { fontSize: FONT.xs, fontWeight: FONT.bold, color: STATIC_WHITE },
  title: {
    fontSize: FONT['2xl'],
    fontWeight: FONT.extrabold,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
  },
  form: {
    gap: SPACE[4],
  },
  fieldGroup: {
    gap: SPACE[2],
    width: '100%',
  },
  label: {
    fontSize: FONT.sm,
    fontWeight: FONT.semibold,
    color: COLORS.textSecondary,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[3] + 2,
    gap: SPACE[2],
  },
  inputWrapFocused: {
    borderColor: COLORS.primary,
  },
  pickerBtn: {
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    fontSize: FONT.base,
    color: COLORS.text,
    padding: 0,
  },
  errorText: {
    fontSize: FONT.xs,
    color: COLORS.error,
    marginTop: 2,
  },
  agreements: {
    gap: SPACE[3],
    marginTop: SPACE[1],
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[2],
  },
  agreementText: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  agreementLink: {
    color: COLORS.primary,
    fontWeight: FONT.bold,
    textDecorationLine: 'underline',
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE[2],
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACE[4],
    marginTop: SPACE[2],
    ...SHADOW.primary,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  registerBtnText: {
    fontSize: FONT.md,
    fontWeight: FONT.bold,
    color: STATIC_WHITE,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
  },
  loginLink: {
    fontSize: FONT.sm,
    fontWeight: FONT.bold,
    color: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContainer: {
    maxHeight: '80%',
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE[5],
    paddingVertical: SPACE[4],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: FONT.lg,
    fontWeight: FONT.bold,
    color: COLORS.text,
  },
  modalBody: {
    padding: SPACE[5],
    maxHeight: 400,
  },
  modalText: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  modalAcceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE[2],
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACE[5],
    marginVertical: SPACE[4],
    paddingVertical: SPACE[3] + 2,
  },
  modalAcceptBtnText: {
    fontSize: FONT.md,
    fontWeight: FONT.bold,
    color: STATIC_WHITE,
  },
  categoryList: {
    maxHeight: 400,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE[5],
    paddingVertical: SPACE[3] + 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  categoryItemActive: {
    backgroundColor: COLORS.surfaceAlt,
  },
  categoryItemText: {
    fontSize: FONT.base,
    color: COLORS.text,
  },
  categoryItemTextActive: {
    fontWeight: FONT.bold,
    color: COLORS.primary,
  },
});
