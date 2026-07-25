import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  ReduceMotion,
} from 'react-native-reanimated';
import { useAppDispatch } from '@/store';
import { setCredentials } from '@/store/slices/authSlice';
import { COLORS } from '@/lib/theme';

const NO_REDUCE_MOTION = { reduceMotion: ReduceMotion.Never };

const SPLASH_DURATION = 1800;
const FADE_DURATION = 300;

export default function SplashScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.85);
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.ease), ...NO_REDUCE_MOTION });
    logoScale.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.back(1.2)), ...NO_REDUCE_MOTION });

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
    transform: [{ scale: logoScale.value }],
  }));

  const screenAnimatedStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.root, screenAnimatedStyle]}>
      <Animated.Image
        source={require('../assets/images/icon-site.png')}
        style={[styles.logo, logoAnimatedStyle]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
