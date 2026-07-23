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
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { useAppDispatch } from '@/store';
import { setCredentials, setAppRole } from '@/store/slices/authSlice';
import api from '@/lib/api';
import * as SecureStore from 'expo-secure-store';

export default function LoginScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: 'business' | 'customer' }>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  const [showLoginForm, setShowLoginForm] = useState(role === 'business');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isBusiness = role === 'business';

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Uyarı', 'E-posta ve şifre zorunludur.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: email.trim(), password });
      const { accessToken, refreshToken, userId, role: userRole, tenantId, fullName, email: userEmail, phone, jobTitle, avatarUrl, phoneVerified, emailVerified } = res.data;

      const authData = { accessToken, userId, role: userRole, tenantId, fullName, email: userEmail, phone, jobTitle, avatarUrl, appRole: role };
      await SecureStore.setItemAsync('access_token', accessToken);
      if (refreshToken) await SecureStore.setItemAsync('refresh_token', refreshToken);
      await SecureStore.setItemAsync('auth_data', JSON.stringify(authData));

      dispatch(setCredentials(authData));

      if (phone && !phoneVerified && role === 'customer') {
        router.replace({ pathname: '/(auth)/verify-phone', params: { phone, role: role || 'customer' } } as any);
        return;
      }

      if (role === 'business') {
        router.replace('/(business)');
      } else {
        router.replace('/(customer)');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.detail || err.message || 'Bir hata oluştu';
      Alert.alert('Giriş Hatası', message);
    } finally {
      setLoading(false);
    }
  }

  if (showLoginForm) {
    return (
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <LinearGradient colors={['#EBF2FF', '#F0F6FF', '#E8F0FE']} style={StyleSheet.absoluteFill} />

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + SPACE[5], paddingBottom: insets.bottom + SPACE[8] }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => setShowLoginForm(false)} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
            <Text style={styles.backLabel}>Geri</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.roleTag, styles.businessTag]}>
              <Ionicons name="business-outline" size={14} color={COLORS.white} />
              <Text style={[styles.roleTagText, { color: COLORS.white }]}>İşletme</Text>
            </View>
            <Text style={styles.title}>İşletme Girişi</Text>
            <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>E-posta</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ornek@email.com"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Şifre</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotBtn} onPress={() => router.push('/(auth)/forgot-password')} activeOpacity={0.7}>
              <Text style={styles.forgotText}>Şifremi unuttum</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Giriş Yap</Text>
                  <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Hesabınız yok mu? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register?role=business')} activeOpacity={0.7}>
              <Text style={styles.registerLink}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + SPACE[5] }]}>
      <LinearGradient
        colors={['#E8F0FE', '#D4E4F7', '#EBF2FF']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.blobBlue} />
      <View style={styles.blobAccent} />

      <View style={[styles.logoBlock, { paddingTop: insets.top + SPACE[10] }]}>
        <Image
          source={require('../../assets/images/splash-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.heroBlock}>
        <Text style={styles.heroTitle}>RandevumKolay'a{'\n'}Hoş Geldiniz</Text>
        <Text style={styles.heroSubtitle}>İşletmenizi yönetin veya hemen randevu alın</Text>
      </View>

      <View style={styles.cardsBlock}>
        <TouchableOpacity
          style={styles.primaryCard}
          activeOpacity={0.85}
          onPress={() => {
            dispatch(setAppRole('business'));
            setShowLoginForm(true);
          }}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.cardIcon, styles.primaryCardIcon]}>
              <Ionicons name="business-outline" size={28} color={COLORS.white} />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, styles.primaryCardTitle]}>İşletme Girişi</Text>
              <Text style={[styles.cardDesc, styles.primaryCardDesc]}>
                Randevuları ve işletmenizi yönetin
              </Text>
            </View>
            <View style={[styles.cardArrow, styles.primaryCardArrow]}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryCard}
          activeOpacity={0.85}
          onPress={() => {
            dispatch(setAppRole('customer'));
            router.push('/(customer)/businesses');
          }}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F5F9FF']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardIconBlue}>
              <Ionicons name="calendar-outline" size={28} color={COLORS.info} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitleBlue}>Randevu Al</Text>
              <Text style={styles.cardDescBlue}>İşletmeleri keşfedin ve hemen randevu oluşturun</Text>
            </View>
            <View style={styles.cardArrowBlue}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.info} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.footerBlock}>
        <TouchableOpacity
          style={styles.onboardingBtn}
          onPress={() => router.push({ pathname: '/(auth)/onboarding', params: { role: 'business' } })}
          activeOpacity={0.7}
        >
          <Ionicons name="play-circle-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.onboardingText}>Uygulamayı Tanıyın</Text>
        </TouchableOpacity>
        <Text style={styles.footer}>
          Giriş yaparak{' '}
          <Text style={styles.footerLink}>Kullanım Koşulları</Text>
          {'nı ve '}
          <Text style={styles.footerLink}>Gizlilik Politikası</Text>
          {'nı kabul etmiş olursunuz.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    gap: SPACE[6],
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
  businessTag: {
    backgroundColor: COLORS.primary,
  },
  roleTagText: {
    fontSize: FONT.xs,
    fontWeight: FONT.bold,
  },
  title: {
    fontSize: FONT['3xl'],
    fontWeight: FONT.extrabold,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT.base,
    color: COLORS.textSecondary,
  },
  form: {
    gap: SPACE[5],
  },
  fieldGroup: {
    gap: SPACE[2],
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
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[3] + 2,
    gap: SPACE[2],
  },
  inputIcon: {},
  input: {
    flex: 1,
    fontSize: FONT.base,
    color: COLORS.text,
    padding: 0,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -SPACE[3],
  },
  forgotText: {
    fontSize: FONT.sm,
    color: COLORS.primary,
    fontWeight: FONT.medium,
  },
  loginBtn: {
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
  loginBtnText: {
    fontSize: FONT.md,
    fontWeight: FONT.bold,
    color: COLORS.white,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
  },
  registerLink: {
    fontSize: FONT.sm,
    fontWeight: FONT.bold,
    color: COLORS.primary,
  },
  logoBlock: {
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 140,
  },
  heroBlock: {
    alignItems: 'center',
    paddingHorizontal: SPACE[5],
    gap: SPACE[2],
  },
  heroTitle: {
    fontSize: FONT['3xl'],
    fontWeight: FONT.extrabold,
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: FONT.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  cardsBlock: {
    width: '100%',
    paddingHorizontal: SPACE[5],
    gap: SPACE[4],
  },
  primaryCard: {
    borderRadius: RADIUS['2xl'],
    overflow: 'hidden',
    borderWidth: 0,
    ...SHADOW.primary,
  },
  secondaryCard: {
    borderRadius: RADIUS['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D4E4F7',
    backgroundColor: COLORS.white,
    ...SHADOW.sm,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACE[5],
    gap: SPACE[4],
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCardIcon: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  cardIconBlue: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.lg,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { flex: 1 },
  cardTitle: {
    fontSize: FONT.lg,
    fontWeight: FONT.bold,
    color: COLORS.white,
    marginBottom: 3,
  },
  cardTitleBlue: {
    fontSize: FONT.lg,
    fontWeight: FONT.bold,
    color: COLORS.text,
    marginBottom: 3,
  },
  primaryCardTitle: {
    color: COLORS.white,
  },
  cardDesc: {
    fontSize: FONT.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  cardDescBlue: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
  },
  primaryCardDesc: {
    color: 'rgba(0,0,0,0.55)',
  },
  cardArrow: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardArrowBlue: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCardArrow: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  footerBlock: {
    alignItems: 'center',
    gap: SPACE[3],
  },
  onboardingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACE[2],
    paddingHorizontal: SPACE[4],
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  onboardingText: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    fontWeight: FONT.medium,
  },
  footer: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: SPACE[8],
    lineHeight: 18,
  },
  footerLink: {
    color: COLORS.primary,
  },
});
