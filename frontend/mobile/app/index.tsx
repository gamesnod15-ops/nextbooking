import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, DimensionValue } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  Easing,
  interpolate,
  Extrapolation,
  ReduceMotion,
} from 'react-native-reanimated';
import { useAppDispatch } from '@/store';
import { setCredentials } from '@/store/slices/authSlice';
import { COLORS } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NO_REDUCE_MOTION = { reduceMotion: ReduceMotion.Never };

const SPEED_LINES: { top: DimensionValue; width: number; delay: number }[] = [
  { top: '22%', width: 90, delay: 0 },
  { top: '38%', width: 70, delay: 200 },
  { top: '54%', width: 100, delay: 400 },
  { top: '68%', width: 75, delay: 150 },
  { top: '82%', width: 95, delay: 350 },
];

function SpeedLine({ top, width, delay }: { top: DimensionValue; width: number; delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad), ...NO_REDUCE_MOTION }),
        -1,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const tx = interpolate(progress.value, [0, 1], [-width, SCREEN_WIDTH + width]);
    const opacity = interpolate(progress.value, [0, 0.3, 1], [0, 0.6, 0], Extrapolation.CLAMP);
    return { opacity, transform: [{ translateX: tx }] };
  });

  return (
    <Animated.View style={[styles.speedLine, { top, width }, style]}>
      <LinearGradient
        colors={['transparent', COLORS.primary, 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const SPLASH_DURATION = 2200;
const FADE_DURATION = 300;

export default function SplashScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.3);
  const logoTranslateX = useSharedValue(-60);
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 400, ...NO_REDUCE_MOTION });
    logoScale.value = withSequence(
      withTiming(1.1, { duration: 400, easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), ...NO_REDUCE_MOTION }),
      withTiming(0.95, { duration: 160, ...NO_REDUCE_MOTION }),
      withTiming(1, { duration: 240, ...NO_REDUCE_MOTION })
    );
    logoTranslateX.value = withSequence(
      withTiming(5, { duration: 400, easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), ...NO_REDUCE_MOTION }),
      withTiming(-2, { duration: 160, ...NO_REDUCE_MOTION }),
      withTiming(0, { duration: 240, ...NO_REDUCE_MOTION })
    );

    init();
  }, []);

  async function init() {
    let target: '/(business)' | '/(customer)' | '/(auth)/login' = '/(auth)/login';

    try {
      const raw = await SecureStore.getItemAsync('auth_data');
      if (raw) {
        const auth = JSON.parse(raw);
        dispatch(setCredentials(auth));
        const role = auth.appRole || 'business';
        target = role === 'business' ? '/(business)' : '/(customer)';
      }
    } catch { /* ignore */ }

    setTimeout(() => {
      screenOpacity.value = withTiming(0, { duration: FADE_DURATION, ...NO_REDUCE_MOTION });
      setTimeout(() => router.replace(target), FADE_DURATION);
    }, SPLASH_DURATION - FADE_DURATION);
  }

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }, { translateX: logoTranslateX.value }],
  }));

  const screenAnimatedStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const glowOuterAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value * 0.08,
    transform: [{ scale: logoScale.value }],
  }));

  const glowInnerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value * 0.12,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <Animated.View style={[styles.root, screenAnimatedStyle]}>
      {SPEED_LINES.map((line, i) => (
        <SpeedLine key={i} top={line.top} width={line.width} delay={line.delay} />
      ))}
      <View style={styles.logoWrap}>
        <Animated.View style={[styles.glowOuter, glowOuterAnimatedStyle]} />
        <Animated.View style={[styles.glowInner, glowInnerAnimatedStyle]} />
        <Animated.Image
          source={require('../assets/images/icon-site.png')}
          style={[styles.logo, logoAnimatedStyle]}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoWrap: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: 140,
  },
  glowOuter: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: COLORS.primary,
  },
  glowInner: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: COLORS.primary,
  },
  speedLine: {
    position: 'absolute',
    height: 1.5,
  },
});
