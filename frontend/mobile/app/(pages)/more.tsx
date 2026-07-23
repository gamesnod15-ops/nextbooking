import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { useAppSelector, useAppDispatch } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { Avatar } from '@/components/ui/Avatar';
import * as SecureStore from 'expo-secure-store';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  label: string;
  icon: IoniconsName;
  route: string;
  badge?: string;
  color?: string;
}

const MENU_SECTIONS: MenuSection[] = [
  {
    title: 'Yönetim',
    items: [
      { id: 'services', label: 'Hizmetler', icon: 'cut-outline', route: '/(pages)/services', color: '#8B5CF6' },
      { id: 'packages', label: 'Paketler', icon: 'cube-outline', route: '/(pages)/packages', color: COLORS.primary },
      { id: 'employees', label: 'Çalışanlar', icon: 'people-circle-outline', route: '/(pages)/employees', color: '#10B981' },
      { id: 'branches', label: 'Şubeler', icon: 'business-outline', route: '/(pages)/branches', color: '#F59E0B' },
      { id: 'walkin-queue', label: 'Sıra Yönetimi', icon: 'list-outline', route: '/(pages)/walkin-queue', color: '#06B6D4' },
      { id: 'waiting-list', label: 'Bekleme Listesi', icon: 'time-outline', route: '/(pages)/waiting-list', color: '#8B5CF6' },
    ],
  },
  {
    title: 'Finans & Pazarlama',
    items: [
      { id: 'payments', label: 'Ödemeler', icon: 'card-outline', route: '/(pages)/payments', color: '#10B981' },
      { id: 'campaigns', label: 'Kampanyalar', icon: 'pricetag-outline', route: '/(pages)/campaigns', color: '#F59E0B' },
      { id: 'gift-coupons', label: 'Hediye Kuponlar', icon: 'gift-outline', route: '/(pages)/gift-coupons', color: '#6097F3' },
      { id: 'discounts', label: 'İndirimler', icon: 'calculator-outline', route: '/(pages)/discounts', color: '#F97316' },
      { id: 'products', label: 'Ürün & Stok', icon: 'storefront-outline', route: '/(pages)/products', color: '#6366F1' },
      { id: 'receivables', label: 'Cari Alacaklar', icon: 'receipt-outline', route: '/(pages)/receivables', color: '#0EA5E9' },
      { id: 'commissions', label: 'Prim & Hak Ediş', icon: 'ribbon-outline', route: '/(pages)/commissions', color: '#6097F3' },
      { id: 'debts', label: 'Borç Takibi', icon: 'alert-circle-outline', route: '/(pages)/debts', color: '#7788A5' },
      { id: 'advertisements', label: 'Reklam Yönetimi', icon: 'megaphone-outline', route: '/(pages)/advertisements', color: '#F59E0B' },
    ],
  },
  {
    title: 'Müşteri Araçları',
    items: [
      { id: 'loyalty', label: 'Sadakat Programı', icon: 'star-outline', route: '/(pages)/loyalty', color: '#F59E0B' },
      { id: 'surveys', label: 'Anket & Feedback', icon: 'clipboard-outline', route: '/(pages)/surveys', color: '#8B5CF6' },
      { id: 'forms', label: 'Formlar', icon: 'document-text-outline', route: '/(pages)/forms', color: COLORS.primary },
      { id: 'reviews', label: 'Değerlendirmeler', icon: 'star-outline', route: '/(pages)/reviews', color: '#F59E0B' },
    ],
  },
  {
    title: 'Analitik',
    items: [
      { id: 'reports', label: 'Raporlar', icon: 'bar-chart-outline', route: '/(pages)/reports', color: COLORS.primary },
      { id: 'performance', label: 'Personel Performansı', icon: 'trending-up-outline', route: '/(pages)/performance', color: '#10B981' },
    ],
  },
  {
    title: 'İletişim & Sosyal',
    items: [
      { id: 'whatsapp-bot', label: 'WhatsApp Bot', icon: 'logo-whatsapp', route: '/(pages)/whatsapp-bot', color: '#25D366' },
      { id: 'social-media', label: 'Sosyal Medya', icon: 'share-social-outline', route: '/(pages)/social-media', color: '#6097F3' },
      { id: 'chatbot', label: 'Chatbot', icon: 'chatbubbles-outline', route: '/(pages)/chatbot', color: '#6366F1' },
      { id: 'maps', label: 'Harita & Konum', icon: 'map-outline', route: '/(pages)/maps', color: '#8E9BB2' },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { id: 'notifications', label: 'Bildirimler', icon: 'notifications-outline', route: '/(pages)/notifications', badge: '3', color: COLORS.primaryDark },
      { id: 'plugins', label: 'Eklentiler', icon: 'extension-puzzle-outline', route: '/(pages)/plugins', color: '#6366F1' },
      { id: 'subscription', label: 'Abonelik', icon: 'diamond-outline', route: '/(pages)/subscription', color: '#A1B6DC' },
      { id: 'settings', label: 'Ayarlar', icon: 'settings-outline', route: '/(pages)/settings', color: COLORS.textSecondary },
    ],
  },
];

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((s) => s.auth);
  const business = useAppSelector((s) => s.business.business);

  async function handleLogout() {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('auth_data');
    dispatch(logout());
    router.replace('/');
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Profile Header */}
        <LinearGradient colors={[COLORS.primaryDark, '#08224B']} style={styles.profileHeader}>
          <View style={styles.profileRow}>
            <Avatar name={auth.fullName ?? 'İşletme'} size={56} />
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{auth.fullName ?? 'İşletme'}</Text>
              <Text style={styles.profileEmail}>{auth.email ?? ''}</Text>
              {business && (
                <View style={styles.businessChip}>
                  <Ionicons name="business-outline" size={12} color={COLORS.primary} />
                  <Text style={styles.businessName}>{business.name}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              activeOpacity={0.8}
              onPress={() => router.push('/(pages)/settings' as any)}
            >
              <Ionicons name="pencil-outline" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Menu Sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.grid}>
              {section.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  activeOpacity={0.8}
                  onPress={() => router.push(item.route as any)}
                >
                  <View style={[styles.menuIcon, { backgroundColor: (item.color ?? COLORS.primaryDark) + '18' }]}>
                    <Ionicons name={item.icon} size={22} color={item.color ?? COLORS.primaryDark} />
                    {item.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.menuLabel} numberOfLines={2}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  profileHeader: {
    padding: SPACE[5],
    marginBottom: SPACE[3],
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[4],
  },
  profileName: {
    fontSize: FONT.lg,
    fontWeight: FONT.bold,
    color: COLORS.white,
  },
  profileEmail: {
    fontSize: FONT.xs,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  businessChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACE[2],
    backgroundColor: 'rgba(207,242,30,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  businessName: {
    fontSize: 11,
    fontWeight: FONT.semibold,
    color: COLORS.primary,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(207,242,30,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(207,242,30,0.2)',
  },

  section: {
    marginBottom: SPACE[4],
    paddingHorizontal: SPACE[5],
  },
  sectionTitle: {
    fontSize: FONT.xs,
    fontWeight: FONT.bold,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACE[3],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE[3],
  },
  menuItem: {
    width: '22%',
    alignItems: 'center',
    gap: SPACE[2],
  },
  menuIcon: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  menuLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: FONT.medium,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.bg,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: FONT.bold,
    color: COLORS.white,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE[2],
    marginHorizontal: SPACE[5],
    marginVertical: SPACE[5],
    paddingVertical: SPACE[4],
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.errorLight,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: FONT.base,
    fontWeight: FONT.semibold,
    color: COLORS.errorText,
  },
});
