import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { PatternOverlay } from '@/components/ui/PatternOverlay';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Payment } from '@/types';
import api from '@/lib/api';

// This page is read-only: PaymentsController.cs (RecordPaymentCommand) only lets a
// payment be recorded against an existing Appointment (there is no ad-hoc
// customer/method/status entry, no PUT /payments/{id}, and no DELETE /payments/{id}).
// A create/edit/delete UI here would call endpoints that don't exist and fail with an
// unhandled 404 on every attempt, so those actions were removed rather than shipped broken.
const STATUS_LABELS: Record<string, string> = { pending: 'Bekliyor', completed: 'Tamamlandı', failed: 'Başarısız', refunded: 'İade', partiallyRefunded: 'Kısmi İade' };

export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { data, refetch } = useQuery<Payment[]>({
    queryKey: ['payments'],
    queryFn: async () => { const r = await api.get('/payments'); return Array.isArray(r.data) ? r.data : r.data?.items ?? []; },
  });
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  async function onRefresh() { setRefreshing(true); await refetch(); setRefreshing(false); }

  const filtered = (data ?? []).filter((p) => (p.customerName?.toLowerCase() ?? '').includes(search.toLowerCase()));

  const total = filtered.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <PatternOverlay opacity={0.25} />
      <ScreenHeader title="Ödemeler" showBack />
      <View style={styles.summary}>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryLabel, { color: 'rgba(255,255,255,0.7)' }]}>Toplam Gelir</Text>
          <Text style={[styles.summaryValue, { color: STATIC_WHITE }]}>{formatCurrency(total)}</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryCardAlt]}>
          <Text style={styles.summaryLabel}>İşlem Sayısı</Text>
          <Text style={styles.summaryValue}>{filtered.filter(p => p.status === 'completed').length}</Text>
        </View>
      </View>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Müşteri veya hizmet ara…" style={{ marginHorizontal: SPACE[5], marginBottom: SPACE[3] }} />
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={<EmptyState icon="card-outline" title="Ödeme yok" />}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.methodIcon, { backgroundColor: item.status === 'completed' ? COLORS.successLight : COLORS.warningLight }]}>
              <Ionicons name="card-outline" size={20} color={item.status === 'completed' ? COLORS.success : COLORS.warning} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.customerName}</Text>
              <Text style={styles.service}>{item.serviceName}</Text>
              <View style={styles.row}>
                <Text style={styles.method}>{item.provider}</Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
              </View>
            </View>
            <View style={styles.right}>
              <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
              <Badge variant={item.status === 'completed' ? 'success' : item.status === 'pending' ? 'warning' : 'error'} size="sm">
                {STATUS_LABELS[item.status] ?? item.status}
              </Badge>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  summary: { flexDirection: 'row', gap: SPACE[3], paddingHorizontal: SPACE[5], paddingVertical: SPACE[4] },
  summaryCard: { flex: 1, backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, padding: SPACE[4] },
  summaryCardAlt: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.borderLight },
  summaryLabel: { fontSize: FONT.xs, fontWeight: FONT.medium, color: 'rgba(0,0,0,0.5)', marginBottom: 4 },
  summaryValue: { fontSize: FONT['2xl'], fontWeight: FONT.bold, color: COLORS.black },
  list: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[10] },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  methodIcon: { width: 44, height: 44, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 2 },
  name: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  service: { fontSize: FONT.xs, color: COLORS.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  method: { fontSize: FONT.xs, color: COLORS.textSecondary, fontWeight: FONT.medium },
  dot: { fontSize: FONT.xs, color: COLORS.textMuted },
  date: { fontSize: FONT.xs, color: COLORS.textMuted },
  right: { alignItems: 'flex-end', gap: SPACE[2] },
  amount: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text },
});
