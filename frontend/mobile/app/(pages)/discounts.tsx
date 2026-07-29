import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { PatternOverlay } from '@/components/ui/PatternOverlay';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { FormField } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Coupon } from '@/types';
import api from '@/lib/api';

export default function DiscountsScreen() {
  const insets = useSafeAreaInsets();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const toast = useToast();
  const { data } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => { const res = await api.get('/coupons'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
  });
  const list = data as Coupon[] | undefined;

  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; item?: Coupon }>({ open: false });
  // Backend CouponDto/Create/UpdateCouponCommand (CouponsController.cs) has no "name",
  // "startDate" or "scope" concept — coupons are identified by a unique Code, with an
  // optional free-text Description, and apply account-wide (no scoping).
  const [form, setForm] = useState({ code: '', description: '', discountType: 'percentage' as 'percentage' | 'fixedAmount', discountValue: '', minimumOrderAmount: '', expiresAt: '', usageLimit: '', isActive: true });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/coupons', { code: form.code, description: form.description || undefined, discountType: form.discountType, discountValue: Number(form.discountValue), minimumOrderAmount: form.minimumOrderAmount ? Number(form.minimumOrderAmount) : undefined, expiresAt: form.expiresAt || undefined, usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coupons'] }); setModal({ open: false }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'İndirim eklenemedi.'),
  });
  const updateMutation = useMutation({
    // isActive must always be sent — UpdateCouponCommand.IsActive is a non-nullable
    // bool, so omitting it defaults to false on deserialization and silently
    // deactivates the coupon on every edit.
    mutationFn: async () => api.put(`/coupons/${modal.item!.id}`, { code: form.code, description: form.description || undefined, discountType: form.discountType, discountValue: Number(form.discountValue), minimumOrderAmount: form.minimumOrderAmount ? Number(form.minimumOrderAmount) : undefined, expiresAt: form.expiresAt || undefined, usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined, isActive: form.isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coupons'] }); setModal({ open: false }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'İndirim güncellenemedi.'),
  });
  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/coupons/${modal.item!.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coupons'] }); setModal({ open: false }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'İndirim silinemedi.'),
  });

  function openCreate() { setForm({ code: '', description: '', discountType: 'percentage', discountValue: '', minimumOrderAmount: '', expiresAt: '', usageLimit: '', isActive: true }); setModal({ open: true, item: undefined }); }
  function openEdit(item: Coupon) { setForm({ code: item.code, description: item.description ?? '', discountType: item.discountType, discountValue: String(item.discountValue), minimumOrderAmount: item.minimumOrderAmount ? String(item.minimumOrderAmount) : '', expiresAt: item.expiresAt ?? '', usageLimit: item.usageLimit ? String(item.usageLimit) : '', isActive: item.isActive }); setModal({ open: true, item }); }
  function handleSave() {
    if (!form.code || !form.discountValue) { toast.warning('Kod ve indirim değeri zorunludur.'); return; }
    if (modal.item) updateMutation.mutate(); else createMutation.mutate();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <PatternOverlay opacity={0.25} />
      <ScreenHeader title="İndirimler" subtitle={`${(list ?? []).filter(d => d.isActive).length} aktif`} showBack
        right={<TouchableOpacity style={styles.addBtn} onPress={openCreate} accessibilityRole="button" accessibilityLabel="Ekle"><Ionicons name="add" size={22} color={STATIC_WHITE} /></TouchableOpacity>}
      />
      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
        ListEmptyComponent={<EmptyState icon="pricetag-outline" title="İndirim yok" />}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.9} onPress={() => openEdit(item)} style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.discountCircle, { backgroundColor: item.isActive ? COLORS.primaryLight : COLORS.surfaceAlt }]}>
                <Text style={[styles.discountValue, { color: item.isActive ? COLORS.primaryDark : COLORS.textMuted }]}>
                  {item.discountType === 'percentage' ? `%${item.discountValue}` : `${item.discountValue}₺`}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.code}</Text>
                {item.description ? <Text style={styles.metaText}>{item.description}</Text> : null}
                <View style={styles.meta}>
                  <Text style={styles.metaText}>{item.expiresAt ? `Son: ${formatDate(item.expiresAt)}` : 'Süresiz'}</Text>
                </View>
              </View>
              <Badge variant={item.isActive ? 'success' : 'default'} size="sm">{item.isActive ? 'Aktif' : 'Pasif'}</Badge>
            </View>
            <View style={styles.stats}>
              {item.minimumOrderAmount && (
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Min. Tutar</Text>
                  <Text style={styles.statValue}>{formatCurrency(item.minimumOrderAmount)}</Text>
                </View>
              )}
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Kullanım</Text>
                <Text style={styles.statValue}>{item.usageCount}{item.usageLimit ? `/${item.usageLimit}` : ''}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      <FormModal
        visible={modal.open}
        onClose={() => setModal({ open: false })}
        onSave={handleSave}
        title={modal.item ? 'İndirim Düzenle' : 'Yeni İndirim'}
        saving={createMutation.isPending || updateMutation.isPending}
        deleteLabel={modal.item ? 'Sil' : undefined}
        onDelete={modal.item ? () => deleteMutation.mutate() : undefined}
      >
        <FormField label="Kod" value={form.code} onChangeText={v => setForm(p => ({ ...p, code: v }))} placeholder="Örn: HOSGELDIN20" />
        <FormField label="Açıklama" value={form.description} onChangeText={v => setForm(p => ({ ...p, description: v }))} placeholder="İsteğe bağlı" />
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>İndirim Türü</Text>
          <View style={styles.segmentRow}>
            <TouchableOpacity style={[styles.segment, form.discountType === 'percentage' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, discountType: 'percentage' }))}><Text style={[styles.segmentText, form.discountType === 'percentage' && styles.segmentTextActive]}>Yüzde</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.segment, form.discountType === 'fixedAmount' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, discountType: 'fixedAmount' }))}><Text style={[styles.segmentText, form.discountType === 'fixedAmount' && styles.segmentTextActive]}>Sabit</Text></TouchableOpacity>
          </View>
        </View>
        <FormField label="İndirim Değeri" value={form.discountValue} onChangeText={v => setForm(p => ({ ...p, discountValue: v }))} placeholder={form.discountType === 'percentage' ? 'Örn: 20' : 'Örn: 150'} keyboardType="numeric" />
        <FormField label="Min. Tutar" value={form.minimumOrderAmount} onChangeText={v => setForm(p => ({ ...p, minimumOrderAmount: v }))} placeholder="Zorunlu değil" keyboardType="numeric" />
        <FormField label="Son Kullanım Tarihi" value={form.expiresAt} onChangeText={v => setForm(p => ({ ...p, expiresAt: v }))} placeholder="Zorunlu değil, örn: 2025-12-31" />
        <FormField label="Kullanım Limiti" value={form.usageLimit} onChangeText={v => setForm(p => ({ ...p, usageLimit: v }))} placeholder="Sınırsız için boş bırakın" keyboardType="numeric" />
      </FormModal>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  addBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.primary },
  list: { paddingHorizontal: SPACE[5], paddingVertical: SPACE[4], paddingBottom: SPACE[10] },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  discountCircle: { width: 56, height: 56, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  discountValue: { fontSize: FONT.base, fontWeight: FONT.extrabold },
  info: { flex: 1, gap: 3 },
  name: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  meta: { flexDirection: 'row', gap: SPACE[2] },
  metaText: { fontSize: FONT.xs, color: COLORS.textMuted },
  stats: { flexDirection: 'row', gap: SPACE[4], borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: SPACE[3] },
  stat: { gap: 2 },
  statLabel: { fontSize: 10, color: COLORS.textMuted },
  statValue: { fontSize: FONT.xs, fontWeight: FONT.semibold, color: COLORS.text },
  fieldGroup: { gap: SPACE[1] },
  fieldLabel: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  segmentRow: { flexDirection: 'row', backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, padding: 3 },
  segment: { flex: 1, paddingVertical: SPACE[2], alignItems: 'center', borderRadius: RADIUS.md },
  segmentActive: { backgroundColor: COLORS.surface, ...SHADOW.sm },
  segmentText: { fontSize: FONT.sm, fontWeight: FONT.medium, color: COLORS.textMuted },
  segmentTextActive: { color: COLORS.text, fontWeight: FONT.semibold },
});
