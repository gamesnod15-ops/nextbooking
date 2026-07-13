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
import { setCredentials } from '@/store/slices/authSlice';
import { storage } from '@/lib/storage';
import api from '@/lib/api';
import * as SecureStore from 'expo-secure-store';

export default function LoginScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: 'business' | 'customer' }>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isBusiness = role === 'business';
  const title = isBusiness ? 'İşletme Girişi' : 'Müşteri Girişi';

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
      const status = err.response?.status;
      const message = err.response?.data?.message || err.response?.data?.detail || err.message || 'Bir hata oluştu';
      Alert.alert('Giriş Hatası', message);
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
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.6)" />
          <Text style={styles.backLabel}>Geri</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.roleTag, isBusiness ? styles.businessTag : styles.customerTag]}>
            <Ionicons
              name={isBusiness ? 'business-outline' : 'person-outline'}
              size={14}
              color={isBusiness ? COLORS.black : COLORS.white}
            />
            <Text style={[styles.roleTagText, isBusiness ? { color: COLORS.black } : { color: COLORS.white }]}>
              {isBusiness ? 'İşletme' : 'Müşteri'}
            </Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>E-posta</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.35)" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="ornek@email.com"
                placeholderTextColor="rgba(255,255,255,0.25)"
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
              <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.35)" style={styles.inputIcon} />
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

          <TouchableOpacity style={styles.forgotBtn} onPress={() => router.push('/(auth)/forgot-password')} activeOpacity={0.7}>
            <Text style={styles.forgotText}>Şifremi unuttum</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginBtn, isBusiness ? {} : styles.customerLoginBtn]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.black} />
            ) : (
              <>
                <Text style={styles.loginBtnText}>Giriş Yap</Text>
                <Ionicons name="arrow-forward" size={18} color={COLORS.black} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Register CTA */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Hesabınız yok mu? </Text>
          <TouchableOpacity onPress={() => router.push(`/(auth)/register?role=${role}`)} activeOpacity={0.7}>
            <Text style={styles.registerLink}>Kayıt Ol</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  businessTag: {
    backgroundColor: COLORS.primary,
  },
  customerTag: {
    backgroundColor: '#3B82F6',
  },
  roleTagText: {
    fontSize: FONT.xs,
    fontWeight: FONT.bold,
  },
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
    gap: SPACE[5],
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
  inputIcon: {},
  input: {
    flex: 1,
    fontSize: FONT.base,
    color: COLORS.white,
    padding: 0,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -SPACE[3],
  },
  forgotText: {
    fontSize: FONT.sm,
    color: COLORS.primary + 'CC',
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
  customerLoginBtn: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
  },
  loginBtnText: {
    fontSize: FONT.md,
    fontWeight: FONT.bold,
    color: COLORS.black,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: FONT.sm,
    color: 'rgba(255,255,255,0.4)',
  },
  registerLink: {
    fontSize: FONT.sm,
    fontWeight: FONT.bold,
    color: COLORS.primary,
  },
});

