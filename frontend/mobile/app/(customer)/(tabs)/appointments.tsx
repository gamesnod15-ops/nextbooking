import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { DotGrid } from '@/components/ui/DotGrid';
import api from '@/lib/api';
import { getDeviceId } from '@/lib/deviceId';

interface Appointment {
  id: string;
  businessId?: string;
  businessName?: string;
  serviceName: string;
  serviceDurationMinutes?: number;
  employeeName?: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  price: number;
  source?: string;
}

const STATUS_FILTERS = ['Tümü', 'Yaklaşan', 'Tamamlanan', 'İptal'];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
}

function formatCurrency(amount: number) {
  return `₺${amount.toLocaleString('tr-TR')}`;
}

export default function CustomerAppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('Tümü');
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: async () => {
      const deviceId = await getDeviceId();
      const res = await api.get(`/appointments/by-device?deviceId=${deviceId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const deviceId = await getDeviceId();
      await api.post(`/appointments/${id}/cancel-by-device`, { deviceId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      setCancelTarget(null);
      Alert.alert('Başarılı', 'Randevunuz iptal edildi.');
    },
    onError: () => {
      setCancelTarget(null);
      Alert.alert('Hata', 'Randevu iptal edilirken bir hata oluştu.');
    },
  });

  function handleCancel(id: string) {
    setCancelTarget(id);
  }

  const filtered = items.filter((a: Appointment) => {
    if (filter === 'Yaklaşan') return a.status === 'confirmed' || a.status === 'pending';
    if (filter === 'Tamamlanan') return a.status === 'completed';
    if (filter === 'İptal') return a.status === 'cancelled' || a.status === 'no_show';
    return true;
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.blobBlue} />
      <DotGrid style={styles.dotGridTopRight} rows={5} cols={4} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Randevularım</Text>
          <View style={styles.headerUnderline} />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(customer)/(tabs)')} activeOpacity={0.8}>
          <Ionicons name="add" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingHorizontal: SPACE[5], paddingBottom: SPACE[3], gap: SPACE[2] }}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity key={f} style={[styles.chip, filter === f && styles.chipActive]} onPress={() => setFilter(f)} activeOpacity={0.8}>
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="Randevu yok"
              description="Henüz bir randevunuz yok"
              action={
                <TouchableOpacity onPress={() => router.push('/(customer)/(tabs)')}>
                  <Text style={{ color: COLORS.primary, fontWeight: '600' }}>İşletmeleri Keşfet</Text>
                </TouchableOpacity>
              }
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.businessRow}>
                  <Avatar name={item.businessName || item.serviceName} size={40} />
                  <View style={styles.businessInfo}>
                    <Text style={styles.businessName}>{item.businessName || 'İşletme'}</Text>
                    <Text style={styles.serviceName}>{item.serviceName}</Text>
                  </View>
                </View>
                <Badge
                  variant={
                    item.status === 'confirmed' ? 'success' :
                    item.status === 'pending' ? 'warning' :
                    item.status === 'completed' ? 'info' : 'error'
                  }
                  size="sm"
                >
                  {item.status === 'confirmed' ? 'Onaylandı' :
                   item.status === 'pending' ? 'Bekliyor' :
                   item.status === 'completed' ? 'Tamamlandı' :
                   item.status === 'no_show' ? 'Gelmedi' : 'İptal'}
                </Badge>
              </View>

              <View style={styles.details}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.detailText}>{formatDate(item.startTime)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.detailText}>{formatTime(item.startTime)} - {formatTime(item.endTime)}</Text>
                </View>
                {item.employeeName && (
                  <View style={styles.detailItem}>
                    <Ionicons name="person-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.detailText}>{item.employeeName}</Text>
                  </View>
                )}
              </View>

              {(item.status === 'confirmed' || item.status === 'pending') && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleCancel(item.id)}
                    disabled={cancelMutation.isPending}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelBtnText}>İptal Et</Text>
                  </TouchableOpacity>
                </View>
              )}

              {item.status === 'completed' && (
                <View style={styles.completedRow}>
                  <Text style={styles.price}>{formatCurrency(item.price)}</Text>
                </View>
              )}
            </View>
          )}
        />
      )}

      <ConfirmModal
        visible={!!cancelTarget}
        title="Randevu İptali"
        message="Bu randevuyu iptal etmek istediğinize emin misiniz?"
        confirmLabel="Evet, İptal Et"
        cancelLabel="Vazgeç"
        destructive
        icon="calendar-outline"
        loading={cancelMutation.isPending}
        onConfirm={() => cancelTarget && cancelMutation.mutate(cancelTarget)}
        onCancel={() => setCancelTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  blobBlue: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#3B82F6',
    opacity: 0.08,
  },
  dotGridTopRight: {
    position: 'absolute',
    top: 24,
    right: 16,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACE[5], paddingVertical: SPACE[4] },
  headerTitle: { fontSize: FONT['2xl'], fontWeight: FONT.extrabold, color: COLORS.text },
  headerUnderline: { width: 44, height: 4, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, marginTop: 6 },
  addBtn: { width: 38, height: 38, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.primary },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white },
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
  completedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACE[2], borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  price: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text },
});
