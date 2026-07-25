import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { Avatar } from '@/components/ui/Avatar';
import { DotGrid } from '@/components/ui/DotGrid';
import { ProfileEditModal, type ProfileEditValues } from '@/components/ui/ProfileEditModal';
import * as SecureStore from 'expo-secure-store';
import { logout } from '@/store/slices/authSlice';
import type { RootState } from '@/store';
import api from '@/lib/api';
import { getDeviceId } from '@/lib/deviceId';

const GUEST_INFO_KEY = 'guest_customer_info';
const GUEST_PHOTO_KEY = 'guest_profile_photo';

interface GuestInfo {
  ad?: string;
  soyad?: string;
  telefon?: string;
  email?: string;
  sehir?: string;
}

const MENU_ITEMS = [
  { icon: 'calendar-outline', label: 'Geçmiş Randevular', description: 'Tüm randevularınızı görüntüleyin', section: 'history' },
  { icon: 'star-outline', label: 'Yorumlarım', description: 'Yaptığınız yorumları görüntüleyin', section: 'reviews' },
  { icon: 'gift-outline', label: 'Hediye Kuponlarım', description: 'Kuponlarınızı görüntüleyin', section: 'coupons' },
  { icon: 'notifications-outline', label: 'Bildirimler', description: 'Bildirim tercihlerinizi yönetin', section: 'notifications' },
  { icon: 'lock-closed-outline', label: 'Gizlilik', description: 'Hesap gizliliği ve güvenlik ayarları', section: 'privacy' },
  { icon: 'help-circle-outline', label: 'Destek', description: 'Yardım ve destek alın', section: 'support' },
] as const;

export default function CustomerProfileScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const router = useRouter();
  const auth = useSelector((state: RootState) => state.auth);
  const accessToken = auth.accessToken;
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [editVisible, setEditVisible] = useState(false);

  const loadGuestInfo = useCallback(() => {
    SecureStore.getItemAsync(GUEST_INFO_KEY)
      .then((raw) => setGuestInfo(raw ? JSON.parse(raw) : null))
      .catch(() => setGuestInfo(null));
    SecureStore.getItemAsync(GUEST_PHOTO_KEY)
      .then((raw) => setPhotoUri(raw || null))
      .catch(() => setPhotoUri(null));
  }, []);

  async function handleSaveProfile(values: ProfileEditValues, newPhotoUri: string | null) {
    await SecureStore.setItemAsync(GUEST_INFO_KEY, JSON.stringify(values));
    if (newPhotoUri) {
      await SecureStore.setItemAsync(GUEST_PHOTO_KEY, newPhotoUri);
    } else {
      await SecureStore.deleteItemAsync(GUEST_PHOTO_KEY);
    }
    setGuestInfo(values);
    setPhotoUri(newPhotoUri);
  }

  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.data;
    },
    enabled: !!accessToken,
  });

  const { data: appointments = [], refetch: refetchAppointments } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: async () => {
      const deviceId = await getDeviceId();
      const res = await api.get(`/appointments/by-device?deviceId=${deviceId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const { data: favorites = [], refetch: refetchFavorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const deviceId = await getDeviceId();
      const res = await api.get(`/favorites/by-device?deviceId=${deviceId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  useFocusEffect(
    useCallback(() => {
      loadGuestInfo();
      refetchAppointments();
      refetchFavorites();
    }, [loadGuestInfo, refetchAppointments, refetchFavorites])
  );

  const stats = [
    { label: 'Toplam Randevu', value: appointments.length, icon: 'calendar-outline' as const },
    { label: 'Tamamlanan Randevu', value: appointments.filter((a: any) => a.status === 'completed').length, icon: 'checkmark-done-outline' as const },
    { label: 'Favori Salon', value: favorites.length, icon: 'heart-outline' as const },
  ];

  function handleMenuPress(section: string) {
    if (section === 'history') {
      router.push('/(customer)/(tabs)/appointments');
      return;
    }
    if (section === 'reviews') {
      router.push('/(customer)/reviews' as any);
      return;
    }
    if (section === 'coupons') {
      router.push('/(customer)/gift-coupons' as any);
      return;
    }
    if (section === 'notifications') {
      router.push('/(customer)/notifications' as any);
      return;
    }
    if (section === 'privacy') {
      router.push('/(customer)/privacy' as any);
      return;
    }
    if (section === 'support') {
      router.push('/(customer)/support' as any);
      return;
    }
    Alert.alert('Yakında', 'Bu özellik yakında eklenecek.');
  }

  function handleSettingsPress() {
    Alert.alert('Yakında', 'Bu özellik yakında eklenecek.');
  }

  const guestFullName = [guestInfo?.ad, guestInfo?.soyad].filter(Boolean).join(' ');
  const displayName = profile?.fullName || auth.fullName || guestFullName || 'Kullanıcı';
  const displayEmail = profile?.email || auth.email || guestInfo?.email || null;
  const displayPhone = profile?.phone || guestInfo?.telefon || null;
  const displayCity = guestInfo?.sehir || null;
  const hasAnyInfo = !!(displayEmail || displayPhone || guestFullName || accessToken);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.blobBlue} />
      <DotGrid style={styles.dotGridTopRight} rows={5} cols={4} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Profilim</Text>
          <View style={styles.headerUnderline} />
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={handleSettingsPress} activeOpacity={0.8}>
          <Ionicons name="settings-outline" size={20} color={COLORS.primaryDark} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileCardBlob} />
          <TouchableOpacity style={styles.avatarWrap} onPress={() => setEditVisible(true)} activeOpacity={0.8}>
            <Avatar name={displayName} url={photoUri} size={72} />
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={12} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            {hasAnyInfo ? (
              <>
                {displayEmail && <Text style={styles.profileMeta}>{displayEmail}</Text>}
                {displayPhone && <Text style={styles.profileMeta}>{displayPhone}</Text>}
                {displayCity && <Text style={styles.profileMeta}>{displayCity}</Text>}
              </>
            ) : (
              <Text style={styles.profileEmpty}>İlk randevunuzu oluşturduğunuzda bilgileriniz burada görünecek.</Text>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <View style={styles.statIconWrap}>
                <Ionicons name={s.icon} size={18} color={COLORS.primary} />
              </View>
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
                <Ionicons name={item.icon as any} size={18} color={COLORS.primary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout — only relevant if a real account is logged in */}
        {accessToken && (
          <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await SecureStore.deleteItemAsync('access_token'); await SecureStore.deleteItemAsync('auth_data'); dispatch(logout()); }}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ProfileEditModal
        visible={editVisible}
        initialValues={{
          ad: guestInfo?.ad || '',
          soyad: guestInfo?.soyad || '',
          telefon: guestInfo?.telefon || '',
          email: guestInfo?.email || '',
          sehir: guestInfo?.sehir || '',
        }}
        initialPhotoUri={photoUri}
        onClose={() => setEditVisible(false)}
        onSave={handleSaveProfile}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  blobBlue: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#3B82F6',
    opacity: 0.08,
  },
  dotGridTopRight: {
    position: 'absolute',
    top: 24,
    right: 16,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: SPACE[5], paddingVertical: SPACE[4] },
  headerTitle: { fontSize: FONT['2xl'], fontWeight: FONT.extrabold, color: COLORS.text },
  headerUnderline: { width: 44, height: 4, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, marginTop: 6 },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[4],
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACE[5],
    borderRadius: RADIUS.xl,
    padding: SPACE[5],
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  profileCardBlob: {
    position: 'absolute',
    bottom: -40,
    right: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: COLORS.primary,
    opacity: 0.05,
  },
  avatarWrap: { position: 'relative' },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW.sm,
  },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: FONT.lg, fontWeight: FONT.bold, color: COLORS.text },
  profileMeta: { fontSize: FONT.xs, color: COLORS.textMuted },
  profileEmpty: { fontSize: FONT.xs, color: COLORS.textMuted, lineHeight: 16 },
  statsRow: { flexDirection: 'row', gap: SPACE[3], paddingHorizontal: SPACE[5], paddingVertical: SPACE[4] },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], alignItems: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: FONT.xl, fontWeight: FONT.extrabold, color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
  menu: { marginHorizontal: SPACE[5], backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.borderLight, overflow: 'hidden', ...SHADOW.sm, marginBottom: SPACE[4] },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: SPACE[4], gap: SPACE[3] },
  menuIconBox: { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  menuTextWrap: { flex: 1, gap: 2 },
  menuLabel: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  menuDescription: { fontSize: FONT.xs, color: COLORS.textMuted },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE[3], marginHorizontal: SPACE[5], borderRadius: RADIUS.xl, padding: SPACE[4], borderWidth: 1, borderColor: COLORS.error + '40', backgroundColor: COLORS.errorLight },
  logoutText: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.error },
});
