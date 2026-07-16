import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { FormField } from '@/components/ui/FormField';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Receivable } from '@/types';
import api from '@/lib/api';

export default function ReceivablesScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('Tümü');
  const { data } = useQuery<Receivable[]>({
    queryKey: ['receivables'],
    queryFn: async () => { const res = await api.get('/receivables'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
  });
  const TOTAL_PENDING = (data ?? []).filter(r => r.status !== 'paid').reduce((s, r) => s + r.amount, 0);

  const filtered = (data ?? []).filter(r => {
    if (filter === 'Bekleyen') return r.status === 'pending';
    if (filter === 'Gecikmiş') return r.status === 'overdue';
    if (filter === 'Ödendi') return r.status === 'paid';
    return true;
  });

  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; item?: Receivable }>({ open: false });
  const [form, setForm] = useState({ customerName: '', description: '', amount: '', dueDate: '', status: 'pending' as 'pending' | 'partial' | 'paid' | 'overdue', notes: '' });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/receivables', { customerName: form.customerName, description: form.description, amount: Number(form.amount), dueDate: form.dueDate, status: form.status, notes: form.notes || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['receivables'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Alacak eklenemedi.'),
  });
  const updateMutation = useMutation({
    mutationFn: async () => api.put(`/receivables/${modal.item!.id}`, { customerName: form.customerName, description: form.description, amount: Number(form.amount), dueDate: form.dueDate, status: form.status, notes: form.notes || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['receivables'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Alacak güncellenemedi.'),
  });
  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/receivables/${modal.item!.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['receivables'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Alacak silinemedi.'),
  });

  function openCreate() { setForm({ customerName: '', description: '', amount: '', dueDate: '', status: 'pending', notes: '' }); setModal({ open: true, item: undefined }); }
  function openEdit(item: Receivable) { setForm({ customerName: item.customerName, description: item.description ?? '', amount: String(item.amount), dueDate: item.dueDate, status: item.status, notes: item.notes ?? '' }); setModal({ open: true, item }); }
  function handleSave() {
    if (!form.customerName || !form.amount || !form.dueDate) { Alert.alert('Uyarı', 'Müşteri adı, tutar ve vade tarihi zorunludur.'); return; }
    if (modal.item) updateMutation.mutate(); else createMutation.mutate();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Alacaklar" showBack
        right={<TouchableOpacity style={styles.addBtn} onPress={openCreate}><Ionicons name="add" size={22} color={COLORS.white} /></TouchableOpacity>}
      />
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Toplam Alacak</Text>
        <Text style={styles.summaryValue}>{formatCurrency(TOTAL_PENDING)}</Text>
        <View style={styles.summaryMeta}>
          <Text style={styles.summaryMetaText}>{(data ?? []).filter(r => r.status === 'overdue').length} gecikmiş ödeme</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACE[5], paddingVertical: SPACE[3], gap: SPACE[2], alignItems: 'center' }}>
        {['Tümü', 'Bekleyen', 'Gecikmiş', 'Ödendi'].map((f) => (
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
        ListEmptyComponent={<EmptyState icon="wallet-outline" title="Alacak yok" />}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.9} onPress={() => openEdit(item)} style={styles.card}>
            <Avatar name={item.customerName} size={44} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.customerName}</Text>
              <Text style={styles.desc}>{item.description}</Text>
              <View style={styles.row}>
                <Ionicons name="calendar-outline" size={12} color={item.status === 'overdue' ? COLORS.error : COLORS.textMuted} />
                <Text style={[styles.dueDate, item.status === 'overdue' && { color: COLORS.error }]}>
                  Vade: {formatDate(item.dueDate)}
                </Text>
              </View>
            </View>
            <View style={styles.right}>
              <Text style={[styles.amount, item.status === 'paid' && { color: COLORS.success }]}>{formatCurrency(item.amount)}</Text>
              <Badge variant={item.status === 'paid' ? 'success' : item.status === 'overdue' ? 'error' : 'warning'} size="sm">
                {item.status === 'paid' ? 'Ödendi' : item.status === 'overdue' ? 'Gecikmiş' : 'Bekliyor'}
              </Badge>
            </View>
          </TouchableOpacity>
        )}
      />
      <FormModal
        visible={modal.open}
        onClose={() => setModal({ open: false })}
        onSave={handleSave}
        title={modal.item ? 'Alacak Düzenle' : 'Yeni Alacak'}
        saving={createMutation.isPending || updateMutation.isPending}
        deleteLabel={modal.item ? 'Sil' : undefined}
        onDelete={modal.item ? () => deleteMutation.mutate() : undefined}
      >
        <FormField label="Müşteri Adı" value={form.customerName} onChangeText={v => setForm(p => ({ ...p, customerName: v }))} placeholder="Örn: Ahmet Yılmaz" />
        <FormField label="Açıklama" value={form.description} onChangeText={v => setForm(p => ({ ...p, description: v }))} placeholder="Örn: Saç kesimi ücreti" />
        <FormField label="Tutar" value={form.amount} onChangeText={v => setForm(p => ({ ...p, amount: v }))} placeholder="Örn: 500" keyboardType="numeric" />
        <FormField label="Vade Tarihi" value={form.dueDate} onChangeText={v => setForm(p => ({ ...p, dueDate: v }))} placeholder="Örn: 2025-06-15" />
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Durum</Text>
          <View style={styles.segmentRow}>
            <TouchableOpacity style={[styles.segment, form.status === 'pending' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, status: 'pending' }))}><Text style={[styles.segmentText, form.status === 'pending' && styles.segmentTextActive]}>Bekliyor</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.segment, form.status === 'partial' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, status: 'partial' }))}><Text style={[styles.segmentText, form.status === 'partial' && styles.segmentTextActive]}>Kısmi</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.segment, form.status === 'paid' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, status: 'paid' }))}><Text style={[styles.segmentText, form.status === 'paid' && styles.segmentTextActive]}>Ödendi</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.segment, form.status === 'overdue' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, status: 'overdue' }))}><Text style={[styles.segmentText, form.status === 'overdue' && styles.segmentTextActive]}>Gecikmiş</Text></TouchableOpacity>
          </View>
        </View>
        <FormField label="Notlar" value={form.notes} onChangeText={v => setForm(p => ({ ...p, notes: v }))} placeholder="Opsiyonel not" multiline />
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  addBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.primary },
  summaryCard: { backgroundColor: COLORS.primary, marginHorizontal: SPACE[5], marginTop: SPACE[4], borderRadius: RADIUS.xl, padding: SPACE[5], gap: SPACE[1] },
  summaryLabel: { fontSize: FONT.xs, color: 'rgba(0,0,0,0.5)', fontWeight: FONT.medium },
  summaryValue: { fontSize: FONT['3xl'], fontWeight: FONT.extrabold, color: COLORS.white },
  summaryMeta: { marginTop: 4 },
  summaryMetaText: { fontSize: FONT.xs, color: 'rgba(0,0,0,0.5)' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: 'transparent', justifyContent: 'center' },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white },
  list: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[10] },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  info: { flex: 1, gap: 3 },
  name: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  desc: { fontSize: FONT.xs, color: COLORS.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dueDate: { fontSize: FONT.xs, color: COLORS.textMuted },
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
