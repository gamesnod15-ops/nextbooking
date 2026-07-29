import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
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
import { SkeletonList } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Debt, DebtCategory } from '@/types';
import api from '@/lib/api';

// Backend DebtRecord/DebtsFeature.cs: CreateDebtCommand/UpdateDebtCommand take
// (Title, TotalAmount, DueDate, Category, CreditorName?, Description?). There is
// no client-settable "status" or "notes" field — Status is derived server-side
// from PaidAmount/DueDate, and paying down a debt is a separate POST {id}/pay
// endpoint taking { amount }.
const CATEGORY_OPTIONS: { value: DebtCategory; label: string }[] = [
  { value: 'supplier', label: 'Tedarikçi' },
  { value: 'rent', label: 'Kira' },
  { value: 'equipment', label: 'Ekipman' },
  { value: 'loan', label: 'Kredi' },
  { value: 'tax', label: 'Vergi' },
  { value: 'other', label: 'Diğer' },
];
const CATEGORY_LABEL: Record<DebtCategory, string> = CATEGORY_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }), {} as Record<DebtCategory, string>,
);

const STATUS_LABEL: Record<Debt['status'], string> = {
  open: 'Açık',
  partiallyPaid: 'Kısmi Ödendi',
  paid: 'Ödendi',
  overdue: 'Gecikmiş',
};
const STATUS_BADGE: Record<Debt['status'], 'success' | 'error' | 'warning' | 'info'> = {
  open: 'info',
  partiallyPaid: 'warning',
  paid: 'success',
  overdue: 'error',
};

export default function DebtsScreen() {
  const insets = useSafeAreaInsets();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const toast = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ['debts'],
    queryFn: async () => { const res = await api.get('/debts'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
  });
  const list = data as Debt[] | undefined;
  const TOTAL_REMAINING = (list ?? []).filter(d => d.status !== 'paid').reduce((s, d) => s + d.remainingAmount, 0);
  const OVERDUE_COUNT = (list ?? []).filter(d => d.status === 'overdue').length;

  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; item?: Debt }>({ open: false });
  const [payModal, setPayModal] = useState<{ open: boolean; item?: Debt }>({ open: false });
  const [form, setForm] = useState({
    title: '', totalAmount: '', dueDate: '', category: 'other' as DebtCategory,
    creditorName: '', description: '',
  });
  const [payAmount, setPayAmount] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => api.post('/debts', {
      title: form.title,
      totalAmount: Number(form.totalAmount),
      dueDate: form.dueDate,
      category: form.category,
      creditorName: form.creditorName || undefined,
      description: form.description || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['debts'] }); setModal({ open: false }); toast.success('Borç eklendi.'); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Borç eklenemedi.'),
  });
  const updateMutation = useMutation({
    mutationFn: async () => api.put(`/debts/${modal.item!.id}`, {
      id: modal.item!.id,
      title: form.title,
      totalAmount: Number(form.totalAmount),
      dueDate: form.dueDate,
      category: form.category,
      creditorName: form.creditorName || undefined,
      description: form.description || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['debts'] }); setModal({ open: false }); toast.success('Borç güncellendi.'); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Borç güncellenemedi.'),
  });
  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/debts/${modal.item!.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['debts'] }); setModal({ open: false }); toast.success('Borç silindi.'); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Borç silinemedi.'),
  });
  const payMutation = useMutation({
    mutationFn: async () => api.post(`/debts/${payModal.item!.id}/pay`, { amount: Number(payAmount) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['debts'] }); setPayModal({ open: false }); toast.success('Ödeme kaydedildi.'); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Ödeme kaydedilemedi.'),
  });

  function openCreate() {
    setForm({ title: '', totalAmount: '', dueDate: '', category: 'other', creditorName: '', description: '' });
    setModal({ open: true, item: undefined });
  }
  function openEdit(item: Debt) {
    setForm({
      title: item.title,
      totalAmount: String(item.totalAmount),
      dueDate: item.dueDate ?? '',
      category: item.category,
      creditorName: item.creditorName ?? '',
      description: item.description ?? '',
    });
    setModal({ open: true, item });
  }
  function handleSave() {
    if (!form.title || !form.totalAmount || !form.dueDate) { toast.warning('Başlık, tutar ve vade tarihi zorunludur.'); return; }
    if (modal.item) updateMutation.mutate(); else createMutation.mutate();
  }

  function openPay(item: Debt) {
    setPayAmount('');
    setPayModal({ open: true, item });
  }
  function handlePay() {
    const amount = Number(payAmount);
    if (!payAmount || amount <= 0) { toast.warning('Geçerli bir ödeme tutarı girin.'); return; }
    if (payModal.item && amount > payModal.item.remainingAmount) { toast.warning('Tutar kalan borçtan büyük olamaz.'); return; }
    payMutation.mutate();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <PatternOverlay opacity={0.25} />
      <ScreenHeader title="Borçlar" showBack
        right={<TouchableOpacity style={styles.addBtn} onPress={openCreate} accessibilityRole="button" accessibilityLabel="Ekle"><Ionicons name="add" size={22} color={STATIC_WHITE} /></TouchableOpacity>}
      />
      <View style={styles.banner}>
        <Ionicons name="trending-down" size={24} color={COLORS.error} />
        <View>
          <Text style={styles.bannerLabel}>Kalan Borç</Text>
          <Text style={styles.bannerValue}>{formatCurrency(TOTAL_REMAINING)}</Text>
        </View>
        <View style={styles.bannerMeta}>
          <Text style={styles.bannerMetaText}>{OVERDUE_COUNT} gecikmiş</Text>
        </View>
      </View>
      {isLoading ? (
        <SkeletonList count={5} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
          ListEmptyComponent={<EmptyState icon="trending-down-outline" title="Borç yok" />}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.9} onPress={() => openEdit(item)} style={[styles.card, item.status === 'overdue' && styles.cardOverdue]}>
              <View style={styles.cardTop}>
                <View style={[styles.iconBox, { backgroundColor: item.status === 'overdue' ? COLORS.errorLight : item.status === 'paid' ? COLORS.successLight : COLORS.warningLight }]}>
                  <Ionicons name="business" size={22} color={item.status === 'overdue' ? COLORS.error : item.status === 'paid' ? COLORS.success : COLORS.warning} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.title}</Text>
                  <Text style={styles.desc}>{item.creditorName || CATEGORY_LABEL[item.category]}</Text>
                  <View style={styles.row}>
                    <Ionicons name="calendar-outline" size={12} color={item.status === 'overdue' ? COLORS.error : COLORS.textMuted} />
                    <Text style={[styles.date, item.status === 'overdue' && { color: COLORS.error }]}>Vade: {item.dueDate ? formatDate(item.dueDate) : '-'}</Text>
                  </View>
                </View>
                <View style={styles.right}>
                  <Text style={styles.amount}>{formatCurrency(item.remainingAmount)}</Text>
                  <Badge variant={STATUS_BADGE[item.status]} size="sm">{STATUS_LABEL[item.status]}</Badge>
                </View>
              </View>
              {item.status !== 'paid' && (
                <View style={styles.cardFooter}>
                  <Text style={styles.footerText}>{formatCurrency(item.paidAmount)} / {formatCurrency(item.totalAmount)} ödendi</Text>
                  <TouchableOpacity
                    style={styles.payBtn}
                    activeOpacity={0.8}
                    onPress={() => openPay(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title} için ödeme yap`}
                  >
                    <Ionicons name="cash-outline" size={14} color={COLORS.primaryDark} />
                    <Text style={styles.payBtnText}>Ödeme Yap</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
      <FormModal
        visible={modal.open}
        onClose={() => setModal({ open: false })}
        onSave={handleSave}
        title={modal.item ? 'Borç Düzenle' : 'Yeni Borç'}
        saving={createMutation.isPending || updateMutation.isPending}
        deleteLabel={modal.item ? 'Sil' : undefined}
        onDelete={modal.item ? () => deleteMutation.mutate() : undefined}
      >
        <FormField label="Başlık" value={form.title} onChangeText={v => setForm(p => ({ ...p, title: v }))} placeholder="Örn: Kira Ödemesi" />
        <FormField label="Toplam Tutar" value={form.totalAmount} onChangeText={v => setForm(p => ({ ...p, totalAmount: v }))} placeholder="Örn: 5000" keyboardType="numeric" />
        <FormField label="Vade Tarihi" value={form.dueDate} onChangeText={v => setForm(p => ({ ...p, dueDate: v }))} placeholder="Örn: 2025-06-15" />
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Kategori</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.chipRow}>
            {CATEGORY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, form.category === opt.value && styles.chipActive]}
                onPress={() => setForm(p => ({ ...p, category: opt.value }))}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, form.category === opt.value && styles.chipTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <FormField label="Alacaklı (isteğe bağlı)" value={form.creditorName} onChangeText={v => setForm(p => ({ ...p, creditorName: v }))} placeholder="Örn: ABC Tedarik Ltd." />
        <FormField label="Açıklama (isteğe bağlı)" value={form.description} onChangeText={v => setForm(p => ({ ...p, description: v }))} placeholder="İsteğe bağlı not" multiline />
      </FormModal>

      <FormModal
        visible={payModal.open}
        onClose={() => setPayModal({ open: false })}
        onSave={handlePay}
        title={`Ödeme Yap${payModal.item ? ' — ' + payModal.item.title : ''}`}
        saving={payMutation.isPending}
      >
        {payModal.item && (
          <Text style={styles.payInfo}>Kalan: {formatCurrency(payModal.item.remainingAmount)}</Text>
        )}
        <FormField label="Ödeme Tutarı" value={payAmount} onChangeText={setPayAmount} placeholder="Örn: 1000" keyboardType="numeric" />
      </FormModal>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  addBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.primary },
  banner: { flexDirection: 'row', alignItems: 'center', gap: SPACE[4], backgroundColor: COLORS.errorLight, marginHorizontal: SPACE[5], marginTop: SPACE[4], marginBottom: SPACE[2], borderRadius: RADIUS.xl, padding: SPACE[4], borderWidth: 1, borderColor: COLORS.error + '30' },
  bannerLabel: { fontSize: FONT.xs, color: COLORS.error, fontWeight: FONT.medium },
  bannerValue: { fontSize: FONT.xl, fontWeight: FONT.extrabold, color: COLORS.error },
  bannerMeta: { marginLeft: 'auto' },
  bannerMetaText: { fontSize: FONT.xs, color: COLORS.error, fontWeight: FONT.medium },
  list: { paddingHorizontal: SPACE[5], paddingVertical: SPACE[3], paddingBottom: SPACE[10] },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  cardOverdue: { borderColor: COLORS.error + '40', borderWidth: 1.5 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  iconBox: { width: 48, height: 48, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 3 },
  name: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  desc: { fontSize: FONT.xs, color: COLORS.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  date: { fontSize: FONT.xs, color: COLORS.textMuted },
  right: { alignItems: 'flex-end', gap: SPACE[2] },
  amount: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: SPACE[3] },
  footerText: { fontSize: FONT.xs, color: COLORS.textMuted },
  payBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primaryLight, paddingHorizontal: SPACE[3], paddingVertical: SPACE[1], borderRadius: RADIUS.full },
  payBtnText: { fontSize: FONT.xs, fontWeight: FONT.semibold, color: COLORS.primaryDark },
  fieldGroup: { gap: SPACE[1] },
  fieldLabel: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  chipRow: { gap: SPACE[2], paddingVertical: 2 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: 'transparent', justifyContent: 'center', flexShrink: 0 },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  chipTextActive: { color: STATIC_WHITE },
  payInfo: { fontSize: FONT.sm, color: COLORS.textMuted, marginBottom: -SPACE[2] },
});
