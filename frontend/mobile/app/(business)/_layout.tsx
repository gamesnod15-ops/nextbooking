import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppSelector } from '@/store';
import { DrawerProvider } from '@/components/DrawerMenu';
import { TabBar } from '@/components/TabBar';

export default function BusinessLayout() {
  const router = useRouter();
  const auth = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!auth.accessToken) {
      router.replace('/(auth)/login?role=business');
    }
  }, [auth.accessToken]);

  return (
    <DrawerProvider>
      <View style={styles.root}>
        <Stack screenOptions={{ headerShown: false }} />
        <TabBar />
      </View>
    </DrawerProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
