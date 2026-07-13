import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useAppSelector, useAppDispatch } from '@/store';
import { setBusiness } from '@/store/slices/businessSlice';
import { updateProfile } from '@/store/slices/authSlice';
import { MenuButton, NotifButton } from '@/components/DrawerMenu';
import api from '@/lib/api';
import { formatCurrency, formatTime } from '@/lib/utils';
import type { DashboardStats, Business } from '@/types';

const { width } = Dimensions.get('window');

const EMPTY_STATS: DashboardStats = {
  todayAppointments: 0, todayCompleted: 0, todayCancelled: 0, todayPending: 0,
  todayRevenue: 0, monthAppointments: 0, monthRevenue: 0, occupancyRate: 0,
  totalCustomers: 0, todayAppointmentList: [], weeklyStats: [], monthlyStats: [],
};

const statusMap: Record<string, { label: string; variant: any }> = {
  pending:   { label: 'Beklemede', variant: 'pending' },
  confirmed: { label: 'Onaylandı', variant: 'confirmed' },
  cancelled: { label: 'İptal',     variant: 'cancelled' },
  completed: { label: 'Tamamlandı',variant: 'completed' },
  no_show:   { label: 'Gelmedi',   variant: 'no_show' },
};

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
] as const;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const auth = useAppSelector((s) => s.auth);
  const business = useAppSelector((s) => s.business.business);
  const { data, isLoading, refetch } = useDashboard();
  const bizQuery = useBusiness();
  useUserProfile();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log('[Dashboard] auth fullName:', auth.fullName, 'avatarUrl:', auth.avatarUrl);
  }, [auth]);

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
  const maxCount = Math.max(...stats.weeklyStats.map((d) => d.appointments), 1);

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
              <Text style={styles.greeting}>İyi günler</Text>
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

        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          <StatCard
            label="Bugünkü Randevular"
            value={isLoading ? '…' : stats.todayAppointments}
            icon={<Ionicons name="calendar-outline" size={18} color={COLORS.info} />}
            trend={{ value: 12, positive: true }}
            accent
            style={styles.kpiFull}
          />
          <View style={styles.kpiRow}>
            <StatCard
              label="Bekleyen"
              value={isLoading ? '…' : stats.todayPending}
              icon={<Ionicons name="time-outline" size={16} color={COLORS.warning} />}
              style={styles.kpiHalf}
            />
            <StatCard
              label="Müşteriler"
              value={isLoading ? '…' : stats.totalCustomers}
              icon={<Ionicons name="people-outline" size={16} color={COLORS.success} />}
              style={styles.kpiHalf}
            />
          </View>
          <StatCard
            label="Bugünkü Gelir"
            value={isLoading ? '…' : formatCurrency(stats.todayRevenue)}
            icon={<Ionicons name="trending-up-outline" size={16} color={COLORS.success} />}
            style={styles.kpiFull}
          />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
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

        {/* Weekly Bar Chart */}
        <Card style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Haftalık Randevular</Text>
          <View style={styles.barChart}>
            {stats.weeklyStats.map((d) => {
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
        </Card>

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

const styles = StyleSheet.create({
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
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },

  kpiGrid: { gap: SPACE[3] },
  kpiFull: { width: '100%' },
  kpiRow: { flexDirection: 'row', gap: SPACE[3] },
  kpiHalf: { flex: 1 },

  chartCard: { padding: SPACE[4], gap: SPACE[4] },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 8 },
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

  section: { gap: SPACE[3] },
  sectionTitle: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seeAll: { fontSize: FONT.sm, color: COLORS.primaryDark, fontWeight: FONT.semibold },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[3] },
  quickItem: {
    width: (width - SPACE[5] * 2 - SPACE[3] * 3) / 4,
    alignItems: 'center',
    gap: SPACE[2],
  },
  quickIcon: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: FONT.medium,
    textAlign: 'center',
  },

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

  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  statusText: { fontSize: FONT.sm, color: COLORS.textSecondary, fontWeight: FONT.medium },
});

