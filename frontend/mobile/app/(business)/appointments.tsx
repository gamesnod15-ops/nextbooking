import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Modal, ScrollView, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { MenuButton, NotifButton } from '@/components/DrawerMenu';
import api from '@/lib/api';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import type { Appointment } from '@/types';

const STATUS_FILTERS = ['Tümü', 'Beklemede', 'Onaylandı', 'Tamamlandı', 'İptal'];
const STATUS_KEYS: Record<string, string> = {
  'Beklemede': 'pending',
  'Onaylandı': 'confirmed',
  'Tamamlandı': 'completed',
  'İptal': 'cancelled',
};

const statusMap: Record<string, { label: string; variant: any }> = {
  pending:   { label: 'Beklemede', variant: 'pending' },
  confirmed: { label: 'Onaylandı', variant: 'confirmed' },
  cancelled: { label: 'İptal', variant: 'cancelled' },
  completed: { label: 'Tamamlandı', variant: 'completed' },
  no_show:   { label: 'Gelmedi', variant: 'no_show' },
};

function useAppointments() {
  return useQuery<Appointment[]>({
    queryKey: ['appointments'],
    queryFn: async () => {
      const res = await api.get('/appointments');
      return (Array.isArray(res.data) ? res.data : res.data?.items ?? res.data?.data ?? []) as Appointment[];
    },
    staleTime: 1000 * 30,
  });
}

function DetailModal({ apt, visible, onClose, onAction }: {
  apt: Appointment | null;
  visible: boolean;
  onClose: () => void;
  onAction: (action: 'confirm' | 'complete' | 'cancel', id: string) => void;
}) {
  if (!apt) return null;
  const s = statusMap[apt.status];
  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          <View style={modal.handle} />
          <View style={modal.header}>
            <Text style={modal.title}>Randevu Detayı</Text>
            <TouchableOpacity onPress={onClose} style={modal.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACE[5], gap: SPACE[4] }}>
            <Badge variant={s?.variant}>{s?.label}</Badge>
            {[
              { label: 'Müşteri', value: apt.customerName, icon: 'person-outline' },
              { label: 'Telefon', value: apt.customerPhone, icon: 'call-outline' },
              { label: 'Hizmet', value: `${apt.serviceName} (${apt.serviceDurationMinutes} dk)`, icon: 'cut-outline' },
              { label: 'Personel', value: apt.employeeName, icon: 'person-circle-outline' },
              { label: 'Tarih', value: formatDate(apt.startTime), icon: 'calendar-outline' },
              { label: 'Saat', value: `${formatTime(apt.startTime)} – ${formatTime(apt.endTime)}`, icon: 'time-outline' },
              { label: 'Ücret', value: formatCurrency(apt.price), icon: 'cash-outline' },
              { label: 'Kaynak', value: apt.source, icon: 'globe-outline' },
              ...(apt.notes ? [{ label: 'Not', value: apt.notes, icon: 'document-text-outline' }] : []),
            ].map((row) => (
              <View key={row.label} style={modal.row}>
                <View style={modal.rowIcon}>
                  <Ionicons name={row.icon as any} size={16} color={COLORS.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={modal.rowLabel}>{row.label}</Text>
                  <Text style={modal.rowValue}>{row.value}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={modal.actions}>
            {apt.status === 'pending' && (
              <Button variant="primary" style={{ flex: 1 }} onPress={() => { onAction('confirm', apt.id); onClose(); }}>
                Onayla
              </Button>
            )}
            {apt.status === 'confirmed' && (
              <Button variant="primary" style={{ flex: 1 }} onPress={() => { onAction('complete', apt.id); onClose(); }}>
                Tamamla
              </Button>
            )}
            {(apt.status === 'pending' || apt.status === 'confirmed') && (
              <Button variant="destructive" onPress={() => { onAction('cancel', apt.id); onClose(); }}>
                İptal
              </Button>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function AppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const { data = [], isLoading, refetch } = useAppointments();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Tümü');
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const mutation = useMutation({
    mutationFn: ({ action, id }: { action: string; id: string }) => {
      const ep = action === 'confirm' ? 'confirm' : action === 'complete' ? 'complete' : 'cancel';
      return api.post(`/appointments/${id}/${ep}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
    onError: () => Alert.alert('Hata', 'İşlem gerçekleştirilemedi.'),
  });

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const filtered = data.filter((a) => {
    const matchSearch = a.customerName.toLowerCase().includes(search.toLowerCase()) ||
      a.serviceName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'Tümü' || a.status === STATUS_KEYS[filter];
    return matchSearch && matchFilter;
  });

  function renderItem({ item }: { item: Appointment }) {
    const s = statusMap[item.status];
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => setSelected(item)}
      >
        <Avatar name={item.customerName} size={46} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.customerName}</Text>
          <Text style={styles.service}>{item.serviceName} · {item.employeeName}</Text>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.time}>{formatDate(item.startTime)}, {formatTime(item.startTime)}–{formatTime(item.endTime)}</Text>
          </View>
        </View>
        <View style={styles.right}>
          <Badge variant={s?.variant} size="sm">{s?.label}</Badge>
          <Text style={styles.price}>{formatCurrency(item.price)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Randevular"
        subtitle={`${filtered.length} randevu`}
        showBack
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <NotifButton />
            <MenuButton />
          </View>
        }
      />

      {/* Search */}
      <SearchBar value={search} onChangeText={setSearch} placeholder="Müşteri veya hizmet ara…" style={styles.search} />

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            activeOpacity={0.75}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={<EmptyState icon="calendar-outline" title="Randevu yok" description="Kriterlere uyan randevu bulunamadı." />}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
      />

      <DetailModal
        apt={selected}
        visible={!!selected}
        onClose={() => setSelected(null)}
        onAction={(action, id) => mutation.mutate({ action, id })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT.sm,
    fontWeight: FONT.semibold,
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  search: { marginHorizontal: SPACE[5], marginVertical: SPACE[3] },
  chips: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[3], gap: SPACE[2], alignItems: 'center' },
  list: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[10] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACE[4],
    gap: SPACE[3],
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW.sm,
  },
  info: { flex: 1, gap: 3 },
  name: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  service: { fontSize: FONT.xs, color: COLORS.textMuted },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  time: { fontSize: FONT.xs, color: COLORS.textSecondary },
  right: { alignItems: 'flex-end', gap: SPACE[2] },
  price: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.text },
});

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginTop: SPACE[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACE[5],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE[3],
    paddingVertical: SPACE[2],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: FONT.medium },
  rowValue: { fontSize: FONT.base, color: COLORS.text, fontWeight: FONT.medium, marginTop: 2 },
  actions: {
    flexDirection: 'row',
    gap: SPACE[3],
    padding: SPACE[5],
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
});

