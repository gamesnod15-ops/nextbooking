import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StatCard } from '@/components/ui/StatCard';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';

const { width } = Dimensions.get('window');
const PERIODS = ['Bugün', 'Bu Hafta', 'Bu Ay', 'Bu Yıl'];

const STATUS_COLORS: Record<string, string> = {
  'Tamamlandı': '#22C55E',
  'Onaylandı': '#3B82F6',
  'Beklemede': '#F59E0B',
  'İptal': '#EF4444',
  'Gelmedi': '#6B7280',
};

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getPeriodRange(period: string): { startDate: string; endDate: string } {
  const now = new Date();
  const today = toIsoDate(now);
  if (period === 'Bugün') {
    return { startDate: today, endDate: today };
  }
  if (period === 'Bu Hafta') {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 6);
    return { startDate: toIsoDate(weekAgo), endDate: today };
  }
  if (period === 'Bu Yıl') {
    return { startDate: toIsoDate(new Date(now.getFullYear(), 0, 1)), endDate: today };
  }
  // 'Bu Ay' (default)
  return { startDate: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)), endDate: today };
}

// Matches ReportsDto in src/Core/RandevumKolay.Application/Features/Reports/Queries/GetReports/GetReportsQuery.cs
const EMPTY_REPORT = {
  kpis: { totalAppointments: 0, completedAppointments: 0, cancelledAppointments: 0, pendingAppointments: 0, totalRevenue: 0, averageBasket: 0, cancellationRate: 0, completionRate: 0, newCustomers: 0, uniqueCustomers: 0 },
  revenueTimeline: [] as { label: string; revenue: number; appointments: number }[],
  serviceBreakdown: [] as { serviceName: string; count: number; revenue: number; percentage: number }[],
  statusBreakdown: [] as { status: string; count: number; percentage: number }[],
};

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [period, setPeriod] = useState('Bu Ay');
  const { startDate, endDate } = getPeriodRange(period);
  const { data: reportData = EMPTY_REPORT } = useQuery({
    queryKey: ['reports', startDate, endDate],
    queryFn: async () => {
      const res = await api.get('/reports', { params: { startDate, endDate } });
      return res.data ?? EMPTY_REPORT;
    },
  });
  const maxRevenue = Math.max(1, ...reportData.revenueTimeline.map((d: any) => d.revenue));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Raporlar" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Period */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACE[5], paddingVertical: SPACE[3], gap: SPACE[2], alignItems: 'center' }}>
          {PERIODS.map((p) => (
            <TouchableOpacity key={p} style={[styles.chip, period === p && styles.chipActive]} onPress={() => setPeriod(p)} activeOpacity={0.8}>
              <Text style={[styles.chipText, period === p && styles.chipTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          <StatCard label="Toplam Gelir" value={formatCurrency(reportData.kpis.totalRevenue)} accent style={{ flex: 1 }} />
          <StatCard label="Randevular" value={reportData.kpis.totalAppointments} style={{ flex: 1 }} />
        </View>
        <View style={styles.kpiGrid}>
          <StatCard label="Yeni Müşteri" value={reportData.kpis.newCustomers} style={{ flex: 1 }} />
          <StatCard label="Ortalama Sepet" value={formatCurrency(reportData.kpis.averageBasket)} style={{ flex: 1 }} />
        </View>

        {/* Revenue Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Gelir Grafiği</Text>
          <View style={styles.barChart}>
            {reportData.revenueTimeline.map((d: any) => {
              const pct = d.revenue / maxRevenue;
              return (
                <View key={d.label} style={styles.barCol}>
                  <Text style={styles.barVal}>{Math.round(d.revenue / 1000)}K</Text>
                  <View style={styles.barBg}>
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.primaryDark]}
                      style={[styles.barFill, { height: `${Math.max(pct * 100, 5)}%` }]}
                      start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                    />
                  </View>
                  <Text style={styles.barLabel}>{d.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Service Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hizmet Dağılımı</Text>
          {reportData.serviceBreakdown.map((s: any) => (
            <View key={s.serviceName} style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <Text style={styles.breakdownName}>{s.serviceName}</Text>
                <Text style={styles.breakdownSub}>{s.count} randevu</Text>
              </View>
              <View style={styles.breakdownBar}>
                <View style={[styles.breakdownFill, { width: `${s.percentage}%`, backgroundColor: COLORS.primary }]} />
              </View>
              <Text style={styles.breakdownRevenue}>{formatCurrency(s.revenue)}</Text>
            </View>
          ))}
        </View>

        {/* Status Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Randevu Durumları</Text>
          {reportData.statusBreakdown.map((st: any) => {
            const color = STATUS_COLORS[st.status] ?? COLORS.textMuted;
            return (
              <View key={st.status} style={styles.methodRow}>
                <View style={[styles.methodDot, { backgroundColor: color }]} />
                <Text style={styles.methodName}>{st.status}</Text>
                <View style={styles.methodBarWrap}>
                  <View style={[styles.methodBar, { width: `${st.percentage}%`, backgroundColor: color + '80' }]} />
                </View>
                <Text style={styles.methodPct}>{st.percentage}%</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: 'transparent', justifyContent: 'center' },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  chipTextActive: { color: STATIC_WHITE },
  kpiGrid: { flexDirection: 'row', gap: SPACE[3], paddingHorizontal: SPACE[5], marginBottom: SPACE[3] },
  card: { marginHorizontal: SPACE[5], marginBottom: SPACE[4], backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm, gap: SPACE[3] },
  cardTitle: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 6 },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 3 },
  barVal: { fontSize: 9, color: COLORS.textMuted, fontWeight: FONT.bold },
  barBg: { width: '100%', flex: 1, backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.sm, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: RADIUS.sm },
  barLabel: { fontSize: 9, color: COLORS.textMuted },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  breakdownLeft: { width: 90 },
  breakdownName: { fontSize: FONT.xs, fontWeight: FONT.semibold, color: COLORS.text },
  breakdownSub: { fontSize: 10, color: COLORS.textMuted },
  breakdownBar: { flex: 1, height: 6, backgroundColor: COLORS.surfaceAlt, borderRadius: 3 },
  breakdownFill: { height: 6, borderRadius: 3 },
  breakdownRevenue: { fontSize: FONT.xs, fontWeight: FONT.bold, color: COLORS.text, width: 70, textAlign: 'right' },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  methodDot: { width: 10, height: 10, borderRadius: 5 },
  methodName: { width: 55, fontSize: FONT.sm, fontWeight: FONT.medium, color: COLORS.text },
  methodBarWrap: { flex: 1, height: 8, backgroundColor: COLORS.surfaceAlt, borderRadius: 4 },
  methodBar: { height: 8, borderRadius: 4 },
  methodPct: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.text, width: 36, textAlign: 'right' },
});

