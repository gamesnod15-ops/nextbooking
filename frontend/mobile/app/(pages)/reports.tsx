import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StatCard } from '@/components/ui/StatCard';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';

const { width } = Dimensions.get('window');
const PERIODS = ['Bugün', 'Bu Hafta', 'Bu Ay', 'Bu Yıl'];

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState('Bu Ay');
  const EMPTY_REPORT = { revenue: 0, appointments: 0, newCustomers: 0, avgPerCustomer: 0, weeklyRevenue: [] as { label: string; value: number }[], serviceBreakdown: [] as { name: string; count: number; percentage: number }[], paymentMethods: [] as { name: string; amount: number; percentage: number }[] };
  const { data: reportData = EMPTY_REPORT } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => { const res = await api.get('/reports'); return res.data ?? EMPTY_REPORT; },
  });
  const maxRevenue = Math.max(...reportData.weeklyRevenue.map((d: any) => d.value));

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
          <StatCard label="Toplam Gelir" value={formatCurrency(reportData.revenue)} accent trend={{ value: 12, positive: true }} style={{ flex: 1 }} />
          <StatCard label="Randevular" value={reportData.appointments} style={{ flex: 1 }} trend={{ value: 8, positive: true }} />
        </View>
        <View style={styles.kpiGrid}>
          <StatCard label="Yeni Müşteri" value={reportData.newCustomers} style={{ flex: 1 }} trend={{ value: 15, positive: true }} />
          <StatCard label="Müşteri Başı Ort." value={formatCurrency(reportData.avgPerCustomer)} style={{ flex: 1 }} />
        </View>

        {/* Revenue Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Haftalık Gelir</Text>
          <View style={styles.barChart}>
            {reportData.weeklyRevenue.map((d: any) => {
              const pct = d.value / maxRevenue;
              return (
                <View key={d.label} style={styles.barCol}>
                  <Text style={styles.barVal}>{Math.round(d.value / 1000)}K</Text>
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
            <View key={s.name} style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <Text style={styles.breakdownName}>{s.name}</Text>
                <Text style={styles.breakdownSub}>{s.count} randevu</Text>
              </View>
              <View style={styles.breakdownBar}>
                <View style={[styles.breakdownFill, { width: `${s.pct}%`, backgroundColor: COLORS.primary }]} />
              </View>
              <Text style={styles.breakdownRevenue}>{formatCurrency(s.revenue)}</Text>
            </View>
          ))}
        </View>

        {/* Payment Methods */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ödeme Yöntemleri</Text>
          {reportData.paymentMethods.map((m: any) => (
            <View key={m.method} style={styles.methodRow}>
              <View style={[styles.methodDot, { backgroundColor: m.color }]} />
              <Text style={styles.methodName}>{m.method}</Text>
              <View style={styles.methodBarWrap}>
                <View style={[styles.methodBar, { width: `${m.pct}%`, backgroundColor: m.color + '80' }]} />
              </View>
              <Text style={styles.methodPct}>{m.pct}%</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: 'transparent', justifyContent: 'center' },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.black },
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

