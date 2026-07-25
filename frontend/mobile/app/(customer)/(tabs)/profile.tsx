import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { Avatar } from '@/components/ui/Avatar';
import * as SecureStore from 'expo-secure-store';
import { logout } from '@/store/slices/authSlice';
import type { RootState } from '@/store';
import api from '@/lib/api';
import { getDeviceId } from '@/lib/deviceId';

const MENU_ITEMS = [
  { icon: 'calendar-outline', label: 'Geçmiş Randevular', section: 'history' },
  { icon: 'star-outline', label: 'Yorumlarım', section: 'reviews' },
  { icon: 'gift-outline', label: 'Hediye Kuponlarım', section: 'coupons' },
  { icon: 'notifications-outline', label: 'Bildirimler', section: 'notifications' },
  { icon: 'lock-closed-outline', label: 'Gizlilik', section: 'privacy' },
  { icon: 'help-circle-outline', label: 'Destek', section: 'support' },
] as const;

export default function CustomerProfileScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const router = useRouter();
  const auth = useSelector((state: RootState) => state.auth);
  const accessToken = auth.accessToken;

  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.data;
    },
    enabled: !!accessToken,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: async () => {
      const deviceId = await getDeviceId();
      const res = await api.get(`/appointments/by-device?deviceId=${deviceId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await api.get('/favorites');
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!accessToken,
  });

  const stats = [
    { label: 'Toplam Randevu', value: appointments.length },
    { label: 'Tamamlanan', value: appointments.filter((a: any) => a.status === 'completed').length },
    { label: 'Favori Salon', value: favorites.length },
  ];

  function handleMenuPress(section: string) {
    if (section === 'history') {
      router.push('/(customer)/(tabs)/appointments');
      return;
    }
    Alert.alert('Yakında', 'Bu özellik yakında eklenecek.');
  }

  const displayName = profile?.fullName || auth.fullName || 'Kullanıcı';
  const displayEmail = profile?.email || auth.email || null;
  const displayPhone = profile?.phone || null;

  if (!accessToken) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profilim</Text>
        </View>
        <View style={styles.guestContainer}>
          <Ionicons name="person-circle-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.guestTitle}>Giriş yapmadınız</Text>
          <Text style={styles.guestText}>Profil bilgilerinizi görmek için giriş yapın</Text>
          <TouchableOpacity style={styles.guestBtn} onPress={() => router.push('/(auth)/login')} activeOpacity={0.85}>
            <Text style={styles.guestBtnText}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profilim</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Avatar name={displayName} size={72} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            {displayEmail && <Text style={styles.profileEmail}>{displayEmail}</Text>}
            {displayPhone && <Text style={styles.profileEmail}>{displayPhone}</Text>}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {MENU_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.section}
              style={[styles.menuItem, idx < MENU_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight }]}
              onPress={() => handleMenuPress(item.section)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name={item.icon as any} size={18} color={COLORS.text} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await SecureStore.deleteItemAsync('access_token'); await SecureStore.deleteItemAsync('auth_data'); dispatch(logout()); }}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACE[5], paddingVertical: SPACE[4] },
  headerTitle: { fontSize: FONT['2xl'], fontWeight: FONT.extrabold, color: COLORS.text },
  guestContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACE[3], paddingHorizontal: SPACE[6] },
  guestTitle: { fontSize: FONT.lg, fontWeight: FONT.bold, color: COLORS.text },
  guestText: { fontSize: FONT.sm, color: COLORS.textMuted, textAlign: 'center' },
  guestBtn: { marginTop: SPACE[2], backgroundColor: COLORS.primary, paddingHorizontal: SPACE[6], paddingVertical: SPACE[3], borderRadius: RADIUS.lg, ...SHADOW.primary },
  guestBtnText: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.white },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: SPACE[4], backgroundColor: COLORS.surface, marginHorizontal: SPACE[5], borderRadius: RADIUS.xl, padding: SPACE[5], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: FONT.lg, fontWeight: FONT.bold, color: COLORS.text },
  profileEmail: { fontSize: FONT.xs, color: COLORS.textMuted },
  statsRow: { flexDirection: 'row', gap: SPACE[3], paddingHorizontal: SPACE[5], paddingVertical: SPACE[4] },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], alignItems: 'center', gap: 3, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  statValue: { fontSize: FONT.xl, fontWeight: FONT.extrabold, color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
  menu: { marginHorizontal: SPACE[5], backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.borderLight, overflow: 'hidden', ...SHADOW.sm, marginBottom: SPACE[4] },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: SPACE[4], gap: SPACE[3] },
  menuIconBox: { width: 36, height: 36, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: FONT.base, color: COLORS.text },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE[3], marginHorizontal: SPACE[5], borderRadius: RADIUS.xl, padding: SPACE[4], borderWidth: 1, borderColor: COLORS.error + '40', backgroundColor: COLORS.errorLight },
  logoutText: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.error },
});
