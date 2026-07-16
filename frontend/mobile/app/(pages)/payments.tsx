import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { FormModal } from '@/components/ui/FormModal';
import { FormField } from '@/components/ui/FormField';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Payment } from '@/types';
import api from '@/lib/api';

const METHOD_LABELS: Record<string, string> = { cash: 'Nakit', card: 'Kart', transfer: 'Havale', other: 'Diğer' };
const METHOD_ICONS: Record<string, any> = { cash: 'cash-outline', card: 'card-outline', transfer: 'swap-horizontal-outline', other: 'ellipsis-horizontal-outline' };

export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const { data, refetch } = useQuery<Payment[]>({
    queryKey: ['payments'],
    queryFn: async () => { const r = await api.get('/payments'); return Array.isArray(r.data) ? r.data : r.data?.items ?? []; },
  });
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  async function onRefresh() { setRefreshing(true); await refetch(); setRefreshing(false); }

  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; item?: Payment }>({ open: false });
  const [form, setForm] = useState({ customerName: '', amount: '', method: 'cash' as 'cash' | 'card' | 'transfer' | 'other', status: 'pending' as 'pending' | 'completed' | 'refunded' | 'cancelled', description: '', transactionId: '' });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/payments', { customerName: form.customerName, amount: Number(form.amount), method: form.method, status: form.status, description: form.description || undefined, transactionId: form.transactionId || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Ödeme eklenemedi.'),
  });
  const updateMutation = useMutation({
    mutationFn: async () => api.put(`/payments/${modal.item!.id}`, { customerName: form.customerName, amount: Number(form.amount), method: form.method, status: form.status, description: form.description || undefined, transactionId: form.transactionId || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Ödeme güncellenemedi.'),
  });
  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/payments/${modal.item!.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Ödeme silinemedi.'),
  });

  function openCreate() { setForm({ customerName: '', amount: '', method: 'cash', status: 'pending', description: '', transactionId: '' }); setModal({ open: true, item: undefined }); }
  function openEdit(item: Payment) { setForm({ customerName: item.customerName, amount: String(item.amount), method: item.method as any, status: item.status as any, description: (item as any).description ?? '', transactionId: (item as any).transactionId ?? '' }); setModal({ open: true, item }); }
  function handleSave() {
    if (!form.customerName || !form.amount) { Alert.alert('Uyarı', 'Müşteri adı ve tutar zorunludur.'); return; }
    if (modal.item) updateMutation.mutate(); else createMutation.mutate();
  }

  const filtered = (data ?? []).filter((p) => (p.customerName?.toLowerCase() ?? '').includes(search.toLowerCase()));

  const total = filtered.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Ödemeler" showBack
        right={<TouchableOpacity style={styles.addBtn} onPress={openCreate}><Ionicons name="add" size={22} color={COLORS.white} /></TouchableOpacity>}
      />
      <View style={styles.summary}>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryLabel, { color: 'rgba(255,255,255,0.7)' }]}>Toplam Gelir</Text>
          <Text style={[styles.summaryValue, { color: COLORS.white }]}>{formatCurrency(total)}</Text>
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
          <TouchableOpacity activeOpacity={0.9} onPress={() => openEdit(item)} style={styles.card}>
            <View style={[styles.methodIcon, { backgroundColor: item.method === 'card' ? COLORS.infoLight : item.method === 'cash' ? COLORS.successLight : COLORS.warningLight }]}>
              <Ionicons name={METHOD_ICONS[item.method]} size={20} color={item.method === 'card' ? COLORS.info : item.method === 'cash' ? COLORS.success : COLORS.warning} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.customerName}</Text>
              <Text style={styles.service}>{item.description ?? ''}</Text>
              <View style={styles.row}>
                <Text style={styles.method}>{METHOD_LABELS[item.method]}</Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
              </View>
            </View>
            <View style={styles.right}>
              <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
              <Badge variant={item.status === 'completed' ? 'success' : item.status === 'pending' ? 'warning' : 'error'} size="sm">
                {item.status === 'completed' ? 'Tamamlandı' : item.status === 'pending' ? 'Bekliyor' : 'İade'}
              </Badge>
            </View>
          </TouchableOpacity>
        )}
      />
      <FormModal
        visible={modal.open}
        onClose={() => setModal({ open: false })}
        onSave={handleSave}
        title={modal.item ? 'Ödeme Düzenle' : 'Yeni Ödeme'}
        saving={createMutation.isPending || updateMutation.isPending}
        deleteLabel={modal.item ? 'Sil' : undefined}
        onDelete={modal.item ? () => deleteMutation.mutate() : undefined}
      >
        <FormField label="Müşteri Adı" value={form.customerName} onChangeText={v => setForm(p => ({ ...p, customerName: v }))} placeholder="Örn: Ali Yılmaz" />
        <FormField label="Tutar" value={form.amount} onChangeText={v => setForm(p => ({ ...p, amount: v }))} placeholder="Örn: 250" keyboardType="numeric" />
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Ödeme Yöntemi</Text>
          <View style={styles.segmentRow}>
            <TouchableOpacity style={[styles.segment, form.method === 'cash' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, method: 'cash' }))}><Text style={[styles.segmentText, form.method === 'cash' && styles.segmentTextActive]}>Nakit</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.segment, form.method === 'card' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, method: 'card' }))}><Text style={[styles.segmentText, form.method === 'card' && styles.segmentTextActive]}>Kart</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.segment, form.method === 'transfer' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, method: 'transfer' }))}><Text style={[styles.segmentText, form.method === 'transfer' && styles.segmentTextActive]}>Havale</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.segment, form.method === 'other' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, method: 'other' }))}><Text style={[styles.segmentText, form.method === 'other' && styles.segmentTextActive]}>Diğer</Text></TouchableOpacity>
          </View>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Durum</Text>
          <View style={styles.segmentRow}>
            <TouchableOpacity style={[styles.segment, form.status === 'pending' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, status: 'pending' }))}><Text style={[styles.segmentText, form.status === 'pending' && styles.segmentTextActive]}>Bekliyor</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.segment, form.status === 'completed' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, status: 'completed' }))}><Text style={[styles.segmentText, form.status === 'completed' && styles.segmentTextActive]}>Tamamlandı</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.segment, form.status === 'refunded' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, status: 'refunded' }))}><Text style={[styles.segmentText, form.status === 'refunded' && styles.segmentTextActive]}>İade</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.segment, form.status === 'cancelled' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, status: 'cancelled' }))}><Text style={[styles.segmentText, form.status === 'cancelled' && styles.segmentTextActive]}>İptal</Text></TouchableOpacity>
          </View>
        </View>
        <FormField label="Açıklama" value={form.description} onChangeText={v => setForm(p => ({ ...p, description: v }))} placeholder="Opsiyonel" />
        <FormField label="İşlem Numarası" value={form.transactionId} onChangeText={v => setForm(p => ({ ...p, transactionId: v }))} placeholder="Opsiyonel" />
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  addBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.primary },
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
  fieldGroup: { gap: SPACE[1] },
  fieldLabel: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  segmentRow: { flexDirection: 'row', backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, padding: 3 },
  segment: { flex: 1, paddingVertical: SPACE[2], alignItems: 'center', borderRadius: RADIUS.md },
  segmentActive: { backgroundColor: COLORS.surface, ...SHADOW.sm },
  segmentText: { fontSize: FONT.sm, fontWeight: FONT.medium, color: COLORS.textMuted },
  segmentTextActive: { color: COLORS.text, fontWeight: FONT.semibold },
});
