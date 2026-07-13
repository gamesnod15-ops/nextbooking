import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';

const { width } = Dimensions.get('window');

const BUSINESS_STEPS = [
  {
    icon: 'calendar-outline',
    title: 'Randevuları Yönetin',
    desc: 'Tüm randevularınızı tek bir ekrandan görün, onaylayın ve yönetin. Takviminizle senkronize çalışın.',
  },
  {
    icon: 'people-outline',
    title: 'Personel Takibi',
    desc: 'Çalışanlarınızın randevularını, çalışma saatlerini ve performanslarını kolayca takip edin.',
  },
  {
    icon: 'stats-chart-outline',
    title: 'Raporlama ve Analiz',
    desc: 'İşletmenizin performansını grafiklerle görün, müşteri memnuniyetini ölçün ve stratejik kararlar alın.',
  },
  {
    icon: 'megaphone-outline',
    title: 'Pazarlama Araçları',
    desc: 'Kampanyalar, indirimler ve bildirimlerle müşterilerinize ulaşın, sadakat programı oluşturun.',
  },
];

const CUSTOMER_STEPS = [
  {
    icon: 'search-outline',
    title: 'İşletme Keşfedin',
    desc: 'Çevrenizdeki işletmeleri keşfedin, hizmetleri inceleyin ve size en uygun olanı seçin.',
  },
  {
    icon: 'calendar-outline',
    title: 'Kolay Randevu',
    desc: 'İstediğiniz işletmeye, istediğiniz hizmet için tek dokunuşla randevu alın.',
  },
  {
    icon: 'notifications-outline',
    title: 'Hatırlatmalar',
    desc: 'Randevularınız anında bildirimlerle hatırlatılır. Hiçbir randevunuzu kaçırmayın.',
  },
  {
    icon: 'heart-outline',
    title: 'Favori İşletmeler',
    desc: 'Sık gittiğiniz işletmeleri favorilere ekleyin, hızlıca randevu alın ve puan kazanın.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: 'business' | 'customer' }>();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const scrollX = React.useRef(new Animated.Value(0)).current;

  const isBusiness = role === 'business';
  const steps = isBusiness ? BUSINESS_STEPS : CUSTOMER_STEPS;
  const totalSteps = steps.length;

  function next() {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      router.replace(`/(auth)/login?role=${role}`);
    }
  }

  function skip() {
    router.replace(`/(auth)/login?role=${role}`);
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0A0A0A', '#111111']} style={StyleSheet.absoluteFill} />

      <View style={[styles.container, { paddingTop: insets.top + SPACE[5], paddingBottom: insets.bottom + SPACE[5] }]}>
        <TouchableOpacity style={styles.skipBtn} onPress={skip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Atla</Text>
        </TouchableOpacity>

        <View style={styles.slideArea}>
          <View style={styles.iconCircle}>
            <Ionicons name={steps[step].icon as any} size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.stepTitle}>{steps[step].title}</Text>
          <Text style={styles.stepDesc}>{steps[step].desc}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {steps.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === step && styles.activeDot]}
              />
            ))}
          </View>

          <View style={styles.btnRow}>
            <Text style={styles.counter}>
              {step + 1}/{totalSteps}
            </Text>
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={next}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>
                {step < totalSteps - 1 ? 'Devam Et' : 'Başla'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.black} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: SPACE[5],
    justifyContent: 'space-between',
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingVertical: SPACE[2],
    paddingHorizontal: SPACE[3],
  },
  skipText: {
    fontSize: FONT.sm,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: FONT.medium,
  },
  slideArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACE[5],
    paddingHorizontal: SPACE[4],
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(207,242,30,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(207,242,30,0.15)',
  },
  stepTitle: {
    fontSize: FONT['2xl'],
    fontWeight: FONT.bold,
    color: COLORS.white,
    textAlign: 'center',
  },
  stepDesc: {
    fontSize: FONT.base,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACE[4],
  },
  footer: {
    gap: SPACE[6],
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACE[2],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  activeDot: {
    width: 28,
    backgroundColor: COLORS.primary,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counter: {
    fontSize: FONT.sm,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: FONT.medium,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[2],
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACE[6],
    paddingVertical: SPACE[3] + 2,
    ...SHADOW.primary,
  },
  nextBtnText: {
    fontSize: FONT.md,
    fontWeight: FONT.bold,
    color: COLORS.black,
  },
});
