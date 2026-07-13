import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
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
import type { Debt } from '@/types';
import api from '@/lib/api';

export default function DebtsScreen() {
  const insets = useSafeAreaInsets();
  const { data } = useQuery({
    queryKey: ['debts'],
    queryFn: async () => { const res = await api.get('/debts'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
  });
  const list = data as Debt[] | undefined;
  const TOTAL = (list ?? []).filter(d => d.status !== 'paid').reduce((s, d) => s + d.amount, 0);

  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; item?: Debt }>({ open: false });
  const [form, setForm] = useState({ customerName: '', description: '', amount: '', dueDate: '', status: 'pending' as 'pending' | 'paid' | 'overdue', notes: '' });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/debts', { customerName: form.customerName, description: form.description, amount: Number(form.amount), dueDate: form.dueDate, status: form.status, notes: form.notes || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['debts'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Borç eklenemedi.'),
  });
  const updateMutation = useMutation({
    mutationFn: async () => api.put(`/debts/${modal.item!.id}`, { customerName: form.customerName, description: form.description, amount: Number(form.amount), dueDate: form.dueDate, status: form.status, notes: form.notes || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['debts'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Borç güncellenemedi.'),
  });
  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/debts/${modal.item!.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['debts'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Borç silinemedi.'),
  });

  function openCreate() { setForm({ customerName: '', description: '', amount: '', dueDate: '', status: 'pending', notes: '' }); setModal({ open: true, item: undefined }); }
  function openEdit(item: Debt) { setForm({ customerName: item.customerName ?? '', description: item.description ?? '', amount: String(item.amount), dueDate: item.dueDate ?? '', status: item.status, notes: item.notes ?? '' }); setModal({ open: true, item }); }
  function handleSave() {
    if (!form.customerName || !form.amount || !form.dueDate) { Alert.alert('Uyarı', 'Müşteri adı, tutar ve vade tarihi zorunludur.'); return; }
    if (modal.item) updateMutation.mutate(); else createMutation.mutate();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Borçlar" showBack
        right={<TouchableOpacity style={styles.addBtn} onPress={openCreate}><Ionicons name="add" size={22} color={COLORS.black} /></TouchableOpacity>}
      />
      <View style={styles.banner}>
        <Ionicons name="trending-down" size={24} color={COLORS.error} />
        <View>
          <Text style={styles.bannerLabel}>Toplam Borç</Text>
          <Text style={styles.bannerValue}>{formatCurrency(TOTAL)}</Text>
        </View>
        <View style={styles.bannerMeta}>
          <Text style={styles.bannerMetaText}>{(list ?? []).filter(d => d.status === 'overdue').length} gecikmiş</Text>
        </View>
      </View>
      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
        ListEmptyComponent={<EmptyState icon="trending-down-outline" title="Borç yok" />}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.9} onPress={() => openEdit(item)} style={[styles.card, item.status === 'overdue' && styles.cardOverdue]}>
            <View style={[styles.iconBox, { backgroundColor: item.status === 'overdue' ? COLORS.errorLight : item.status === 'paid' ? COLORS.successLight : COLORS.warningLight }]}>
              <Ionicons name="business" size={22} color={item.status === 'overdue' ? COLORS.error : item.status === 'paid' ? COLORS.success : COLORS.warning} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.customerName ?? item.creditorName}</Text>
              <Text style={styles.desc}>{item.description}</Text>
              <View style={styles.row}>
                <Ionicons name="calendar-outline" size={12} color={item.status === 'overdue' ? COLORS.error : COLORS.textMuted} />
                <Text style={[styles.date, item.status === 'overdue' && { color: COLORS.error }]}>Vade: {item.dueDate ? formatDate(item.dueDate) : '-'}</Text>
              </View>
            </View>
            <View style={styles.right}>
              <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
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
        title={modal.item ? 'Borç Düzenle' : 'Yeni Borç'}
        saving={createMutation.isPending || updateMutation.isPending}
        deleteLabel={modal.item ? 'Sil' : undefined}
        onDelete={modal.item ? () => deleteMutation.mutate() : undefined}
      >
        <FormField label="Müşteri Adı" value={form.customerName} onChangeText={v => setForm(p => ({ ...p, customerName: v }))} placeholder="Örn: Ahmet Yılmaz" />
        <FormField label="Açıklama" value={form.description} onChangeText={v => setForm(p => ({ ...p, description: v }))} placeholder="Örn: Malzeme bedeli" />
        <FormField label="Tutar" value={form.amount} onChangeText={v => setForm(p => ({ ...p, amount: v }))} placeholder="Örn: 500" keyboardType="numeric" />
        <FormField label="Vade Tarihi" value={form.dueDate} onChangeText={v => setForm(p => ({ ...p, dueDate: v }))} placeholder="Örn: 2025-06-15" />
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Durum</Text>
          <View style={styles.segmentRow}>
            <TouchableOpacity style={[styles.segment, form.status === 'pending' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, status: 'pending' }))}><Text style={[styles.segmentText, form.status === 'pending' && styles.segmentTextActive]}>Bekliyor</Text></TouchableOpacity>
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
  banner: { flexDirection: 'row', alignItems: 'center', gap: SPACE[4], backgroundColor: COLORS.errorLight, marginHorizontal: SPACE[5], marginTop: SPACE[4], marginBottom: SPACE[2], borderRadius: RADIUS.xl, padding: SPACE[4], borderWidth: 1, borderColor: COLORS.error + '30' },
  bannerLabel: { fontSize: FONT.xs, color: COLORS.error, fontWeight: FONT.medium },
  bannerValue: { fontSize: FONT.xl, fontWeight: FONT.extrabold, color: COLORS.error },
  bannerMeta: { marginLeft: 'auto' },
  bannerMetaText: { fontSize: FONT.xs, color: COLORS.error, fontWeight: FONT.medium },
  list: { paddingHorizontal: SPACE[5], paddingVertical: SPACE[3], paddingBottom: SPACE[10] },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  cardOverdue: { borderColor: COLORS.error + '40', borderWidth: 1.5 },
  iconBox: { width: 48, height: 48, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 3 },
  name: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  desc: { fontSize: FONT.xs, color: COLORS.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
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
