import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { useAppDispatch } from '@/store';
import { setAppRole } from '@/store/slices/authSlice';
import type { AppRole } from '@/types';

export default function RoleSelectScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  function handleSelect(role: AppRole) {
    dispatch(setAppRole(role));
    router.push(`/(auth)/login?role=${role}`);
  }

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + SPACE[5] }]}>
      <LinearGradient
        colors={['#0A0A0A', '#1A1A1A', '#0A0A0A']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.logoBlock, { paddingTop: insets.top + SPACE[10] }]}>
        <Image
          source={require('../assets/images/logo-white.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.cardsBlock}>
        <Text style={styles.prompt}>Devam etmek için rolünüzü seçin</Text>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => handleSelect('customer')}
        >
          <LinearGradient
            colors={['#1E1E1E', '#2A2A2A']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardIcon}>
              <Ionicons name="person-outline" size={28} color={COLORS.primary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Müşteri</Text>
              <Text style={styles.cardDesc}>Randevu al, takip et, keşfet</Text>
            </View>
            <View style={styles.cardArrow}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.primaryCard]}
          activeOpacity={0.85}
          onPress={() => handleSelect('business')}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.cardIcon, styles.primaryCardIcon]}>
              <Ionicons name="business-outline" size={28} color={COLORS.black} />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, styles.primaryCardTitle]}>İşletme</Text>
              <Text style={[styles.cardDesc, styles.primaryCardDesc]}>
                Randevuları ve işletmenizi yönetin
              </Text>
            </View>
            <View style={[styles.cardArrow, styles.primaryCardArrow]}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.black} />
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
          <Ionicons name="play-circle-outline" size={16} color="rgba(255,255,255,0.4)" />
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
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoBlock: {
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 180,
  },
  cardsBlock: {
    width: '100%',
    paddingHorizontal: SPACE[5],
    gap: SPACE[4],
  },
  prompt: {
    fontSize: FONT.sm,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: FONT.medium,
    textAlign: 'center',
    marginBottom: SPACE[2],
  },
  card: {
    borderRadius: RADIUS['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  primaryCard: {
    borderWidth: 0,
    ...SHADOW.primary,
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
    backgroundColor: 'rgba(207,242,30,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCardIcon: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  cardContent: { flex: 1 },
  cardTitle: {
    fontSize: FONT.lg,
    fontWeight: FONT.bold,
    color: COLORS.white,
    marginBottom: 3,
  },
  primaryCardTitle: {
    color: COLORS.black,
  },
  cardDesc: {
    fontSize: FONT.sm,
    color: 'rgba(255,255,255,0.5)',
  },
  primaryCardDesc: {
    color: 'rgba(0,0,0,0.55)',
  },
  cardArrow: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(207,242,30,0.1)',
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
    borderColor: 'rgba(255,255,255,0.08)',
  },
  onboardingText: {
    fontSize: FONT.xs,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: FONT.medium,
  },
  footer: {
    fontSize: FONT.xs,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    paddingHorizontal: SPACE[8],
    lineHeight: 18,
  },
  footerLink: {
    color: COLORS.primary + '80',
  },
});
