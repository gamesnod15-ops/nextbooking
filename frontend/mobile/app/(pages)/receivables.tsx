import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Receivable } from '@/types';
import api from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const STATUS_LABEL: Record<Receivable['status'], string> = {
  open: 'Açık',
  partiallyPaid: 'Kısmi Ödendi',
  paid: 'Ödendi',
  overdue: 'Gecikmiş',
};
const STATUS_BADGE: Record<Receivable['status'], 'success' | 'error' | 'warning' | 'info'> = {
  open: 'info',
  partiallyPaid: 'warning',
  paid: 'success',
  overdue: 'error',
};

export default function ReceivablesScreen() {
  const insets = useSafeAreaInsets();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const toast = useToast();
  const [filter, setFilter] = useState('Tümü');
  const { data } = useQuery<Receivable[]>({
    queryKey: ['receivables'],
    queryFn: async () => { const res = await api.get('/receivables'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
  });
  const TOTAL_PENDING = (data ?? []).filter(r => r.status !== 'paid').reduce((s, r) => s + r.remainingAmount, 0);

  const filtered = (data ?? []).filter(r => {
    if (filter === 'Açık') return r.status === 'open';
    if (filter === 'Kısmi') return r.status === 'partiallyPaid';
    if (filter === 'Gecikmiş') return r.status === 'overdue';
    if (filter === 'Ödendi') return r.status === 'paid';
    return true;
  });

  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Receivable | null>(null);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', description: '', totalAmount: '', dueDate: '', installmentCount: '1' });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/receivables', {
      customerName: form.customerName,
      customerPhone: form.customerPhone || undefined,
      description: form.description || undefined,
      totalAmount: Number(form.totalAmount),
      dueDate: form.dueDate,
      installmentCount: Number(form.installmentCount) || 1,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['receivables'] }); setCreateOpen(false); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Alacak eklenemedi.'),
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/receivables/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['receivables'] }); setDetailItem(null); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Alacak silinemedi.'),
  });
  const payMutation = useMutation({
    mutationFn: async (installmentId: string) => api.post(`/receivables/installments/${installmentId}/pay`),
    onSuccess: (_res, installmentId) => {
      qc.invalidateQueries({ queryKey: ['receivables'] });
      toast.success('Taksit ödendi olarak işaretlendi.');
      setDetailItem((cur) => cur ? {
        ...cur,
        installments: cur.installments.map(i => i.id === installmentId ? { ...i, isPaid: true } : i),
      } : cur);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Taksit ödenemedi.'),
  });

  function openCreate() { setForm({ customerName: '', customerPhone: '', description: '', totalAmount: '', dueDate: '', installmentCount: '1' }); setCreateOpen(true); }
  function handleSave() {
    if (!form.customerName || !form.totalAmount || !form.dueDate) { toast.warning('Müşteri adı, tutar ve vade tarihi zorunludur.'); return; }
    if (Number(form.installmentCount) <= 0) { toast.warning('Taksit sayısı 0\'dan büyük olmalıdır.'); return; }
    createMutation.mutate();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Alacaklar" showBack
        right={<TouchableOpacity style={styles.addBtn} onPress={openCreate} accessibilityRole="button" accessibilityLabel="Ekle"><Ionicons name="add" size={22} color={STATIC_WHITE} /></TouchableOpacity>}
      />
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Toplam Alacak</Text>
        <Text style={styles.summaryValue}>{formatCurrency(TOTAL_PENDING)}</Text>
        <View style={styles.summaryMeta}>
          <Text style={styles.summaryMetaText}>{(data ?? []).filter(r => r.status === 'overdue').length} gecikmiş ödeme</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: SPACE[5], paddingVertical: SPACE[3], gap: SPACE[2], alignItems: 'center' }}>
        {['Tümü', 'Açık', 'Kısmi', 'Gecikmiş', 'Ödendi'].map((f) => (
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
          <TouchableOpacity activeOpacity={0.9} onPress={() => setDetailItem(item)} style={styles.card}>
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
              <Text style={[styles.amount, item.status === 'paid' && { color: COLORS.success }]}>{formatCurrency(item.remainingAmount)}</Text>
              <Badge variant={STATUS_BADGE[item.status]} size="sm">{STATUS_LABEL[item.status]}</Badge>
            </View>
          </TouchableOpacity>
        )}
      />
      <FormModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleSave}
        title="Yeni Alacak"
        saving={createMutation.isPending}
      >
        <FormField label="Müşteri Adı" value={form.customerName} onChangeText={v => setForm(p => ({ ...p, customerName: v }))} placeholder="Örn: Ahmet Yılmaz" />
        <FormField label="Telefon (isteğe bağlı)" value={form.customerPhone} onChangeText={v => setForm(p => ({ ...p, customerPhone: v }))} placeholder="0555 555 55 55" keyboardType="phone-pad" />
        <FormField label="Açıklama" value={form.description} onChangeText={v => setForm(p => ({ ...p, description: v }))} placeholder="Örn: Saç kesimi ücreti" />
        <FormField label="Toplam Tutar" value={form.totalAmount} onChangeText={v => setForm(p => ({ ...p, totalAmount: v }))} placeholder="Örn: 500" keyboardType="numeric" />
        <FormField label="Vade Tarihi" value={form.dueDate} onChangeText={v => setForm(p => ({ ...p, dueDate: v }))} placeholder="Örn: 2025-06-15" />
        <FormField label="Taksit Sayısı" value={form.installmentCount} onChangeText={v => setForm(p => ({ ...p, installmentCount: v }))} placeholder="Örn: 1" keyboardType="numeric" />
      </FormModal>

      <Modal visible={!!detailItem} animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={() => setDetailItem(null)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.detailHeader}>
              <Text style={styles.title}>{detailItem?.customerName}</Text>
              <TouchableOpacity onPress={() => setDetailItem(null)} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Kapat">
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            {detailItem && (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.detailBody}>
                {!!detailItem.description && <Text style={styles.desc}>{detailItem.description}</Text>}
                <View style={styles.detailStatsRow}>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailStatLabel}>Toplam</Text>
                    <Text style={styles.detailStatValue}>{formatCurrency(detailItem.totalAmount)}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailStatLabel}>Ödenen</Text>
                    <Text style={styles.detailStatValue}>{formatCurrency(detailItem.paidAmount)}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailStatLabel}>Kalan</Text>
                    <Text style={styles.detailStatValue}>{formatCurrency(detailItem.remainingAmount)}</Text>
                  </View>
                </View>
                <Badge variant={STATUS_BADGE[detailItem.status]} size="sm">{STATUS_LABEL[detailItem.status]}</Badge>
                <Text style={styles.fieldLabel}>Taksitler</Text>
                {detailItem.installments.map((inst) => (
                  <View key={inst.id} style={styles.installmentRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.installmentTitle}>{inst.number}. Taksit — {formatCurrency(inst.amount)}</Text>
                      <Text style={styles.desc}>Vade: {formatDate(inst.dueDate)}</Text>
                    </View>
                    {inst.isPaid ? (
                      <Badge variant="success" size="sm">Ödendi</Badge>
                    ) : (
                      <Button size="sm" variant="outline" loading={payMutation.isPending} onPress={() => payMutation.mutate(inst.id)}>Öde</Button>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
            <View style={styles.detailFooter}>
              <Button variant="destructive" style={{ flex: 1 }} onPress={() => detailItem && deleteMutation.mutate(detailItem.id)} loading={deleteMutation.isPending}>Sil</Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  addBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.primary },
  summaryCard: { backgroundColor: COLORS.primary, marginHorizontal: SPACE[5], marginTop: SPACE[4], borderRadius: RADIUS.xl, padding: SPACE[5], gap: SPACE[1] },
  summaryLabel: { fontSize: FONT.xs, color: 'rgba(0,0,0,0.5)', fontWeight: FONT.medium },
  summaryValue: { fontSize: FONT['3xl'], fontWeight: FONT.extrabold, color: STATIC_WHITE },
  summaryMeta: { marginTop: 4 },
  summaryMetaText: { fontSize: FONT.xs, color: 'rgba(0,0,0,0.5)' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: 'transparent', justifyContent: 'center', flexShrink: 0 },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  chipTextActive: { color: STATIC_WHITE },
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
  // Detail modal (view + pay installments; receivables have no PUT/edit endpoint on the backend)
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { flex: 1, backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'], maxHeight: '85%' },
  handle: { width: 40, height: 4, backgroundColor: COLORS.borderLight, borderRadius: 2, alignSelf: 'center', marginTop: SPACE[3] },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACE[5], paddingVertical: SPACE[4], borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  title: { fontSize: FONT.lg, fontWeight: FONT.bold, color: COLORS.text },
  closeBtn: { width: 32, height: 32, borderRadius: RADIUS.full, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  detailBody: { padding: SPACE[5], gap: SPACE[4] },
  detailStatsRow: { flexDirection: 'row', gap: SPACE[3] },
  detailStat: { flex: 1, backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.lg, padding: SPACE[3], gap: 2 },
  detailStatLabel: { fontSize: FONT.xs, color: COLORS.textMuted },
  detailStatValue: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.text },
  installmentRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.lg, padding: SPACE[3] },
  installmentTitle: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  detailFooter: { padding: SPACE[5], borderTopWidth: 1, borderTopColor: COLORS.borderLight, flexDirection: 'row', gap: SPACE[3] },
});
