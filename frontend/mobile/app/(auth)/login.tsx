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
import { DotGrid } from '@/components/ui/DotGrid';

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
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

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
        <LinearGradient colors={['#E8F0FE', '#D4E4F7', '#EBF2FF']} style={StyleSheet.absoluteFill} />
        <View style={styles.blobBlue} />
        <View style={styles.blobAccent} />
        <DotGrid style={styles.dotGridTopRight} rows={5} cols={4} />
        <DotGrid style={styles.dotGridBottomLeft} rows={4} cols={4} />

        <ScrollView
          contentContainerStyle={[styles.formScroll, { paddingTop: insets.top + SPACE[4], paddingBottom: insets.bottom + SPACE[6] }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => setShowLoginForm(false)} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
            <Text style={styles.backLabel}>Geri</Text>
          </TouchableOpacity>

          <View style={styles.formCard}>
            <Image
              source={require('../../assets/images/icon-site.png')}
              style={styles.formCardLogo}
              resizeMode="contain"
            />
            <Text style={styles.formCardTitle}>Hoş Geldiniz</Text>
            <Text style={styles.formCardSubtitle}>Hesabınıza giriş yaparak devam edin</Text>

            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>E-posta</Text>
                <View style={[styles.inputWrap, emailFocused && styles.inputWrapFocused]}>
                  <Ionicons name="mail-outline" size={18} color={emailFocused ? COLORS.primary : COLORS.textMuted} style={styles.inputIcon} />
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
                    autoCorrect={false}
                    autoComplete="email"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Şifre</Text>
                <View style={[styles.inputWrap, passwordFocused && styles.inputWrapFocused]}>
                  <Ionicons name="lock-closed-outline" size={18} color={passwordFocused ? COLORS.primary : COLORS.textMuted} style={styles.inputIcon} />
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

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>veya</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Hesabınız yok mu? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register?role=business')} activeOpacity={0.7}>
                <Text style={styles.registerLink}>Kayıt Ol</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.secureFooter}>
            <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.secureFooterText}>Güvenli bağlantı ile korunmaktadır</Text>
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
      <DotGrid style={styles.dotGridTopRight} rows={5} cols={4} />
      <DotGrid style={styles.dotGridBottomLeft} rows={4} cols={4} />

      <View style={[styles.logoBlock, { paddingTop: insets.top + SPACE[10] }]}>
        <Image
          source={require('../../assets/images/icon-site.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.heroBlock}>
        <Text style={styles.heroTitle}>Hoş Geldiniz</Text>
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
              <Text style={styles.cardDesc}>
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
  dotGridTopRight: {
    position: 'absolute',
    top: 24,
    right: 8,
  },
  dotGridBottomLeft: {
    position: 'absolute',
    bottom: 24,
    left: 8,
  },
  formScroll: {
    paddingHorizontal: SPACE[5],
    gap: SPACE[4],
    flexGrow: 1,
    justifyContent: 'center',
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
    alignItems: 'center',
    ...SHADOW.lg,
  },
  formCardLogo: {
    width: 76,
    height: 76,
    marginBottom: SPACE[3],
  },
  formCardTitle: {
    fontSize: FONT['2xl'],
    fontWeight: FONT.extrabold,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  formCardSubtitle: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACE[1],
    marginBottom: SPACE[6],
  },
  form: {
    width: '100%',
    gap: SPACE[5],
  },
  fieldGroup: {
    gap: SPACE[2],
    width: '100%',
  },
  label: {
    fontSize: FONT.sm,
    fontWeight: FONT.semibold,
    color: COLORS.textSecondary,
    textAlign: 'left',
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    width: '100%',
    marginTop: SPACE[6],
    marginBottom: SPACE[4],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  dividerText: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
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
  secureFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACE[5],
  },
  secureFooterText: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
  },
  logoBlock: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
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
