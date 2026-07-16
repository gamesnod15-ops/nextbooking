import React, { useState } from 'react';
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
  Alert,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import api from '@/lib/api';

const TERMS_TEXT = `
KULLANICI SÖZLEŞMESİ

1. Taraflar
İşbu sözleşme, RandevumKolay uygulaması ("Uygulama") ile kullanıcı ("Kullanıcı") arasında akdedilmiştir.

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
RandevumKolay ("Şirket"), 6698 sayılı KVKK kapsamında veri sorumlusudur.

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

export default function RegisterScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: 'business' | 'customer' }>();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [modalContent, setModalContent] = useState<'terms' | 'privacy' | null>(null);

  const isBusiness = role === 'business';
  const title = isBusiness ? 'İşletme Kaydı' : 'Müşteri Kaydı';

  const canSubmit = agreedTerms && agreedPrivacy && fullName.trim() && email.trim() && phone.trim() && password.trim();

  async function handleRegister() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || fullName.trim();
      const lastName = nameParts.slice(1).join(' ') || ' ';
      await api.post('/auth/register', {
        firstName,
        lastName,
        email: email.trim(),
        phone: phone.trim().replace(/\s/g, ''),
        password,
      });
      router.replace({ pathname: '/(auth)/verify-phone', params: { phone: phone.trim(), role } } as any);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Bir hata oluştu';
      Alert.alert('Hata', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#0A0A0A', '#111111']} style={StyleSheet.absoluteFill} />
      <View style={styles.blob} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + SPACE[5], paddingBottom: insets.bottom + SPACE[8] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.6)" />
          <Text style={styles.backLabel}>Geri</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={[styles.roleTag, isBusiness ? styles.businessTag : styles.customerTag]}>
            <Ionicons
              name={isBusiness ? 'business-outline' : 'person-outline'}
              size={14}
              color={COLORS.white}
            />
            <Text style={[styles.roleTagText, { color: COLORS.white }]}>
              {isBusiness ? 'İşletme' : 'Müşteri'}
            </Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Hesap oluşturmak için bilgilerinizi girin</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Ad Soyad / Firma Adı</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.35)" />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ad Soyad"
                placeholderTextColor="rgba(255,255,255,0.25)"
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>E-posta</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.35)" />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="ornek@email.com"
                placeholderTextColor="rgba(255,255,255,0.25)"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Telefon</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={18} color="rgba(255,255,255,0.35)" />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+90 5XX XXX XX XX"
                placeholderTextColor="rgba(255,255,255,0.25)"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Şifre</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.35)" />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.25)"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="rgba(255,255,255,0.35)" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.agreements}>
            <TouchableOpacity
              style={styles.agreementRow}
              onPress={() => setAgreedTerms(!agreedTerms)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={agreedTerms ? 'checkbox' : 'square-outline'}
                size={22}
                color={agreedTerms ? COLORS.primary : 'rgba(255,255,255,0.3)'}
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
                color={agreedPrivacy ? COLORS.primary : 'rgba(255,255,255,0.3)'}
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
            style={[styles.registerBtn, isBusiness ? {} : styles.customerBtn, !canSubmit && styles.disabledBtn]}
            onPress={handleRegister}
            disabled={loading || !canSubmit}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.registerBtnText}>Kayıt Ol</Text>
                <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>
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
          <View style={styles.modalContainer}>
            <LinearGradient colors={['#1E1E1E', '#2A2A2A']} style={StyleSheet.absoluteFill} />
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
              <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  blob: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: COLORS.primary,
    opacity: 0.05,
  },
  scroll: {
    paddingHorizontal: SPACE[5],
    gap: SPACE[5],
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  backLabel: {
    fontSize: FONT.sm,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: FONT.medium,
  },
  header: {
    gap: SPACE[2],
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginBottom: SPACE[2],
  },
  businessTag: { backgroundColor: COLORS.primary },
  customerTag: { backgroundColor: '#3B82F6' },
  roleTagText: { fontSize: FONT.xs, fontWeight: FONT.bold },
  title: {
    fontSize: FONT['3xl'],
    fontWeight: FONT.extrabold,
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT.base,
    color: 'rgba(255,255,255,0.45)',
  },
  form: {
    gap: SPACE[4],
  },
  fieldGroup: {
    gap: SPACE[2],
  },
  label: {
    fontSize: FONT.sm,
    fontWeight: FONT.semibold,
    color: 'rgba(255,255,255,0.65)',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[3] + 2,
    gap: SPACE[2],
  },
  input: {
    flex: 1,
    fontSize: FONT.base,
    color: COLORS.white,
    padding: 0,
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
    color: 'rgba(255,255,255,0.6)',
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
  customerBtn: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  registerBtnText: {
    fontSize: FONT.md,
    fontWeight: FONT.bold,
    color: COLORS.white,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: FONT.sm,
    color: 'rgba(255,255,255,0.4)',
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
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE[5],
    paddingVertical: SPACE[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: {
    fontSize: FONT.lg,
    fontWeight: FONT.bold,
    color: COLORS.white,
  },
  modalBody: {
    padding: SPACE[5],
    maxHeight: 400,
  },
  modalText: {
    fontSize: FONT.sm,
    color: 'rgba(255,255,255,0.7)',
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
    color: COLORS.white,
  },
});
