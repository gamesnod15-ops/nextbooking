import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAppDispatch } from '@/store';
import { setCredentials } from '@/store/slices/authSlice';

export default function SplashScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    init();
  }, []);

  async function init() {
    try {
      const raw = await SecureStore.getItemAsync('auth_data');
      if (raw) {
        const auth = JSON.parse(raw);
        dispatch(setCredentials(auth));
        const role = auth.appRole || 'business';
        router.replace(role === 'business' ? '/(business)' : '/(customer)');
        return;
      }
    } catch { /* ignore */ }

    setTimeout(() => {
      router.replace('/(auth)/login');
    }, 1500);
  }

  return (
    <View style={styles.root}>
      <Image
        source={require('../assets/images/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
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
    width: 180,
    height: 180,
  },
});
