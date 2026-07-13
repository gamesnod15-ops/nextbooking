import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { FormField } from '@/components/ui/FormField';
import { formatCurrency } from '@/lib/utils';
import type { Commission } from '@/types';
import api from '@/lib/api';

export default function CommissionsScreen() {
  const insets = useSafeAreaInsets();
  const { data } = useQuery({
    queryKey: ['commissions'],
    queryFn: async () => { const res = await api.get('/commissions'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
  });
  const list = data as Commission[] | undefined;
  const totalPending = (list ?? []).filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0);

  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; item?: Commission }>({ open: false });
  const [form, setForm] = useState({ employeeName: '', period: '', amount: '', status: 'pending' as 'pending' | 'paid', description: '', notes: '' });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/commissions', { employeeName: form.employeeName, period: form.period, amount: Number(form.amount), status: form.status, description: form.description || undefined, notes: form.notes || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['commissions'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Komisyon eklenemedi.'),
  });
  const updateMutation = useMutation({
    mutationFn: async () => api.put(`/commissions/${modal.item!.id}`, { employeeName: form.employeeName, period: form.period, amount: Number(form.amount), status: form.status, description: form.description || undefined, notes: form.notes || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['commissions'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Komisyon güncellenemedi.'),
  });
  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/commissions/${modal.item!.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['commissions'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Komisyon silinemedi.'),
  });

  function openCreate() { setForm({ employeeName: '', period: '', amount: '', status: 'pending', description: '', notes: '' }); setModal({ open: true, item: undefined }); }
  function openEdit(item: Commission) { setForm({ employeeName: item.employeeName, period: item.period, amount: String(item.amount), status: item.status, description: item.description ?? '', notes: item.notes ?? '' }); setModal({ open: true, item }); }
  function handleSave() {
    if (!form.employeeName || !form.period || !form.amount) { Alert.alert('Uyarı', 'Çalışan adı, dönem ve tutar zorunludur.'); return; }
    if (modal.item) updateMutation.mutate(); else createMutation.mutate();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Komisyonlar" showBack
        right={<TouchableOpacity style={styles.addBtn} onPress={openCreate}><Ionicons name="add" size={22} color={COLORS.black} /></TouchableOpacity>}
      />
      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>Bekleyen Ödemeler</Text>
        <Text style={styles.bannerValue}>{formatCurrency(totalPending)}</Text>
      </View>
      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
        ListEmptyComponent={<EmptyState icon="cash-outline" title="Komisyon yok" />}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.9} onPress={() => openEdit(item)} style={styles.card}>
            <Avatar name={item.employeeName} size={44} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.employeeName}</Text>
              <Text style={styles.period}>{item.period}{item.description ? ` · ${item.description}` : ''}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
              <View style={[styles.statusDot, { backgroundColor: item.status === 'paid' ? COLORS.success : COLORS.warning }]} />
            </View>
          </TouchableOpacity>
        )}
      />
      <FormModal
        visible={modal.open}
        onClose={() => setModal({ open: false })}
        onSave={handleSave}
        title={modal.item ? 'Komisyon Düzenle' : 'Yeni Komisyon'}
        saving={createMutation.isPending || updateMutation.isPending}
        deleteLabel={modal.item ? 'Sil' : undefined}
        onDelete={modal.item ? () => deleteMutation.mutate() : undefined}
      >
        <FormField label="Çalışan Adı" value={form.employeeName} onChangeText={v => setForm(p => ({ ...p, employeeName: v }))} placeholder="Örn: Ayşe Demir" />
        <FormField label="Dönem" value={form.period} onChangeText={v => setForm(p => ({ ...p, period: v }))} placeholder="Örn: 2025-06" />
        <FormField label="Tutar" value={form.amount} onChangeText={v => setForm(p => ({ ...p, amount: v }))} placeholder="Örn: 2500" keyboardType="numeric" />
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Durum</Text>
          <View style={styles.segmentRow}>
            <TouchableOpacity style={[styles.segment, form.status === 'pending' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, status: 'pending' }))}><Text style={[styles.segmentText, form.status === 'pending' && styles.segmentTextActive]}>Bekliyor</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.segment, form.status === 'paid' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, status: 'paid' }))}><Text style={[styles.segmentText, form.status === 'paid' && styles.segmentTextActive]}>Ödendi</Text></TouchableOpacity>
          </View>
        </View>
        <FormField label="Açıklama" value={form.description} onChangeText={v => setForm(p => ({ ...p, description: v }))} placeholder="Opsiyonel açıklama" />
        <FormField label="Notlar" value={form.notes} onChangeText={v => setForm(p => ({ ...p, notes: v }))} placeholder="Opsiyonel not" multiline />
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  addBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.primary },
  banner: { backgroundColor: COLORS.surface, margin: SPACE[5], borderRadius: RADIUS.xl, padding: SPACE[5], gap: SPACE[1], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  bannerLabel: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: FONT.medium },
  bannerValue: { fontSize: FONT['2xl'], fontWeight: FONT.extrabold, color: COLORS.text },
  list: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[10] },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  info: { flex: 1, gap: 3 },
  name: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  period: { fontSize: FONT.xs, color: COLORS.textMuted },
  right: { alignItems: 'flex-end', gap: SPACE[2] },
  amount: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  fieldGroup: { gap: SPACE[1] },
  fieldLabel: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  segmentRow: { flexDirection: 'row', backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, padding: 3 },
  segment: { flex: 1, paddingVertical: SPACE[2], alignItems: 'center', borderRadius: RADIUS.md },
  segmentActive: { backgroundColor: COLORS.surface, ...SHADOW.sm },
  segmentText: { fontSize: FONT.sm, fontWeight: FONT.medium, color: COLORS.textMuted },
  segmentTextActive: { color: COLORS.text, fontWeight: FONT.semibold },
});
