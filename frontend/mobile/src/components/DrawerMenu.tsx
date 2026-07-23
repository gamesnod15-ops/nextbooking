import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, ScrollView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { COLORS, FONT, RADIUS, SPACE } from '@/lib/theme';
import { useAppDispatch } from '@/store';
import { logout as logoutAction } from '@/store/slices/authSlice';
import { clearBusiness } from '@/store/slices/businessSlice';

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

const MENU_SECTIONS: MenuSection[] = [
  {
    title: 'Yönetim',
    items: [
      { id: 'services', label: 'Hizmetler', icon: 'cut-outline', route: '/(pages)/services', color: '#6097F3' },
      { id: 'packages', label: 'Paketler', icon: 'cube-outline', route: '/(pages)/packages', color: COLORS.primary },
      { id: 'employees', label: 'Çalışanlar', icon: 'people-circle-outline', route: '/(pages)/employees', color: '#22C55E' },
      { id: 'branches', label: 'Şubeler', icon: 'business-outline', route: '/(pages)/branches', color: '#A1B6DC' },
      { id: 'walkin-queue', label: 'Sıra Yönetimi', icon: 'list-outline', route: '/(pages)/walkin-queue', color: '#7788A5' },
      { id: 'waiting-list', label: 'Bekleme Listesi', icon: 'time-outline', route: '/(pages)/waiting-list', color: '#6097F3' },
    ],
  },
  {
    title: 'Finans & Pazarlama',
    items: [
      { id: 'payments', label: 'Ödemeler', icon: 'card-outline', route: '/(pages)/payments', color: '#22C55E' },
      { id: 'campaigns', label: 'Kampanyalar', icon: 'pricetag-outline', route: '/(pages)/campaigns', color: '#A1B6DC' },
      { id: 'gift-coupons', label: 'Hediye Kuponlar', icon: 'gift-outline', route: '/(pages)/gift-coupons', color: '#6097F3' },
      { id: 'discounts', label: 'İndirimler', icon: 'calculator-outline', route: '/(pages)/discounts', color: '#7788A5' },
      { id: 'products', label: 'Ürün & Stok', icon: 'storefront-outline', route: '/(pages)/products', color: '#6097F3' },
      { id: 'receivables', label: 'Cari Alacaklar', icon: 'receipt-outline', route: '/(pages)/receivables', color: '#8E9BB2' },
      { id: 'commissions', label: 'Prim & Hak Ediş', icon: 'ribbon-outline', route: '/(pages)/commissions', color: '#6097F3' },
      { id: 'debts', label: 'Borç Takibi', icon: 'alert-circle-outline', route: '/(pages)/debts', color: '#7788A5' },
      { id: 'advertisements', label: 'Reklam Yönetimi', icon: 'megaphone-outline', route: '/(pages)/advertisements', color: '#A1B6DC' },
    ],
  },
  {
    title: 'Müşteri Araçları',
    items: [
      { id: 'loyalty', label: 'Sadakat Programı', icon: 'star-outline', route: '/(pages)/loyalty', color: '#A1B6DC' },
      { id: 'surveys', label: 'Anket & Feedback', icon: 'clipboard-outline', route: '/(pages)/surveys', color: '#6097F3' },
      { id: 'forms', label: 'Formlar', icon: 'document-text-outline', route: '/(pages)/forms', color: COLORS.primary },
      { id: 'reviews', label: 'Değerlendirmeler', icon: 'star-outline', route: '/(pages)/reviews', color: '#8E9BB2' },
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
      { id: 'social-media', label: 'Sosyal Medya', icon: 'share-social-outline', route: '/(pages)/social-media', color: '#6097F3' },
      { id: 'chatbot', label: 'Chatbot', icon: 'chatbubbles-outline', route: '/(pages)/chatbot', color: '#7788A5' },
      { id: 'maps', label: 'Harita & Konum', icon: 'map-outline', route: '/(pages)/maps', color: '#8E9BB2' },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { id: 'notifications', label: 'Bildirimler', icon: 'notifications-outline', route: '/(pages)/notifications', color: COLORS.primaryDark },
      { id: 'plugins', label: 'Eklentiler', icon: 'extension-puzzle-outline', route: '/(pages)/plugins', color: '#6097F3' },
      { id: 'subscription', label: 'Abonelik', icon: 'diamond-outline', route: '/(pages)/subscription', color: '#A1B6DC' },
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
  const dispatch = useAppDispatch();
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
      <Animated.View style={[styles.drawer, { transform: [{ translateX }], paddingTop: insets.top + 50 }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {MENU_SECTIONS.map((section) => {
            const isOpen_ = openSections[section.title];
            return (
              <View key={section.title}>
                <TouchableOpacity style={styles.sectionHeader} activeOpacity={0.7} onPress={() => toggleSection(section.title)}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Ionicons name={isOpen_ ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
                {isOpen_ && section.items.map((item) => (
                  <TouchableOpacity key={item.id} style={styles.menuItem} activeOpacity={0.7} onPress={() => navigate(item.route)}>
                    <View style={[styles.menuIconBox, { backgroundColor: (item.color ?? COLORS.primaryDark) + '18' }]}>
                      <Ionicons name={item.icon} size={20} color={item.color ?? COLORS.primaryDark} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
        </ScrollView>
        <TouchableOpacity
          style={[styles.logoutBtn, { paddingBottom: insets.bottom + 20 }]}
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
          <Ionicons name="log-out-outline" size={20} color={COLORS.textSecondary} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export function MenuButton({ showBadge = true }: { showBadge?: boolean }) {
  const { openDrawer } = useDrawer();
  return (
    <TouchableOpacity style={styles.menuBtn} onPress={openDrawer} activeOpacity={0.7}>
      <Ionicons name="menu-outline" size={24} color={COLORS.text} />
      {showBadge && <View style={styles.menuDot} />}
    </TouchableOpacity>
  );
}

export function NotifButton() {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.menuBtn} activeOpacity={0.7} onPress={() => router.push('/notifications' as any)}>
      <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
      <View style={styles.notifDot} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACE[5],
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
    paddingVertical: 12,
    paddingHorizontal: SPACE[2],
    borderRadius: RADIUS.lg,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: FONT.base,
    color: COLORS.text,
    fontWeight: FONT.medium,
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
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    paddingVertical: 14,
    paddingHorizontal: SPACE[2],
    marginHorizontal: SPACE[2],
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  logoutText: {
    fontSize: FONT.base,
    fontWeight: FONT.semibold,
    color: COLORS.textSecondary,
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
