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
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import api from '@/lib/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!email.trim()) {
      Alert.alert('Uyarı', 'E-posta adresi zorunludur.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
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
          <Text style={styles.title}>Şifremi Unuttum</Text>
          <Text style={styles.subtitle}>
            {sent
              ? 'E-posta adresinize şifre sıfırlama bağlantısı gönderildi.'
              : 'Kayıtlı e-posta adresinizi girin, size sıfırlama bağlantısı gönderelim.'}
          </Text>
        </View>

        {!sent ? (
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
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleReset}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.resetBtnText}>Sıfırlama Bağlantısı Gönder</Text>
                  <Ionicons name="send-outline" size={18} color={COLORS.white} />
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={styles.resetBtnText}>Giriş Sayfasına Dön</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
          </TouchableOpacity>
        )}
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
  title: {
    fontSize: FONT['3xl'],
    fontWeight: FONT.extrabold,
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT.base,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 22,
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
  resetBtn: {
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
  resetBtnText: {
    fontSize: FONT.md,
    fontWeight: FONT.bold,
    color: COLORS.white,
  },
});
