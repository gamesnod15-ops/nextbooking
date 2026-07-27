import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { FormField } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { GiftCoupon } from '@/types';
import api from '@/lib/api';

export default function GiftCouponsScreen() {
  const insets = useSafeAreaInsets();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const toast = useToast();
  const { data } = useQuery({
    queryKey: ['gift-coupons'],
    queryFn: async () => { const res = await api.get('/gift-coupons'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
  });
  const list = data as GiftCoupon[] | undefined;

  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; item?: GiftCoupon }>({ open: false });
  // Gift coupons are a distinct entity from regular Coupons (see GiftCouponsController.cs /
  // Features/GiftCoupons) — they carry a fixed pre-paid Amount and a recipient, not a
  // percentage/scope discount rule. Code and Amount can only be set at creation time;
  // UpdateGiftCouponCommand only allows editing the recipient/expiry/message.
  const [form, setForm] = useState({ code: '', amount: '', recipientName: '', recipientEmail: '', purchasedBy: '', expiryDate: '', message: '' });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/gift-coupons', { code: form.code, amount: Number(form.amount), recipientName: form.recipientName, recipientEmail: form.recipientEmail || undefined, purchasedBy: form.purchasedBy, expiryDate: form.expiryDate || undefined, message: form.message || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gift-coupons'] }); setModal({ open: false }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Hediye kuponu eklenemedi.'),
  });
  const updateMutation = useMutation({
    mutationFn: async () => api.put(`/gift-coupons/${modal.item!.id}`, { recipientName: form.recipientName, recipientEmail: form.recipientEmail || undefined, purchasedBy: form.purchasedBy, expiryDate: form.expiryDate || undefined, message: form.message || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gift-coupons'] }); setModal({ open: false }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Hediye kuponu güncellenemedi.'),
  });
  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/gift-coupons/${modal.item!.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gift-coupons'] }); setModal({ open: false }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Hediye kuponu silinemedi.'),
  });

  function openCreate() { setForm({ code: '', amount: '', recipientName: '', recipientEmail: '', purchasedBy: '', expiryDate: '', message: '' }); setModal({ open: true, item: undefined }); }
  function openEdit(item: GiftCoupon) { setForm({ code: item.code, amount: String(item.amount), recipientName: item.recipientName, recipientEmail: item.recipientEmail ?? '', purchasedBy: item.purchasedBy, expiryDate: item.expiryDate ?? '', message: item.message ?? '' }); setModal({ open: true, item }); }
  function handleSave() {
    if (!modal.item && (!form.code || !form.amount)) { toast.warning('Kod ve tutar zorunludur.'); return; }
    if (!form.recipientName || !form.purchasedBy) { toast.warning('Alıcı adı ve satın alan zorunludur.'); return; }
    if (modal.item) updateMutation.mutate(); else createMutation.mutate();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Hediye Kuponları" subtitle={`${(list ?? []).filter(c => c.status === 'active').length} aktif`} showBack
        right={<TouchableOpacity style={styles.addBtn} onPress={openCreate} accessibilityRole="button" accessibilityLabel="Ekle"><Ionicons name="add" size={22} color={STATIC_WHITE} /></TouchableOpacity>}
      />
      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
        ListEmptyComponent={<EmptyState icon="gift-outline" title="Kupon yok" />}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.9} onPress={() => openEdit(item)} style={[styles.card, item.status !== 'active' && styles.cardUsed]}>
            <View style={styles.left}>
              <View style={[styles.iconBox, { backgroundColor: item.status === 'active' ? COLORS.primaryLight : COLORS.surfaceAlt }]}>
                <Ionicons name="gift" size={24} color={item.status === 'active' ? COLORS.primaryDark : COLORS.textMuted} />
              </View>
              <View style={styles.codeBox}>
                <Text style={styles.code}>{item.code}</Text>
                <Text style={styles.expires}>{item.recipientName} · {item.expiryDate ? `Son: ${formatDate(item.expiryDate)}` : 'Süresiz'}</Text>
              </View>
            </View>
            <View style={styles.right}>
              <Text style={[styles.amount, item.status !== 'active' && styles.textMuted]}>
                {formatCurrency(item.amount - item.usedAmount)}
              </Text>
              <Badge variant={item.status === 'active' ? 'success' : 'default'} size="sm">{item.status === 'active' ? 'Aktif' : item.status === 'used' ? 'Kullanıldı' : 'Süresi Doldu'}</Badge>
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
        {!modal.item && (
          <>
            <FormField label="Kod" value={form.code} onChangeText={v => setForm(p => ({ ...p, code: v }))} placeholder="Örn: HEDİYE20" />
            <FormField label="Tutar" value={form.amount} onChangeText={v => setForm(p => ({ ...p, amount: v }))} placeholder="Örn: 150" keyboardType="numeric" />
          </>
        )}
        <FormField label="Alıcı Adı" value={form.recipientName} onChangeText={v => setForm(p => ({ ...p, recipientName: v }))} placeholder="Örn: Ayşe Yılmaz" />
        <FormField label="Alıcı E-postası" value={form.recipientEmail} onChangeText={v => setForm(p => ({ ...p, recipientEmail: v }))} placeholder="İsteğe bağlı" keyboardType="email-address" />
        <FormField label="Satın Alan" value={form.purchasedBy} onChangeText={v => setForm(p => ({ ...p, purchasedBy: v }))} placeholder="Örn: Mehmet Kaya" />
        <FormField label="Son Kullanım Tarihi" value={form.expiryDate} onChangeText={v => setForm(p => ({ ...p, expiryDate: v }))} placeholder="İsteğe bağlı, örn: 2025-12-31" />
        <FormField label="Mesaj" value={form.message} onChangeText={v => setForm(p => ({ ...p, message: v }))} placeholder="İsteğe bağlı" multiline />
      </FormModal>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
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
