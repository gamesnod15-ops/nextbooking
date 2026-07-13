import { Stack } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DrawerProvider } from '@/components/DrawerMenu';
import { TabBar } from '@/components/TabBar';

export default function PagesLayout() {
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
