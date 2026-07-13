import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import type { Appointment } from '@/types';
import api from '@/lib/api';

const MOCK: Appointment[] = [
  { id: '1', customerName: 'Sen', customerPhone: '05551234567', serviceName: 'Saç Kesimi', serviceDurationMinutes: 60, employeeName: 'Elif Hanım', startTime: '2026-06-03T14:30:00', endTime: '2026-06-03T15:30:00', status: 'confirmed', price: 250, source: 'mobile' },
  { id: '2', customerName: 'Sen', customerPhone: '05551234567', serviceName: 'Sakal Düzeltme', serviceDurationMinutes: 45, employeeName: 'Ahmet Usta', startTime: '2026-06-05T11:00:00', endTime: '2026-06-05T11:45:00', status: 'pending', price: 150, source: 'mobile' },
  { id: '3', customerName: 'Sen', customerPhone: '05551234567', serviceName: 'Manikür', serviceDurationMinutes: 60, employeeName: 'Selin Yıldız', startTime: '2026-05-28T15:00:00', endTime: '2026-05-28T16:00:00', status: 'completed', price: 350, source: 'web' },
  { id: '4', customerName: 'Sen', customerPhone: '05551234567', serviceName: 'Saç Boyama', serviceDurationMinutes: 120, employeeName: 'Elif Hanım', startTime: '2026-05-15T10:00:00', endTime: '2026-05-15T12:00:00', status: 'cancelled', price: 600, source: 'mobile' },
];

const STATUS_FILTERS = ['Tümü', 'Yaklaşan', 'Tamamlanan', 'İptal'];

export default function CustomerAppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('Tümü');
  const { data: items = MOCK } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: async () => { const res = await api.get('/appointments'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
    placeholderData: MOCK,
  });

  const filtered = items.filter((a: Appointment) => {
    if (filter === 'Yaklaşan') return a.status === 'confirmed' || a.status === 'pending';
    if (filter === 'Tamamlanan') return a.status === 'completed';
    if (filter === 'İptal') return a.status === 'cancelled';
    return true;
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Randevularım</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={22} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACE[5], paddingBottom: SPACE[3], gap: SPACE[2] }}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity key={f} style={[styles.chip, filter === f && styles.chipActive]} onPress={() => setFilter(f)} activeOpacity={0.8}>
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
        ListEmptyComponent={<EmptyState icon="calendar-outline" title="Randevu yok" description="Yakında randevu alın" action={<TouchableOpacity><Text style={{ color: COLORS.primary, fontWeight: '600' }}>Keşfet</Text></TouchableOpacity>} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.businessRow}>
                <Avatar name={item.businessName} size={40} />
                <View style={styles.businessInfo}>
                  <Text style={styles.businessName}>{item.businessName}</Text>
                  <Text style={styles.serviceName}>{item.serviceName}</Text>
                </View>
              </View>
              <Badge variant={item.status === 'confirmed' ? 'success' : item.status === 'pending' ? 'warning' : item.status === 'completed' ? 'info' : 'error'} size="sm">
                {item.status === 'confirmed' ? 'Onaylandı' : item.status === 'pending' ? 'Bekliyor' : item.status === 'completed' ? 'Tamamlandı' : 'İptal'}
              </Badge>
            </View>
            <View style={styles.details}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.detailText}>{formatDateTime(item.startTime)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="person-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.detailText}>{item.employeeName}</Text>
              </View>
            </View>
            {(item.status === 'confirmed' || item.status === 'pending') && (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>İptal Et</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rescheduleBtn}>
                  <Text style={styles.rescheduleBtnText}>Yeniden Planla</Text>
                </TouchableOpacity>
              </View>
            )}
            {item.status === 'completed' && (
              <View style={styles.completedRow}>
                <Text style={styles.price}>{formatCurrency(item.price)}</Text>
                <TouchableOpacity style={styles.reviewBtn}>
                  <Ionicons name="star-outline" size={14} color={COLORS.primaryDark} />
                  <Text style={styles.reviewBtnText}>Değerlendir</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACE[5], paddingVertical: SPACE[4] },
  headerTitle: { fontSize: FONT['2xl'], fontWeight: FONT.extrabold, color: COLORS.text },
  addBtn: { width: 38, height: 38, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.primary },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.black },
  list: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[10] },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  businessRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], flex: 1 },
  businessInfo: { flex: 1, gap: 2 },
  businessName: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.text },
  serviceName: { fontSize: FONT.xs, color: COLORS.textMuted },
  details: { gap: SPACE[2] },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2] },
  detailText: { fontSize: FONT.sm, color: COLORS.textSecondary },
  actions: { flexDirection: 'row', gap: SPACE[3], paddingTop: SPACE[2], borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  cancelBtn: { flex: 1, borderRadius: RADIUS.lg, padding: SPACE[3], alignItems: 'center', borderWidth: 1, borderColor: COLORS.error },
  cancelBtnText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.error },
  rescheduleBtn: { flex: 1, borderRadius: RADIUS.lg, padding: SPACE[3], alignItems: 'center', backgroundColor: COLORS.surfaceAlt },
  rescheduleBtnText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  completedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACE[2], borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  price: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.full },
  reviewBtnText: { fontSize: FONT.xs, fontWeight: FONT.bold, color: COLORS.primaryDark },
});

