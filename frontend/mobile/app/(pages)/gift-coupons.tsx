import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { FormField } from '@/components/ui/FormField';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Coupon } from '@/types';
import api from '@/lib/api';

export default function GiftCouponsScreen() {
  const insets = useSafeAreaInsets();
  const { data } = useQuery({
    queryKey: ['gift-coupons'],
    queryFn: async () => { const res = await api.get('/gift-coupons'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
  });
  const list = data as Coupon[] | undefined;

  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; item?: Coupon }>({ open: false });
  const [form, setForm] = useState({ name: '', code: '', type: 'percentage' as 'percentage' | 'fixed', value: '', minAmount: '', startDate: '', endDate: '', usageLimit: '', scope: 'all' });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/coupons', { name: form.name, code: form.code || undefined, type: form.type, value: Number(form.value), minAmount: form.minAmount ? Number(form.minAmount) : undefined, startDate: form.startDate, endDate: form.endDate, usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined, scope: form.scope }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gift-coupons'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Kupon eklenemedi.'),
  });
  const updateMutation = useMutation({
    mutationFn: async () => api.put(`/coupons/${modal.item!.id}`, { name: form.name, code: form.code || undefined, type: form.type, value: Number(form.value), minAmount: form.minAmount ? Number(form.minAmount) : undefined, startDate: form.startDate, endDate: form.endDate, usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined, scope: form.scope }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gift-coupons'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Kupon güncellenemedi.'),
  });
  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/coupons/${modal.item!.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gift-coupons'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Kupon silinemedi.'),
  });

  function openCreate() { setForm({ name: '', code: '', type: 'percentage', value: '', minAmount: '', startDate: '', endDate: '', usageLimit: '', scope: 'all' }); setModal({ open: true, item: undefined }); }
  function openEdit(item: Coupon) { setForm({ name: item.name, code: item.code ?? '', type: item.type, value: String(item.value), minAmount: item.minAmount ? String(item.minAmount) : '', startDate: item.startDate, endDate: item.endDate, usageLimit: item.usageLimit ? String(item.usageLimit) : '', scope: item.scope }); setModal({ open: true, item }); }
  function handleSave() {
    if (!form.name || !form.value || !form.startDate || !form.endDate) { Alert.alert('Uyarı', 'Ad, değer, başlangıç ve bitiş tarihi zorunludur.'); return; }
    if (modal.item) updateMutation.mutate(); else createMutation.mutate();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Hediye Kuponları" subtitle={`${(list ?? []).filter(c => c.isActive).length} aktif`} showBack
        right={<TouchableOpacity style={styles.addBtn} onPress={openCreate}><Ionicons name="add" size={22} color={COLORS.black} /></TouchableOpacity>}
      />
      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
        ListEmptyComponent={<EmptyState icon="gift-outline" title="Kupon yok" />}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.9} onPress={() => openEdit(item)} style={[styles.card, !item.isActive && styles.cardUsed]}>
            <View style={styles.left}>
              <View style={[styles.iconBox, { backgroundColor: item.isActive ? COLORS.primaryLight : COLORS.surfaceAlt }]}>
                <Ionicons name="gift" size={24} color={item.isActive ? COLORS.primaryDark : COLORS.textMuted} />
              </View>
              <View style={styles.codeBox}>
                <Text style={styles.code}>{item.code || item.name}</Text>
                <Text style={styles.expires}>Son: {item.endDate ? formatDate(item.endDate) : '-'}</Text>
              </View>
            </View>
            <View style={styles.right}>
              <Text style={[styles.amount, !item.isActive && styles.textMuted]}>
                {item.type === 'percentage' ? `%${item.value}` : formatCurrency(item.value)}
              </Text>
              <Badge variant={item.isActive ? 'success' : 'default'} size="sm">{item.isActive ? 'Aktif' : 'Bitti'}</Badge>
            </View>
          </TouchableOpacity>
        )}
      />
      <FormModal
        visible={modal.open}
        onClose={() => setModal({ open: false })}
        onSave={handleSave}
        title={modal.item ? 'Kupon Düzenle' : 'Yeni Kupon'}
        saving={createMutation.isPending || updateMutation.isPending}
        deleteLabel={modal.item ? 'Sil' : undefined}
        onDelete={modal.item ? () => deleteMutation.mutate() : undefined}
      >
        <FormField label="Ad" value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} placeholder="Örn: Hediye Kuponu" />
        <FormField label="Kod" value={form.code} onChangeText={v => setForm(p => ({ ...p, code: v }))} placeholder="Opsiyonel: HEDİYE20" />
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>İndirim Türü</Text>
          <View style={styles.segmentRow}>
            <TouchableOpacity style={[styles.segment, form.type === 'percentage' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, type: 'percentage' }))}><Text style={[styles.segmentText, form.type === 'percentage' && styles.segmentTextActive]}>Yüzde</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.segment, form.type === 'fixed' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, type: 'fixed' }))}><Text style={[styles.segmentText, form.type === 'fixed' && styles.segmentTextActive]}>Sabit</Text></TouchableOpacity>
          </View>
        </View>
        <FormField label="Değer" value={form.value} onChangeText={v => setForm(p => ({ ...p, value: v }))} placeholder={form.type === 'percentage' ? 'Örn: 20' : 'Örn: 150'} keyboardType="numeric" />
        <FormField label="Min. Tutar" value={form.minAmount} onChangeText={v => setForm(p => ({ ...p, minAmount: v }))} placeholder="Zorunlu değil" keyboardType="numeric" />
        <FormField label="Başlangıç Tarihi" value={form.startDate} onChangeText={v => setForm(p => ({ ...p, startDate: v }))} placeholder="Örn: 2025-01-01" />
        <FormField label="Bitiş Tarihi" value={form.endDate} onChangeText={v => setForm(p => ({ ...p, endDate: v }))} placeholder="Örn: 2025-12-31" />
        <FormField label="Kullanım Limiti" value={form.usageLimit} onChangeText={v => setForm(p => ({ ...p, usageLimit: v }))} placeholder="Sınırsız için boş bırakın" keyboardType="numeric" />
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Kapsam</Text>
          <View style={styles.segmentRow}>
            <TouchableOpacity style={[styles.segment, form.scope === 'all' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, scope: 'all' }))}><Text style={[styles.segmentText, form.scope === 'all' && styles.segmentTextActive]}>Tümü</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.segment, form.scope === 'service' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, scope: 'service' }))}><Text style={[styles.segmentText, form.scope === 'service' && styles.segmentTextActive]}>Hizmet</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.segment, form.scope === 'package' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, scope: 'package' }))}><Text style={[styles.segmentText, form.scope === 'package' && styles.segmentTextActive]}>Paket</Text></TouchableOpacity>
          </View>
        </View>
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  addBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.primary },
  list: { paddingHorizontal: SPACE[5], paddingVertical: SPACE[4], paddingBottom: SPACE[10] },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  cardUsed: { opacity: 0.6 },
  left: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], flex: 1 },
  iconBox: { width: 48, height: 48, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  codeBox: { gap: 3 },
  code: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.text, letterSpacing: 1 },
  expires: { fontSize: FONT.xs, color: COLORS.textMuted },
  right: { alignItems: 'flex-end', gap: SPACE[2] },
  amount: { fontSize: FONT.lg, fontWeight: FONT.bold, color: COLORS.text },
  remaining: { fontSize: FONT.xs, color: COLORS.textMuted },
  textMuted: { color: COLORS.textMuted },
  fieldGroup: { gap: SPACE[1] },
  fieldLabel: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  segmentRow: { flexDirection: 'row', backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, padding: 3 },
  segment: { flex: 1, paddingVertical: SPACE[2], alignItems: 'center', borderRadius: RADIUS.md },
  segmentActive: { backgroundColor: COLORS.surface, ...SHADOW.sm },
  segmentText: { fontSize: FONT.sm, fontWeight: FONT.medium, color: COLORS.textMuted },
  segmentTextActive: { color: COLORS.text, fontWeight: FONT.semibold },
});
