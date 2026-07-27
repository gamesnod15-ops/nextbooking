import React, { useMemo, useRef, useState } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { DotGrid } from '@/components/ui/DotGrid';

const { width } = Dimensions.get('window');

export const ONBOARDING_KEY = 'onboarding_completed';

const SLIDES = [
  {
    key: 'book',
    image: require('../assets/images/dashboard/hero-calendar.png'),
    title: 'Randevunu saniyeler içinde al',
    text: 'Yakınındaki işletmeleri keşfet, uygun saati seç ve randevunu anında oluştur.',
  },
  {
    key: 'manage',
    image: require('../assets/images/dashboard/promo-phone.png'),
    title: 'İşletmeni tek yerden yönet',
    text: 'Randevularını, müşterilerini, personelini ve gelirini cebinden takip et.',
  },
  {
    key: 'stay',
    image: require('../assets/images/dashboard/profile-3d.png'),
    title: 'Hiçbir şeyi kaçırma',
    text: 'Hatırlatmalar, favori işletmeler ve kampanyalarla her zaman güncel kal.',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const isLast = index === SLIDES.length - 1;

  async function finish() {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
      /* a failed write only means onboarding shows again — not worth blocking on */
    }
    router.replace('/(auth)/login');
  }

  function next() {
    if (isLast) {
      finish();
      return;
    }
    const target = index + 1;
    scrollRef.current?.scrollTo({ x: target * width, animated: true });
    setIndex(target);
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.blobTop} pointerEvents="none" />
      <View style={styles.blobBottom} pointerEvents="none" />
      <DotGrid style={styles.dotsTopRight} rows={5} cols={4} />
      <DotGrid style={styles.dotsBottomLeft} rows={4} cols={4} />

      {/* Skip */}
      <View style={styles.topBar}>
        {!isLast ? (
          <TouchableOpacity onPress={finish} activeOpacity={0.7} style={styles.skipBtn}>
            <Text style={styles.skipText}>Atla</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ height: 34 }} />
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s) => (
          <View key={s.key} style={[styles.slide, { width }]}>
            <View style={styles.imageWrap}>
              <View style={styles.imageHalo} pointerEvents="none" />
              <Image source={s.image} style={styles.image} resizeMode="contain" />
            </View>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.text}>{s.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACE[5] }]}>
        <View style={styles.dotsRow}>
          {SLIDES.map((s, i) => (
            <View key={s.key} style={[styles.pageDot, i === index && styles.pageDotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={next} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>{isLast ? 'Hemen Başla' : 'İleri'}</Text>
          <Ionicons name="arrow-forward" size={18} color={STATIC_WHITE} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  blobTop: {
    position: 'absolute', top: -90, right: -70, width: 260, height: 260, borderRadius: 130,
    backgroundColor: COLORS.primary, opacity: 0.07,
  },
  blobBottom: {
    position: 'absolute', bottom: -110, left: -80, width: 280, height: 280, borderRadius: 140,
    backgroundColor: COLORS.primary, opacity: 0.05,
  },
  dotsTopRight: { position: 'absolute', top: 90, right: 20 },
  dotsBottomLeft: { position: 'absolute', bottom: 150, left: 18 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACE[5],
    paddingTop: SPACE[2],
  },
  skipBtn: {
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[2],
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  skipText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },

  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE[8],
    gap: SPACE[3],
  },
  imageWrap: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE[4],
  },
  imageHalo: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.surface,
    opacity: 0.9,
    ...SHADOW.sm,
  },
  image: { width: 168, height: 168 },
  title: {
    fontSize: FONT['2xl'],
    fontWeight: FONT.extrabold,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 32,
  },
  text: {
    fontSize: FONT.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
  },

  footer: {
    paddingHorizontal: SPACE[6],
    gap: SPACE[5],
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
  },
  pageDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  pageDotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE[2],
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: 16,
    ...SHADOW.primary,
  },
  primaryBtnText: { fontSize: FONT.md, fontWeight: FONT.bold, color: STATIC_WHITE },
});
