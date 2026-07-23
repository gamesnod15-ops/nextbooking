import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import * as SecureStore from 'expo-secure-store';
import { logout } from '@/store/slices/authSlice';
import type { RootState } from '@/store';
import api from '@/lib/api';

const MOCK_STATS = [
  { label: 'Toplam Randevu', value: 24 },
  { label: 'Tamamlanan', value: 21 },
  { label: 'Favori Salon', value: 3 },
];

const LOYALTY = { tier: 'gold', points: 310, nextTier: 500, tierLabel: 'Altın' };

const MOCK_PROFILE = { fullName: 'Kullanıcı', email: 'kullanici@email.com', phone: '+90 5XX XXX XX XX' };

const MENU_ITEMS = [
  { icon: 'calendar-outline', label: 'Geçmiş Randevular', section: 'history' },
  { icon: 'star-outline', label: 'Yorumlarım', section: 'reviews' },
  { icon: 'gift-outline', label: 'Hediye Kuponlarım', section: 'coupons' },
  { icon: 'notifications-outline', label: 'Bildirimler', section: 'notifications' },
  { icon: 'lock-closed-outline', label: 'Gizlilik', section: 'privacy' },
  { icon: 'help-circle-outline', label: 'Destek', section: 'support' },
];

export default function CustomerProfileScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  const [notifs, setNotifs] = useState(true);
  const { data: profile = MOCK_PROFILE } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => { const res = await api.get('/users/me'); return res.data; },
    placeholderData: MOCK_PROFILE,
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profilim</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Avatar name={auth.fullName ?? 'Kullanıcı'} size={72} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{auth.fullName ?? 'Kullanıcı'}</Text>
            <Text style={styles.profileEmail}>{auth.email ?? 'kullanici@email.com'}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="pencil" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {MOCK_STATS.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Loyalty */}
        <View style={styles.loyaltyCard}>
          <View style={styles.loyaltyLeft}>
            <Text style={styles.loyaltyEmoji}>🏆</Text>
            <View>
              <Text style={styles.loyaltyTier}>{LOYALTY.tierLabel} Üye</Text>
              <Text style={styles.loyaltyPoints}>{LOYALTY.points} puan</Text>
            </View>
          </View>
          <View style={styles.loyaltyProgress}>
            <View style={styles.loyaltyBar}>
              <View style={[styles.loyaltyFill, { width: `${(LOYALTY.points / LOYALTY.nextTier) * 100}%` }]} />
            </View>
            <Text style={styles.loyaltyNext}>{LOYALTY.nextTier - LOYALTY.points} puan daha → Platin</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {MENU_ITEMS.map((item, idx) => (
            <TouchableOpacity key={item.section} style={[styles.menuItem, idx < MENU_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight }]}>
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
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: SPACE[4], backgroundColor: COLORS.surface, marginHorizontal: SPACE[5], borderRadius: RADIUS.xl, padding: SPACE[5], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: FONT.lg, fontWeight: FONT.bold, color: COLORS.text },
  profileEmail: { fontSize: FONT.xs, color: COLORS.textMuted },
  editBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: SPACE[3], paddingHorizontal: SPACE[5], paddingVertical: SPACE[4] },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], alignItems: 'center', gap: 3, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  statValue: { fontSize: FONT.xl, fontWeight: FONT.extrabold, color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
  loyaltyCard: { flexDirection: 'row', alignItems: 'center', gap: SPACE[4], backgroundColor: '#FEF3C7', marginHorizontal: SPACE[5], marginBottom: SPACE[4], borderRadius: RADIUS.xl, padding: SPACE[5], borderWidth: 1, borderColor: '#FDE68A' },
  loyaltyLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  loyaltyEmoji: { fontSize: 28 },
  loyaltyTier: { fontSize: FONT.base, fontWeight: FONT.bold, color: '#92400E' },
  loyaltyPoints: { fontSize: FONT.xs, color: '#B45309', fontWeight: FONT.medium },
  loyaltyProgress: { flex: 1, gap: 6 },
  loyaltyBar: { height: 6, backgroundColor: '#FDE68A', borderRadius: 3 },
  loyaltyFill: { height: 6, backgroundColor: '#F59E0B', borderRadius: 3 },
  loyaltyNext: { fontSize: 10, color: '#92400E' },
  menu: { marginHorizontal: SPACE[5], backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.borderLight, overflow: 'hidden', ...SHADOW.sm, marginBottom: SPACE[4] },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: SPACE[4], gap: SPACE[3] },
  menuIconBox: { width: 36, height: 36, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: FONT.base, color: COLORS.text },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE[3], marginHorizontal: SPACE[5], borderRadius: RADIUS.xl, padding: SPACE[4], borderWidth: 1, borderColor: COLORS.error + '40', backgroundColor: COLORS.errorLight },
  logoutText: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.error },
});

