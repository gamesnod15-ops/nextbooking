import React from 'react';
import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { TabBar, type TabBarItem } from '@/components/TabBar';

const CUSTOMER_TABS: TabBarItem[] = [
  { name: 'index', label: 'İşletmeler', icon: 'business-outline' },
  { name: 'appointments', label: 'Randevularım', icon: 'calendar-outline' },
  { name: 'favorites', label: 'Favoriler', icon: 'heart-outline' },
  { name: 'profile', label: 'Profil', icon: 'person-outline' },
];

export default function TabsLayout() {
  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false }} />
      <TabBar basePath="/(customer)/(tabs)" tabs={CUSTOMER_TABS} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
