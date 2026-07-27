import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useAppSelector, useAppDispatch } from '@/store';
import { setBusiness } from '@/store/slices/businessSlice';
import { updateProfile } from '@/store/slices/authSlice';
import { MenuButton, NotifButton } from '@/components/DrawerMenu';
import api from '@/lib/api';
import { formatCurrency, formatAppointmentTime as formatTime, formatDate, formatTime as formatRealTime } from '@/lib/utils';
import { isToday, parseISO } from 'date-fns';
import type { DashboardStats, Business, RecentActivity } from '@/types';

const { width } = Dimensions.get('window');

const HERO_CALENDAR_IMG = require('../../assets/images/dashboard/hero-calendar.png');
const PROMO_PHONE_IMG = require('../../assets/images/dashboard/promo-phone.png');
const PLUS_3D_IMG = require('../../assets/images/dashboard/plus-3d.png');
const PROFILE_3D_IMG = require('../../assets/images/dashboard/profile-3d.png');
const STARS_3D_IMG = require('../../assets/images/dashboard/stars-3d.png');

const EMPTY_STATS: DashboardStats = {
  todayAppointments: 0, todayCompleted: 0, todayCancelled: 0, todayPending: 0,
  todayRevenue: 0, monthAppointments: 0, monthRevenue: 0, occupancyRate: 0,
  totalCustomers: 0, monthAppointmentsTrendPercent: 0,
  todayAppointmentList: [], weeklyStats: [], monthlyStats: [], recentActivities: [],
};

const statusMap: Record<string, { label: string; variant: any }> = {
  pending:   { label: 'Beklemede', variant: 'pending' },
  confirmed: { label: 'Onaylandı', variant: 'confirmed' },
  cancelled: { label: 'İptal',     variant: 'cancelled' },
  completed: { label: 'Tamamlandı',variant: 'completed' },
  no_show:   { label: 'Gelmedi',   variant: 'no_show' },
};

const ACTIVITY_ICON: Record<RecentActivity['type'], { icon: keyof typeof Ionicons.glyphMap; bg: string; color: string }> = {
  appointmentCreated: { icon: 'checkmark', bg: '#DCFCE7', color: '#166534' },
  appointmentCancelled: { icon: 'close', bg: '#FEE2E2', color: '#991B1B' },
  customerAdded: { icon: 'person', bg: '#E0E7FF', color: '#4338CA' },
};

const TIPS = [
  { title: 'Boş zamanlarınızı daha verimli kullanın!', text: 'Takviminizdeki boşlukları doldurarak gelirlerinizi artırabilirsiniz.' },
  { title: 'Müşterilerinizi hatırlatmalarla elde tutun!', text: 'Randevu hatırlatmaları müşteri kaybını azaltır.' },
  { title: 'Kampanyalarla gelirinizi artırın!', text: 'Sadık müşterilerinize özel indirimler sunabilirsiniz.' },
];

function useDashboard() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data;
    },
    staleTime: 1000 * 60,
  });
}

function useBusiness() {
  const dispatch = useAppDispatch();
  const business = useAppSelector((s) => s.business.business);

  return useQuery<Business>({
    queryKey: ['business-profile'],
    queryFn: async () => {
      const res = await api.get('/business/me');
      const data = res.data as Business;
      dispatch(setBusiness(data));
      return data;
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: !business,
  });
}

function useUserProfile() {
  const dispatch = useAppDispatch();
  const avatarUrl = useAppSelector((s) => s.auth.avatarUrl);

  return useQuery<any>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      const data = res.data;
      if (data.avatarUrl) {
        dispatch(updateProfile({ avatarUrl: data.avatarUrl }));
      }
      return data;
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: !avatarUrl,
  });
}

const quickActions = [
  { icon: 'gift-outline', label: 'Paketler', route: '/(pages)/packages', color: '#F3E8FF', iconColor: '#9333EA' },
  { icon: 'cube-outline', label: 'Ürünler', route: '/(pages)/products', color: '#FCE7F3', iconColor: '#DB2777' },
  { icon: 'people-outline', label: 'Personel', route: '/(pages)/employees', color: '#FFF7ED', iconColor: '#EA580C' },
  { icon: 'megaphone-outline', label: 'Kampanyalar', route: '/(pages)/campaigns', color: '#ECFDF5', iconColor: '#059669' },
  { icon: 'chatbubbles-outline', label: 'Mesajlar', route: '/(pages)/whatsapp-bot', color: '#EFF6FF', iconColor: '#2563EB' },
] as const;

function activityTime(iso: string) {
  const d = parseISO(iso);
  return isToday(d) ? formatRealTime(iso) : formatDate(iso);
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const auth = useAppSelector((s) => s.auth);
  const business = useAppSelector((s) => s.business.business);
  const { data, isLoading, refetch } = useDashboard();
  useBusiness();
  useUserProfile();
  const [refreshing, setRefreshing] = useState(false);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Günaydın';
    if (h < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const stats = data ?? EMPTY_STATS;
  const weeklyStats = stats.weeklyStats ?? [];
  const maxCount = weeklyStats.length > 0 ? Math.max(...weeklyStats.map((d) => d.appointments), 1) : 1;
  const weekTotals = useMemo(() => weeklyStats.reduce(
    (acc, d) => ({
      total: acc.total + d.appointments,
      completed: acc.completed + d.completed,
      cancelled: acc.cancelled + d.cancelled,
      pending: acc.pending + d.pending,
    }),
    { total: 0, completed: 0, cancelled: 0, pending: 0 }
  ), [weeklyStats]);

  const trend = stats.monthAppointmentsTrendPercent;
  const tip = TIPS[new Date().getDate() % TIPS.length];

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACE[4], paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Avatar
              name={auth.fullName ?? 'İşletme'}
              size={48}
              url={auth.avatarUrl ?? ''}
            />
            <View>
              <Text style={styles.greeting}>{greeting()}</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {auth.fullName ?? business?.name ?? 'İşletme'}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <NotifButton />
            <MenuButton />
          </View>
        </View>

        {/* Hero: today's appointments */}
        <LinearGradient colors={[COLORS.primaryDark, '#08224B']} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.heroBlobOne} />
          <View style={styles.heroBlobTwo} />
          <TouchableOpacity style={styles.heroCalBtn} onPress={() => router.push('/(pages)/calendar' as any)} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Takvim">
            <Ionicons name="calendar-outline" size={18} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.heroLabel}>BUGÜNKÜ RANDEVULAR</Text>
          <Text style={styles.heroValue}>{isLoading ? '…' : stats.todayAppointments}</Text>
          <View style={[styles.trendPill, { backgroundColor: trend >= 0 ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)' }]}>
            <Ionicons name={trend >= 0 ? 'arrow-up' : 'arrow-down'} size={12} color={trend >= 0 ? '#86EFAC' : '#FCA5A5'} />
            <Text style={[styles.trendPillText, { color: trend >= 0 ? '#86EFAC' : '#FCA5A5' }]}>{Math.abs(trend)}% bu ay</Text>
          </View>
          <View style={styles.heroIllustration}>
            <Image source={HERO_CALENDAR_IMG} style={styles.heroCalendarImg} resizeMode="contain" />
          </View>
        </LinearGradient>

        {/* 3-up stat row */}
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="time-outline" size={20} color="#2563EB" />
            </View>
            <Text style={styles.statValue}>{isLoading ? '…' : stats.todayPending}</Text>
            <Text style={styles.statLabel}>Randevu</Text>
            <Text style={styles.statLabelBold}>Bekleyen</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="people-outline" size={20} color="#16A34A" />
            </View>
            <Text style={styles.statValue}>{isLoading ? '…' : stats.totalCustomers}</Text>
            <Text style={styles.statLabel}>Toplam</Text>
            <Text style={styles.statLabelBold}>Müşteriler</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="trending-up-outline" size={20} color="#9333EA" />
            </View>
            <Text style={styles.statValue}>{isLoading ? '…' : formatCurrency(stats.todayRevenue)}</Text>
            <Text style={styles.statLabel}>Toplam</Text>
            <Text style={styles.statLabelBold}>Bugünkü Gelir</Text>
          </View>
        </View>

        {/* Promo card */}
        <View style={styles.promoCard}>
          <View style={styles.promoBlob} />
          <Image source={STARS_3D_IMG} style={styles.promoStars} resizeMode="contain" />
          <View style={styles.promoBadge}>
            <Ionicons name="sparkles" size={11} color={COLORS.white} />
            <Text style={styles.promoBadgeText}>Yeni Özellik</Text>
          </View>
          <Text style={styles.promoTitle}>Randevularınızı{'\n'}daha kolay yönetin</Text>
          <Text style={styles.promoText}>Hızlı randevu oluşturun, müşterilerinizle iletişime geçin ve işlerinizi büyütün.</Text>
          <TouchableOpacity style={styles.promoLink} onPress={() => router.push('/(business)/appointments')} activeOpacity={0.7}>
            <Text style={styles.promoLinkText}>Keşfet</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.promoIllustration}>
            <Image source={PROMO_PHONE_IMG} style={styles.promoPhoneImg} resizeMode="contain" />
            <Image source={PROFILE_3D_IMG} style={styles.promoProfileBadge} resizeMode="contain" />
          </View>
          <TouchableOpacity style={styles.promoFab} onPress={() => router.push('/(business)/appointments')} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Yeni randevu oluştur">
            <Image source={PLUS_3D_IMG} style={styles.promoFabImg} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          <TouchableOpacity onPress={() => router.push('/(pages)/more' as any)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={styles.seeAll}>Tümünü Gör</Text>
              <Ionicons name="chevron-forward" size={13} color={COLORS.primaryDark} />
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.quickGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.label} style={styles.quickItem} activeOpacity={0.7} onPress={() => router.push(action.route as any)}>
              <View style={[styles.quickIcon, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon} size={22} color={action.iconColor} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weekly Bar Chart + summary */}
        <Card style={styles.chartCard}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Haftalık Randevular</Text>
            <TouchableOpacity style={styles.weekPill} activeOpacity={0.7}>
              <Text style={styles.weekPillText}>Bu Hafta</Text>
              <Ionicons name="chevron-down" size={13} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.chartRow}>
            <View style={styles.barChart}>
              {weeklyStats.map((d) => {
                const pct = d.appointments / maxCount;
                return (
                  <View key={d.day} style={styles.barCol}>
                    <Text style={styles.barValue}>{d.appointments}</Text>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { height: `${Math.max(pct * 100, 4)}%`, backgroundColor: pct > 0.7 ? COLORS.primary : COLORS.primaryLight }]} />
                    </View>
                    <Text style={styles.barLabel}>{d.day}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.weekSummary}>
              <View style={styles.weekSummaryRow}>
                <Ionicons name="calendar-outline" size={13} color={COLORS.primary} />
                <Text style={styles.weekSummaryLabel}>Toplam</Text>
                <Text style={styles.weekSummaryValue}>{weekTotals.total}</Text>
              </View>
              <View style={styles.weekSummaryRow}>
                <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
                <Text style={styles.weekSummaryLabel}>Tamamlanan</Text>
                <Text style={styles.weekSummaryValue}>{weekTotals.completed}</Text>
              </View>
              <View style={styles.weekSummaryRow}>
                <Ionicons name="close-circle" size={13} color={COLORS.error} />
                <Text style={styles.weekSummaryLabel}>İptal Edilen</Text>
                <Text style={styles.weekSummaryValue}>{weekTotals.cancelled}</Text>
              </View>
              <View style={styles.weekSummaryRow}>
                <Ionicons name="time-outline" size={13} color={COLORS.warning} />
                <Text style={styles.weekSummaryLabel}>Bekleyen</Text>
                <Text style={styles.weekSummaryValue}>{weekTotals.pending}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Recent Activity + Tip */}
        <View style={styles.twoCol}>
          <View style={styles.activityCard}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Son Aktiviteler</Text>
            </View>
            {stats.recentActivities.length === 0 ? (
              <Text style={styles.activityEmpty}>Henüz aktivite yok</Text>
            ) : (
              stats.recentActivities.map((act, idx) => {
                const meta = ACTIVITY_ICON[act.type] ?? ACTIVITY_ICON.customerAdded;
                return (
                  <View key={idx} style={styles.activityRow}>
                    <View style={[styles.activityIcon, { backgroundColor: meta.bg }]}>
                      <Ionicons name={meta.icon} size={14} color={meta.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.activityTitle}>{act.title}</Text>
                      <Text style={styles.activitySub}>{act.subtitle}</Text>
                    </View>
                    <Text style={styles.activityTime}>{activityTime(act.occurredAt)}</Text>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.tipCard}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>İpucu</Text>
            </View>
            <View style={styles.tipInner}>
              <View style={styles.tipIconWrap}>
                <Ionicons name="bulb-outline" size={20} color={COLORS.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipText}>{tip.text}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Today's Appointments */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Bugünkü Randevular</Text>
          <TouchableOpacity onPress={() => router.push('/(business)/appointments')}>
            <Text style={styles.seeAll}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>
        {stats.todayAppointmentList.length === 0 ? (
          <View style={{ backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[6], alignItems: 'center', gap: SPACE[2], borderWidth: 1, borderColor: COLORS.borderLight }}>
            <Ionicons name="calendar-outline" size={36} color={COLORS.textMuted} />
            <Text style={{ fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.textMuted }}>Bugün randevu yok</Text>
            <Text style={{ fontSize: FONT.xs, color: COLORS.textMuted, textAlign: 'center' }}>Yeni bir randevu oluşturmak için yukarıdaki butonu kullanın.</Text>
          </View>
        ) : (
          stats.todayAppointmentList.map((appt) => (
            <TouchableOpacity key={appt.id} style={styles.aptCard} activeOpacity={0.7}>
              <View style={styles.aptTop}>
                <View style={styles.aptTimeRow}>
                  <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.aptTime}>{formatTime(appt.startTime)} – {formatTime(appt.endTime)}</Text>
                </View>
                <Badge variant={statusMap[appt.status]?.variant ?? 'default'} size="sm">{statusMap[appt.status]?.label ?? appt.status}</Badge>
              </View>
              <View style={styles.aptBody}>
                <Avatar name={appt.customerName} size={40} />
                <View style={styles.aptInfo}>
                  <Text style={styles.aptName}>{appt.customerName}</Text>
                  <Text style={styles.aptService}>{appt.serviceName} · {appt.serviceDurationMinutes}dk</Text>
                  <View style={styles.aptMeta}>
                    <View style={styles.aptMetaItem}>
                      <Ionicons name="person-circle-outline" size={12} color={COLORS.textMuted} />
                      <Text style={styles.aptMetaText}>{appt.employeeName}</Text>
                    </View>
                    <View style={styles.aptMetaItem}>
                      <Ionicons name="cash-outline" size={12} color={COLORS.textMuted} />
                      <Text style={styles.aptMetaText}>{formatCurrency(appt.price)}</Text>
                    </View>
                    <View style={styles.aptMetaItem}>
                      <Ionicons name="call-outline" size={12} color={COLORS.textMuted} />
                      <Text style={styles.aptMetaText}>{appt.customerPhone}</Text>
                    </View>
                  </View>
                </View>
              </View>
              {appt.notes ? (
                <View style={styles.aptNote}>
                  <Ionicons name="document-text-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.aptNoteText}>{appt.notes}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: SPACE[5], gap: SPACE[5] },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
  },
  greeting: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: FONT.medium },
  userName: { fontSize: FONT.lg, fontWeight: FONT.bold, color: COLORS.text, marginTop: 1 },

  hero: {
    borderRadius: RADIUS['2xl'],
    padding: SPACE[5],
    overflow: 'hidden',
    minHeight: 170,
  },
  heroBlobOne: {
    position: 'absolute', top: -40, right: -30, width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroBlobTwo: {
    position: 'absolute', bottom: -60, left: -20, width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  heroCalBtn: {
    position: 'absolute', top: SPACE[4], right: SPACE[4],
    width: 36, height: 36, borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  heroLabel: { fontSize: 11, fontWeight: FONT.bold, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.8 },
  heroValue: { fontSize: 48, fontWeight: FONT.extrabold, color: COLORS.white, marginTop: 4 },
  trendPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    marginTop: SPACE[3], paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full,
  },
  trendPillText: { fontSize: FONT.xs, fontWeight: FONT.bold },
  heroIllustration: {
    position: 'absolute', right: SPACE[3], bottom: SPACE[2],
    alignItems: 'center', justifyContent: 'center',
  },
  heroCalendarImg: { width: 108, height: 108 },

  statRow: { flexDirection: 'row', gap: SPACE[3] },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4],
    alignItems: 'center', gap: 4, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm,
  },
  statIconWrap: { width: 40, height: 40, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statValue: { fontSize: FONT.lg, fontWeight: FONT.extrabold, color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.textMuted },
  statLabelBold: { fontSize: 10, color: COLORS.textSecondary, fontWeight: FONT.semibold, textAlign: 'center' },

  promoCard: {
    backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: RADIUS['2xl'], padding: SPACE[5],
    overflow: 'hidden', gap: 6, minHeight: 200,
  },
  promoBlob: {
    position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(1,84,240,0.06)',
  },
  promoStars: {
    position: 'absolute', top: SPACE[3], right: '38%', width: 60, height: 50,
  },
  promoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: '#7C3AED', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full,
  },
  promoBadgeText: { fontSize: 10, fontWeight: FONT.bold, color: COLORS.white },
  promoTitle: { fontSize: FONT.xl, fontWeight: FONT.extrabold, color: COLORS.text, lineHeight: 26, marginTop: 6, maxWidth: '62%' },
  promoText: { fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 19, maxWidth: '58%' },
  promoLink: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  promoLinkText: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.primary },
  promoIllustration: {
    position: 'absolute', right: SPACE[2], top: '28%',
  },
  promoPhoneImg: { width: 118, height: 118 },
  promoProfileBadge: {
    position: 'absolute', left: -14, top: -8, width: 44, height: 44,
  },
  promoFab: {
    position: 'absolute', right: SPACE[4], bottom: -18,
    width: 52, height: 52, alignItems: 'center', justifyContent: 'center',
  },
  promoFabImg: { width: 52, height: 52 },

  chartCard: { padding: SPACE[4], gap: SPACE[4] },
  weekPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
  },
  weekPillText: { fontSize: FONT.xs, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  chartRow: { flexDirection: 'row', gap: SPACE[3] },
  barChart: { flex: 1.3, flexDirection: 'row', alignItems: 'flex-end', height: 130, gap: 6 },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 4 },
  barValue: { fontSize: 9, color: COLORS.textMuted, fontWeight: FONT.bold },
  barBg: {
    width: '100%',
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: RADIUS.sm,
  },
  barLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: FONT.medium },
  weekSummary: {
    flex: 1, backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.lg, padding: SPACE[3], gap: SPACE[3], justifyContent: 'center',
  },
  weekSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weekSummaryLabel: { flex: 1, fontSize: FONT.xs, color: COLORS.textSecondary },
  weekSummaryValue: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.text },

  section: { gap: SPACE[3] },
  sectionTitle: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seeAll: { fontSize: FONT.sm, color: COLORS.primaryDark, fontWeight: FONT.semibold },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[3] },
  quickItem: {
    width: (width - SPACE[5] * 2 - SPACE[3] * 4) / 5,
    alignItems: 'center',
    gap: SPACE[2],
  },
  quickIcon: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
    fontWeight: FONT.medium,
    textAlign: 'center',
  },

  twoCol: { gap: SPACE[3] },
  activityCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3],
    borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm,
  },
  activityEmpty: { fontSize: FONT.sm, color: COLORS.textMuted, textAlign: 'center', paddingVertical: SPACE[3] },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  activityIcon: { width: 32, height: 32, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  activityTitle: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  activitySub: { fontSize: FONT.xs, color: COLORS.textMuted, marginTop: 1 },
  activityTime: { fontSize: FONT.xs, color: COLORS.textMuted },

  tipCard: {
    backgroundColor: '#ECFDF5', borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3],
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  tipInner: { flexDirection: 'row', gap: SPACE[3], alignItems: 'flex-start' },
  tipIconWrap: {
    width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  tipTitle: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.text },
  tipText: { fontSize: FONT.xs, color: COLORS.textSecondary, marginTop: 2, lineHeight: 17 },

  aptCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: RADIUS.xl,
    padding: SPACE[4],
    gap: SPACE[3],
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  aptTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aptTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aptTime: {
    fontSize: FONT.sm,
    fontWeight: FONT.semibold,
    color: COLORS.text,
  },
  aptBody: {
    flexDirection: 'row',
    gap: SPACE[3],
  },
  aptInfo: { flex: 1, gap: 4 },
  aptName: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.text },
  aptService: { fontSize: FONT.xs, color: COLORS.textSecondary, fontWeight: FONT.medium },
  aptMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE[3],
    marginTop: 2,
  },
  aptMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  aptMetaText: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
  },
  aptNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    backgroundColor: '#D1FAE5',
    borderRadius: RADIUS.md,
    padding: SPACE[2],
  },
  aptNoteText: {
    fontSize: FONT.xs,
    color: COLORS.textSecondary,
    flex: 1,
  },
});
