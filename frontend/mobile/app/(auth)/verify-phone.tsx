import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SPACE } from '@/lib/theme';
import api from '@/lib/api';

export default function VerifyPhoneScreen() {
  const router = useRouter();
  const { phone, role } = useLocalSearchParams<{ phone: string; role: string }>();
  const insets = useSafeAreaInsets();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Auto-send OTP on mount
  useEffect(() => {
    sendOtp();
  }, []);

  async function sendOtp() {
    if (!phone) return;
    setSending(true);
    try {
      await api.post('/auth/send-phone-otp', { phone });
      setTimer(60);
    } catch (err: any) {
      Alert.alert('Hata', 'OTP gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSending(false);
    }
  }

  function handleOtpChange(text: string, index: number) {
    const digit = text.replace(/[^0-9]/g, '').slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const code = otp.join('');
    if (code.length !== 6) return;

    setLoading(true);
    try {
      await api.post('/auth/verify-phone-otp', { phone, otp: code });
      Alert.alert('Başarılı', 'Telefon numaranız doğrulandı.', [
        { text: 'Giriş Yap', onPress: () => router.replace(`/(auth)/login?role=${role || 'customer'}`) },
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Doğrulama başarısız.';
      Alert.alert('Hata', msg);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
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

      <View style={[styles.container, { paddingTop: insets.top + SPACE[5] }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.6)" />
          <Text style={styles.backLabel}>Geri</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <Ionicons name="phone-portrait-outline" size={36} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>Telefon Doğrulama</Text>
          <Text style={styles.subtitle}>
            {phone ? `${phone} numarasına gönderilen 6 haneli kodu girin.` : 'Telefon numarası bulunamadı.'}
          </Text>

          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputRefs.current[i] = ref; }}
                style={[styles.otpInput, digit ? styles.otpFilled : null]}
                value={digit}
                onChangeText={(t) => handleOtpChange(t, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.verifyBtn, otp.join('').length !== 6 || loading ? styles.verifyBtnDisabled : null]}
            onPress={handleVerify}
            disabled={otp.join('').length !== 6 || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.black} size="small" />
            ) : (
              <Text style={styles.verifyBtnText}>Doğrula</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendBtn}
            onPress={sendOtp}
            disabled={timer > 0 || sending}
            activeOpacity={0.7}
          >
            {sending ? (
              <ActivityIndicator color={COLORS.primary} size="small" />
            ) : (
              <Text style={[styles.resendText, timer > 0 ? styles.resendDisabled : null]}>
                {timer > 0 ? `${timer} saniye sonra tekrar gönder` : 'Kodu Tekrar Gönder'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  blob: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,185,0,0.06)',
  },
  container: { flex: 1, paddingHorizontal: SPACE[5] },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACE[6] },
  backLabel: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,185,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE[5],
  },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.white, marginBottom: SPACE[2] },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 20, paddingHorizontal: SPACE[4], marginBottom: SPACE[8] },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: SPACE[6] },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  otpFilled: { borderColor: COLORS.primary, backgroundColor: 'rgba(255,185,0,0.1)' },
  verifyBtn: {
    width: '100%',
    height: 52,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE[4],
  },
  verifyBtnDisabled: { opacity: 0.4 },
  verifyBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  resendBtn: { alignItems: 'center', padding: SPACE[2] },
  resendText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  resendDisabled: { color: 'rgba(255,185,0,0.35)' },
});
