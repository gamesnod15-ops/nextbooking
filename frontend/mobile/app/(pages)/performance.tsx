import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils';
import type { Performance } from '@/types';
import api from '@/lib/api';

const PERIODS = ['Bu Ay', 'Geçen Ay', 'Bu Yıl'];

export default function PerformanceScreen() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState('Bu Ay');
  const { data = [] } = useQuery({
    queryKey: ['performance'],
    queryFn: async () => { const res = await api.get('/performance'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
  });
  const list = data as Performance[];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Personel Performansı" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Period */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACE[5], paddingVertical: SPACE[3], gap: SPACE[2], alignItems: 'center' }}>
          {PERIODS.map((p) => (
            <TouchableOpacity key={p} style={[styles.chip, period === p && styles.chipActive]} onPress={() => setPeriod(p)} activeOpacity={0.8}>
              <Text style={[styles.chipText, period === p && styles.chipTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Team Summary */}
        <View style={styles.summaryRow}>
          <StatCard label="Toplam Randevu" value={list.reduce((s, e) => s + e.appointmentCount, 0).toString()} style={{ flex: 1 }} />
          <StatCard label="Toplam Gelir" value={formatCurrency(list.reduce((s, e) => s + e.revenue, 0))} style={{ flex: 1 }} accent />
        </View>

        {/* Leaderboard */}
        <Text style={styles.sectionTitle}>Liderlik Tablosu</Text>
        {[...list].sort((a, b) => b.revenue - a.revenue).map((emp, idx) => (
          <View key={emp.employeeId} style={styles.empCard}>
            <View style={[styles.rank, idx === 0 ? styles.rankGold : idx === 1 ? styles.rankSilver : styles.rankBronze]}>
              <Text style={styles.rankText}>{idx + 1}</Text>
            </View>
            <Avatar name={emp.employeeName} size={48} />
            <View style={styles.empInfo}>
              <Text style={styles.empName}>{emp.employeeName}</Text>
              <View style={styles.empStats}>
                <Text style={styles.empStat}>{emp.appointmentCount} randevu</Text>
                <Text style={styles.empDot}>·</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name="star" size={12} color={COLORS.warning} />
                  <Text style={styles.empStat}>{emp.rating}</Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(emp.revenue / 40000) * 100}%` }]} />
              </View>
            </View>
            <Text style={styles.empRevenue}>{formatCurrency(emp.revenue)}</Text>
          </View>
        ))}
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

