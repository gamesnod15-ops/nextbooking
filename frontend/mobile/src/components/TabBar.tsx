import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/theme';

const tabs: { name: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'appointments', label: 'Randevular', icon: 'calendar-outline' },
  { name: 'services', label: 'Hizmetler', icon: 'cut-outline' },
  { name: 'index', label: 'Pano', icon: 'grid-outline' },
  { name: 'customers', label: 'Müşteriler', icon: 'people-outline' },
  { name: 'settings', label: 'Ayarlar', icon: 'settings-outline' },
];

export function TabBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  const currentName = (() => {
    if (pathname === '/(business)' || pathname === '/' || pathname === '/(business)/index') return 'index';
    for (const tab of tabs) {
      if (pathname.includes(`/${tab.name}`)) return tab.name;
    }
    return null;
  })();

  return (
    <View style={[styles.tabBar, { marginBottom: Math.max(insets.bottom, 20) }]}>
      {tabs.map((tab) => {
        const active = currentName === tab.name;

        const onPress = () => {
          const target = tab.name === 'index' ? '/(business)' : `/(business)/${tab.name}`;
          router.replace(target as any);
        };

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.btnWrap}
            onPress={onPress}
            activeOpacity={0.7}
          >
            {active ? (
              <View style={styles.iconCircle}>
                <Ionicons name={tab.icon} size={20} color="#000" />
              </View>
            ) : (
              <Ionicons name={tab.icon} size={22} color="#8E8E93" />
            )}
            {!active && <Text style={styles.label}>{tab.label}</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 10,
    borderRadius: 12,
    height: 68,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  btnWrap: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
  },
  label: {
    fontSize: 8,
    color: '#8E8E93',
    fontWeight: '500',
  },
});
