import React, { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  ReduceMotion,
} from 'react-native-reanimated';
import { useAppDispatch } from '@/store';
import { setCredentials } from '@/store/slices/authSlice';
import { useColors, type Palette } from '@/lib/themeContext';
import { PatternOverlay } from '@/components/ui/PatternOverlay';
import { ONBOARDING_KEY } from './welcome';

const NO_REDUCE_MOTION = { reduceMotion: ReduceMotion.Never };

const SPLASH_DURATION = 1800;
const FADE_DURATION = 300;

export default function SplashScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.85);
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.ease), ...NO_REDUCE_MOTION });
    logoScale.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.back(1.2)), ...NO_REDUCE_MOTION });

    init();
  }, []);

  async function init() {
    let target: '/(business)' | '/(customer)' | '/(auth)/login' | '/welcome' = '/(auth)/login';

    let signedIn = false;
    try {
      const raw = await SecureStore.getItemAsync('auth_data');
      if (raw) {
        const auth = JSON.parse(raw);
        dispatch(setCredentials(auth));
        const role = auth.appRole || 'business';
        target = role === 'business' ? '/(business)' : '/(customer)';
        signedIn = true;
      }
    } catch { /* ignore */ }

    // First launch (and not already signed in) → show onboarding before login.
    if (!signedIn) {
      try {
        const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (!seen) target = '/welcome';
      } catch { /* a read failure just falls through to login */ }
    }

    setTimeout(() => {
      screenOpacity.value = withTiming(0, { duration: FADE_DURATION, ...NO_REDUCE_MOTION });
      setTimeout(() => router.replace(target), FADE_DURATION);
    }, SPLASH_DURATION - FADE_DURATION);
  }

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const screenAnimatedStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.root, screenAnimatedStyle]}>
      <PatternOverlay opacity={0.25} />
      <Animated.Image
        source={require('../assets/images/icon-site.png')}
        style={[styles.logo, logoAnimatedStyle]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 96,
    height: 96,
  },
});
