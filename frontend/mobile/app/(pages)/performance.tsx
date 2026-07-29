import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { PatternOverlay } from '@/components/ui/PatternOverlay';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils';
import type { Performance } from '@/types';
import api from '@/lib/api';

const PERIODS = ['Bu Ay', 'Geçen Ay', 'Bu Yıl'];

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getPeriodRange(period: string): { periodStart: string; periodEnd: string } {
  const now = new Date();
  const today = toIsoDate(now);
  if (period === 'Geçen Ay') {
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    return { periodStart: toIsoDate(lastMonthStart), periodEnd: toIsoDate(lastMonthEnd) };
  }
  if (period === 'Bu Yıl') {
    return { periodStart: toIsoDate(new Date(now.getFullYear(), 0, 1)), periodEnd: today };
  }
  // 'Bu Ay' (default)
  return { periodStart: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)), periodEnd: today };
}

export default function PerformanceScreen() {
  const insets = useSafeAreaInsets();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [period, setPeriod] = useState('Bu Ay');
  const { periodStart, periodEnd } = getPeriodRange(period);
  const { data = [] } = useQuery({
    queryKey: ['performance', periodStart, periodEnd],
    queryFn: async () => {
      const res = await api.get('/performance', { params: { periodStart, periodEnd, pageSize: 100 } });
      return Array.isArray(res.data) ? res.data : res.data?.items ?? [];
    },
  });
  const list = data as Performance[];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <PatternOverlay opacity={0.25} />
      <ScreenHeader title="Personel Performansı" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Period */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: SPACE[5], paddingVertical: SPACE[3], gap: SPACE[2], alignItems: 'center' }}>
          {PERIODS.map((p) => (
            <TouchableOpacity key={p} style={[styles.chip, period === p && styles.chipActive]} onPress={() => setPeriod(p)} activeOpacity={0.8}>
              <Text style={[styles.chipText, period === p && styles.chipTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Team Summary */}
        <View style={styles.summaryRow}>
          <StatCard label="Toplam Randevu" value={list.reduce((s, e) => s + e.totalAppointments, 0).toString()} style={{ flex: 1 }} />
          <StatCard label="Toplam Gelir" value={formatCurrency(list.reduce((s, e) => s + e.totalRevenue, 0))} style={{ flex: 1 }} accent />
        </View>

        {/* Leaderboard */}
        <Text style={styles.sectionTitle}>Liderlik Tablosu</Text>
        {[...list].sort((a, b) => b.totalRevenue - a.totalRevenue).map((emp, idx) => (
          <View key={emp.employeeId} style={styles.empCard}>
            <View style={[styles.rank, idx === 0 ? styles.rankGold : idx === 1 ? styles.rankSilver : styles.rankBronze]}>
              <Text style={styles.rankText}>{idx + 1}</Text>
            </View>
            <Avatar name={emp.employeeName} size={48} />
            <View style={styles.empInfo}>
              <Text style={styles.empName}>{emp.employeeName}</Text>
              <View style={styles.empStats}>
                <Text style={styles.empStat}>{emp.totalAppointments} randevu</Text>
                <Text style={styles.empDot}>·</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
                  <Text style={styles.empStat}>%{emp.completionRate} tamamlanma</Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min((emp.totalRevenue / 40000) * 100, 100)}%` }]} />
              </View>
            </View>
            <Text style={styles.empRevenue}>{formatCurrency(emp.totalRevenue)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: 'transparent', justifyContent: 'center', flexShrink: 0 },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  chipTextActive: { color: STATIC_WHITE },
  summaryRow: { flexDirection: 'row', gap: SPACE[3], paddingHorizontal: SPACE[5], marginBottom: SPACE[4] },
  sectionTitle: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text, paddingHorizontal: SPACE[5], marginBottom: SPACE[3] },
  empCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, marginHorizontal: SPACE[5], marginBottom: SPACE[3], borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  rank: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rankGold: { backgroundColor: '#FEF3C7' },
  rankSilver: { backgroundColor: '#F3F4F6' },
  rankBronze: { backgroundColor: '#FEF9C3' },
  rankText: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.text },
  empInfo: { flex: 1, gap: 3 },
  empName: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  empStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  empStat: { fontSize: FONT.xs, color: COLORS.textMuted },
  empDot: { fontSize: FONT.xs, color: COLORS.textMuted },
  progressBar: { height: 4, backgroundColor: COLORS.surfaceAlt, borderRadius: 2, marginTop: 4 },
  progressFill: { height: 4, backgroundColor: COLORS.primary, borderRadius: 2 },
  empRevenue: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.text },
});

