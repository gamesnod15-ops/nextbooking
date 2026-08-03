import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { useQuery } from '@tanstack/react-query';
import { FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout as logoutAction } from '@/store/slices/authSlice';
import { clearBusiness } from '@/store/slices/businessSlice';
import { Avatar } from '@/components/ui/Avatar';
import api from '@/lib/api';
import type { NotificationItem } from '@/types';

const LOGO = require('../../assets/images/logo-jetrandevu.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

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
  color?: string;
}

const getMenuSections = (COLORS: Palette): MenuSection[] => [
  {
    title: 'Yönetim',
    items: [
      { id: 'services', label: 'Hizmetler', icon: 'cut-outline', route: '/(pages)/services', color: '#C9A66B' },
      { id: 'packages', label: 'Paketler', icon: 'cube-outline', route: '/(pages)/packages', color: COLORS.primary },
      { id: 'employees', label: 'Çalışanlar', icon: 'people-circle-outline', route: '/(pages)/employees', color: '#22C55E' },
      { id: 'branches', label: 'Şubeler', icon: 'business-outline', route: '/(pages)/branches', color: '#7C9A82' },
      { id: 'walkin-queue', label: 'Sıra Yönetimi', icon: 'list-outline', route: '/(pages)/walkin-queue', color: '#8F8175' },
      { id: 'waiting-list', label: 'Bekleme Listesi', icon: 'time-outline', route: '/(pages)/waiting-list', color: '#C9A66B' },
    ],
  },
  {
    title: 'Finans & Pazarlama',
    items: [
      { id: 'payments', label: 'Ödemeler', icon: 'card-outline', route: '/(pages)/payments', color: '#22C55E' },
      { id: 'campaigns', label: 'Kampanyalar', icon: 'pricetag-outline', route: '/(pages)/campaigns', color: '#7C9A82' },
      { id: 'gift-coupons', label: 'Hediye Kuponlar', icon: 'gift-outline', route: '/(pages)/gift-coupons', color: '#C9A66B' },
      { id: 'discounts', label: 'İndirimler', icon: 'calculator-outline', route: '/(pages)/discounts', color: '#8F8175' },
      { id: 'products', label: 'Ürün & Stok', icon: 'storefront-outline', route: '/(pages)/products', color: '#C9A66B' },
      { id: 'receivables', label: 'Cari Alacaklar', icon: 'receipt-outline', route: '/(pages)/receivables', color: '#8F8175' },
      { id: 'commissions', label: 'Prim & Hak Ediş', icon: 'ribbon-outline', route: '/(pages)/commissions', color: '#C9A66B' },
      { id: 'debts', label: 'Borç Takibi', icon: 'alert-circle-outline', route: '/(pages)/debts', color: '#8F8175' },
      { id: 'advertisements', label: 'Reklam Yönetimi', icon: 'megaphone-outline', route: '/(pages)/advertisements', color: '#7C9A82' },
    ],
  },
  {
    title: 'Müşteri Araçları',
    items: [
      { id: 'loyalty', label: 'Sadakat Programı', icon: 'star-outline', route: '/(pages)/loyalty', color: '#7C9A82' },
      { id: 'surveys', label: 'Anket & Feedback', icon: 'clipboard-outline', route: '/(pages)/surveys', color: '#C9A66B' },
      { id: 'forms', label: 'Formlar', icon: 'document-text-outline', route: '/(pages)/forms', color: COLORS.primary },
      { id: 'reviews', label: 'Değerlendirmeler', icon: 'star-outline', route: '/(pages)/reviews', color: '#8F8175' },
    ],
  },
  {
    title: 'Analitik',
    items: [
      { id: 'reports', label: 'Raporlar', icon: 'bar-chart-outline', route: '/(pages)/reports', color: COLORS.primary },
      { id: 'performance', label: 'Personel Performansı', icon: 'trending-up-outline', route: '/(pages)/performance', color: '#22C55E' },
    ],
  },
  {
    title: 'İletişim & Sosyal',
    items: [
      { id: 'whatsapp-bot', label: 'WhatsApp Bot', icon: 'logo-whatsapp', route: '/(pages)/whatsapp-bot', color: '#22C55E' },
      { id: 'social-media', label: 'Sosyal Medya', icon: 'share-social-outline', route: '/(pages)/social-media', color: '#C9A66B' },
      { id: 'chatbot', label: 'Chatbot', icon: 'chatbubbles-outline', route: '/(pages)/chatbot', color: '#8F8175' },
      { id: 'maps', label: 'Harita & Konum', icon: 'map-outline', route: '/(pages)/maps', color: '#8F8175' },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { id: 'notifications', label: 'Bildirimler', icon: 'notifications-outline', route: '/(pages)/notifications', color: COLORS.primaryDark },
      { id: 'plugins', label: 'Eklentiler', icon: 'extension-puzzle-outline', route: '/(pages)/plugins', color: '#C9A66B' },
      { id: 'subscription', label: 'Abonelik', icon: 'diamond-outline', route: '/(pages)/subscription', color: '#7C9A82' },
      { id: 'settings', label: 'Ayarlar', icon: 'settings-outline', route: '/(pages)/settings', color: COLORS.textSecondary },
    ],
  },
];

interface DrawerContextType {
  openDrawer: () => void;
  closeDrawer: () => void;
  isOpen: boolean;
}

const DrawerContext = createContext<DrawerContextType>({
  openDrawer: () => {},
  closeDrawer: () => {},
  isOpen: false,
});

export function useDrawer() {
  return useContext(DrawerContext);
}

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const openDrawer = useCallback(() => {
    setIsOpen(true);
    Animated.timing(anim, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [anim]);

  const closeDrawer = useCallback(() => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setIsOpen(false));
  }, [anim]);

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer, isOpen }}>
      {children}
      <DrawerContent anim={anim} isOpen={isOpen} onClose={closeDrawer} />
    </DrawerContext.Provider>
  );
}

function DrawerContent({ anim, isOpen, onClose }: { anim: Animated.Value; isOpen: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((s) => s.auth);
  const business = useAppSelector((s) => s.business.business);
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const MENU_SECTIONS = useMemo(() => getMenuSections(COLORS), [COLORS]);
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const year = new Date().getFullYear();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'Yönetim': true,
    'Finans & Pazarlama': false,
    'Müşteri Araçları': false,
    'Analitik': false,
    'İletişim & Sosyal': false,
    'Sistem': false,
  });

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_WIDTH, 0],
  });

  function toggleSection(title: string) {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  }

  function navigate(route: string) {
    onClose();
    setTimeout(() => router.push(route as any), 250);
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        style={[styles.backdrop, { opacity: anim }]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.drawer, { transform: [{ translateX }], paddingTop: insets.top + SPACE[4] }]}>
        {/* Brand header */}
        <View style={styles.brandBlock}>
          <View style={styles.brandBlob} pointerEvents="none" />
          <Image source={LOGO} style={styles.brandLogo} resizeMode="contain" />
          <TouchableOpacity
            style={styles.profileRow}
            activeOpacity={0.75}
            onPress={() => navigate('/(pages)/settings')}
          >
            <Avatar name={auth.fullName ?? business?.name ?? 'İşletme'} url={auth.avatarUrl ?? ''} size={40} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.profileName} numberOfLines={1}>
                {auth.fullName ?? business?.name ?? 'İşletme'}
              </Text>
              <Text style={styles.profileMeta} numberOfLines={1}>
                {auth.email ?? business?.name ?? 'Hesabımı yönet'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACE[6] }}>
          {MENU_SECTIONS.map((section) => {
            const isOpen_ = openSections[section.title];
            return (
              <View key={section.title}>
                <TouchableOpacity style={styles.sectionHeader} activeOpacity={0.7} onPress={() => toggleSection(section.title)}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Ionicons name={isOpen_ ? 'chevron-up' : 'chevron-down'} size={15} color={COLORS.textMuted} />
                </TouchableOpacity>
                {isOpen_ && section.items.map((item) => {
                  const active = pathname?.includes(`/${item.id}`) ?? false;
                  const tint = item.color ?? COLORS.primary;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.menuItem, active && styles.menuItemActive]}
                      activeOpacity={0.7}
                      onPress={() => navigate(item.route)}
                    >
                      <View style={[styles.menuIconBox, { backgroundColor: tint + '18' }]}>
                        <Ionicons name={item.icon} size={19} color={tint} />
                      </View>
                      <Text style={[styles.menuLabel, active && styles.menuLabelActive]} numberOfLines={1}>
                        {item.label}
                      </Text>
                      {active && <View style={styles.activeBar} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + SPACE[3] }]}>
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.8}
            onPress={async () => {
              onClose();
              await SecureStore.deleteItemAsync('access_token');
              await SecureStore.deleteItemAsync('auth_data');
              dispatch(logoutAction());
              dispatch(clearBusiness());
              router.replace('/');
            }}
          >
            <Ionicons name="log-out-outline" size={19} color={COLORS.error} />
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>

          <View style={styles.legal}>
            <Text style={styles.versionText}>Sürüm {appVersion}</Text>
            <View style={styles.copyrightRow}>
              <Ionicons name="shield-checkmark-outline" size={11} color={COLORS.textMuted} />
              <Text style={styles.copyrightText}>© {year} JetRandevu</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

export function MenuButton({ showBadge = false }: { showBadge?: boolean }) {
  const { openDrawer } = useDrawer();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <TouchableOpacity style={styles.menuBtn} onPress={openDrawer} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Menü">
      <Ionicons name="menu-outline" size={24} color={COLORS.text} />
      {showBadge && <View style={styles.menuDot} />}
    </TouchableOpacity>
  );
}

const READ_IDS_KEY = 'business_notifications_read_ids';

export function NotifButton() {
  const router = useRouter();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { data } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const r = await api.get('/notifications');
      return Array.isArray(r.data) ? r.data : r.data?.items ?? [];
    },
    staleTime: 1000 * 60,
  });
  const unreadCount = useMemo(() => {
    if (!data || data.length === 0) return 0;
    return data.filter((n) => !n.isRead).length;
  }, [data]);
  return (
    <TouchableOpacity style={styles.menuBtn} activeOpacity={0.7} onPress={() => router.push('/notifications' as any)} accessibilityRole="button" accessibilityLabel="Bildirimler">
      <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
      {unreadCount > 0 && <View style={styles.notifDot} />}
    </TouchableOpacity>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: COLORS.overlay,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACE[4],
    borderTopRightRadius: RADIUS['2xl'],
    borderBottomRightRadius: RADIUS['2xl'],
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 24,
    overflow: 'hidden',
  },
  brandBlock: {
    paddingBottom: SPACE[4],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: SPACE[4],
  },
  brandBlob: {
    position: 'absolute',
    top: -80,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.primary,
    opacity: 0.06,
  },
  brandLogo: {
    width: 132,
    height: 30,
    marginLeft: SPACE[1],
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.xl,
    padding: SPACE[3],
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  profileName: {
    fontSize: FONT.sm,
    fontWeight: FONT.bold,
    color: COLORS.text,
  },
  profileMeta: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACE[4],
    marginBottom: SPACE[1],
    paddingHorizontal: SPACE[2],
    paddingVertical: SPACE[2],
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: FONT.bold,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    paddingVertical: 11,
    paddingHorizontal: SPACE[2],
    borderRadius: RADIUS.lg,
    position: 'relative',
  },
  menuItemActive: {
    backgroundColor: COLORS.primaryMuted,
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: FONT.base,
    color: COLORS.text,
    fontWeight: FONT.medium,
  },
  menuLabelActive: {
    color: COLORS.primaryDark,
    fontWeight: FONT.bold,
  },
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  menuDot: {
    position: 'absolute',
    top: 8,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACE[3],
    gap: SPACE[3],
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE[2],
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.errorLight,
    borderWidth: 1,
    borderColor: COLORS.error + '33',
  },
  logoutText: {
    fontSize: FONT.base,
    fontWeight: FONT.bold,
    color: COLORS.error,
  },
  legal: {
    alignItems: 'center',
    gap: 3,
  },
  versionText: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    fontWeight: FONT.medium,
  },
  copyrightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyrightText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});
