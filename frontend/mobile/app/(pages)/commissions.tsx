import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { PatternOverlay } from '@/components/ui/PatternOverlay';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchBar } from '@/components/ui/SearchBar';
import { FormModal } from '@/components/ui/FormModal';
import { FormField } from '@/components/ui/FormField';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Commission, CommissionStatus, CommissionType, Employee } from '@/types';
import api from '@/lib/api';

const TYPE_LABEL: Record<CommissionType, string> = {
  service: 'Hizmet',
  sales: 'Satış',
  mixed: 'Karma',
};
const TYPE_OPTIONS: CommissionType[] = ['service', 'sales', 'mixed'];

const STATUS_LABEL: Record<CommissionStatus, string> = {
  pending: 'Bekliyor',
  approved: 'Onaylandı',
  paid: 'Ödendi',
};
const STATUS_BADGE: Record<CommissionStatus, 'warning' | 'info' | 'success'> = {
  pending: 'warning',
  approved: 'info',
  paid: 'success',
};

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function CommissionsScreen() {
  const insets = useSafeAreaInsets();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const toast = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['commissions'],
    queryFn: async () => { const res = await api.get('/commissions'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
  });
  const list = (data ?? []) as Commission[];
  const totalPending = list.filter(c => c.status !== 'paid').reduce((s, c) => s + c.totalAmount, 0);

  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => { const r = await api.get('/employees'); return Array.isArray(r.data) ? r.data : r.data?.items ?? []; },
  });
  const employees = (employeesData ?? []) as Employee[];

  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Commission | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [form, setForm] = useState({
    employeeId: '',
    employeeName: '',
    period: currentPeriod(),
    type: 'service' as CommissionType,
    baseAmount: '',
    commissionRate: '',
    bonusAmount: '',
    notes: '',
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['commissions'] });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/commissions', {
      employeeId: form.employeeId,
      employeeName: form.employeeName,
      period: form.period,
      type: form.type,
      baseAmount: Number(form.baseAmount) || 0,
      commissionRate: Number(form.commissionRate) || 0,
      bonusAmount: Number(form.bonusAmount) || 0,
      notes: form.notes || undefined,
    }),
    onSuccess: () => { invalidate(); setCreateOpen(false); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Komisyon eklenemedi.'),
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/commissions/${id}/approve`),
    onSuccess: () => {
      invalidate();
      toast.success('Komisyon onaylandı.');
      setDetailItem((cur) => cur ? { ...cur, status: 'approved' } : cur);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Komisyon onaylanamadı.'),
  });

  const payMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/commissions/${id}/pay`),
    onSuccess: () => {
      invalidate();
      toast.success('Komisyon ödendi olarak işaretlendi.');
      setDetailItem((cur) => cur ? { ...cur, status: 'paid' } : cur);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Komisyon ödenemedi.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/commissions/${id}`),
    onSuccess: () => { invalidate(); setDetailItem(null); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Komisyon silinemedi.'),
  });

  function openCreate() {
    setForm({ employeeId: '', employeeName: '', period: currentPeriod(), type: 'service', baseAmount: '', commissionRate: '', bonusAmount: '', notes: '' });
    setCreateOpen(true);
  }

  function handleSave() {
    if (!form.employeeId) { toast.warning('Lütfen bir personel seçin.'); return; }
    if (!form.period.trim()) { toast.warning('Dönem zorunludur.'); return; }
    if (!form.baseAmount || Number(form.baseAmount) <= 0) { toast.warning('Baz tutar 0\'dan büyük olmalıdır.'); return; }
    const rate = Number(form.commissionRate);
    if (form.commissionRate === '' || rate < 0 || rate > 100) { toast.warning('Komisyon oranı 0-100 arasında olmalıdır.'); return; }
    createMutation.mutate();
  }

  function selectEmployee(e: Employee) {
    setForm((p) => ({ ...p, employeeId: e.id, employeeName: e.name }));
    setPickerOpen(false);
    setEmployeeSearch('');
  }

  const filteredEmployees = employees.filter((e) => (e.name?.toLowerCase() ?? '').includes(employeeSearch.toLowerCase()));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <PatternOverlay opacity={0.25} />
      <ScreenHeader title="Komisyonlar" showBack
        right={<TouchableOpacity style={styles.addBtn} onPress={openCreate} accessibilityRole="button" accessibilityLabel="Ekle"><Ionicons name="add" size={22} color={STATIC_WHITE} /></TouchableOpacity>}
      />
      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>Bekleyen Ödemeler</Text>
        <Text style={styles.bannerValue}>{formatCurrency(totalPending)}</Text>
      </View>
      {isLoading ? (
        <SkeletonList count={6} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
          ListEmptyComponent={<EmptyState icon="cash-outline" title="Komisyon yok" />}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.9} onPress={() => setDetailItem(item)} style={styles.card}>
              <Avatar name={item.employeeName} size={44} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.employeeName}</Text>
                <Text style={styles.period}>{item.period} · {TYPE_LABEL[item.type]} · %{item.commissionRate}</Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.amount}>{formatCurrency(item.totalAmount)}</Text>
                <Badge variant={STATUS_BADGE[item.status]} size="sm">{STATUS_LABEL[item.status]}</Badge>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Create commission */}
      <FormModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleSave}
        title="Yeni Komisyon"
        saving={createMutation.isPending}
      >
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Personel</Text>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setPickerOpen(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Personel seç"
          >
            <Text style={form.employeeId ? styles.pickerBtnText : styles.pickerBtnPlaceholder}>
              {form.employeeId ? form.employeeName : 'Personel seçin'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <FormField label="Dönem" value={form.period} onChangeText={v => setForm(p => ({ ...p, period: v }))} placeholder="Örn: 2026-07" />

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Komisyon Türü</Text>
          <View style={styles.segmentRow}>
            {TYPE_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.segment, form.type === t && styles.segmentActive]}
                onPress={() => setForm(p => ({ ...p, type: t }))}
              >
                <Text style={[styles.segmentText, form.type === t && styles.segmentTextActive]}>{TYPE_LABEL[t]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <FormField label="Baz Tutar (₺)" value={form.baseAmount} onChangeText={v => setForm(p => ({ ...p, baseAmount: v }))} placeholder="Örn: 5000" keyboardType="numeric" />
        <FormField label="Komisyon Oranı (%)" value={form.commissionRate} onChangeText={v => setForm(p => ({ ...p, commissionRate: v }))} placeholder="Örn: 10" keyboardType="numeric" />
        <FormField label="Bonus Tutarı (₺, isteğe bağlı)" value={form.bonusAmount} onChangeText={v => setForm(p => ({ ...p, bonusAmount: v }))} placeholder="Örn: 200" keyboardType="numeric" />
        <FormField label="Notlar" value={form.notes} onChangeText={v => setForm(p => ({ ...p, notes: v }))} placeholder="Opsiyonel not" multiline />

        {form.baseAmount && form.commissionRate ? (
          <View style={styles.previewBox}>
            <Text style={styles.previewLabel}>Tahmini Toplam</Text>
            <Text style={styles.previewValue}>
              {formatCurrency(Math.round((Number(form.baseAmount) || 0) * (Number(form.commissionRate) || 0) / 100 * 100) / 100 + (Number(form.bonusAmount) || 0))}
            </Text>
          </View>
        ) : null}
      </FormModal>

      {/* Employee picker */}
      <Modal visible={pickerOpen} animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.handle} />
            <View style={styles.detailHeader}>
              <Text style={styles.title}>Personel Seç</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Kapat">
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <SearchBar value={employeeSearch} onChangeText={setEmployeeSearch} placeholder="Personel ara…" style={{ margin: SPACE[4] }} />
            <FlatList
              data={filteredEmployees}
              keyExtractor={(i) => i.id}
              contentContainerStyle={{ paddingHorizontal: SPACE[5], paddingBottom: SPACE[8] }}
              ItemSeparatorComponent={() => <View style={{ height: SPACE[2] }} />}
              ListEmptyComponent={<EmptyState icon="people-circle-outline" title="Personel bulunamadı" />}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.employeeRow} activeOpacity={0.8} onPress={() => selectEmployee(item)}>
                  <Avatar name={item.name} size={36} />
                  <Text style={styles.employeeRowText}>{item.name}</Text>
                  {form.employeeId === item.id && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Detail + workflow actions (no PUT/edit endpoint on the backend) */}
      <Modal visible={!!detailItem} animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={() => setDetailItem(null)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.detailHeader}>
              <Text style={styles.title}>{detailItem?.employeeName}</Text>
              <TouchableOpacity onPress={() => setDetailItem(null)} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Kapat">
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            {detailItem && (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.detailBody}>
                <View style={styles.detailTopRow}>
                  <Badge variant={STATUS_BADGE[detailItem.status]}>{STATUS_LABEL[detailItem.status]}</Badge>
                  <Text style={styles.detailPeriod}>{detailItem.period} · {TYPE_LABEL[detailItem.type]}</Text>
                </View>
                <View style={styles.detailStatsRow}>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailStatLabel}>Baz Tutar</Text>
                    <Text style={styles.detailStatValue}>{formatCurrency(detailItem.baseAmount)}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailStatLabel}>Oran</Text>
                    <Text style={styles.detailStatValue}>%{detailItem.commissionRate}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailStatLabel}>Bonus</Text>
                    <Text style={styles.detailStatValue}>{formatCurrency(detailItem.bonusAmount)}</Text>
                  </View>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Toplam Komisyon</Text>
                  <Text style={styles.totalValue}>{formatCurrency(detailItem.totalAmount)}</Text>
                </View>
                {!!detailItem.notes && (
                  <View>
                    <Text style={styles.fieldLabel}>Notlar</Text>
                    <Text style={styles.desc}>{detailItem.notes}</Text>
                  </View>
                )}
                {!!detailItem.createdAt && (
                  <Text style={styles.desc}>Oluşturulma: {formatDate(detailItem.createdAt)}</Text>
                )}
              </ScrollView>
            )}
            <View style={styles.detailFooter}>
              <Button variant="destructive" style={{ flex: 1 }} onPress={() => detailItem && deleteMutation.mutate(detailItem.id)} loading={deleteMutation.isPending}>Sil</Button>
              {detailItem?.status === 'pending' && (
                <Button style={{ flex: 1 }} onPress={() => detailItem && approveMutation.mutate(detailItem.id)} loading={approveMutation.isPending}>Onayla</Button>
              )}
              {detailItem?.status === 'approved' && (
                <Button style={{ flex: 1 }} onPress={() => detailItem && payMutation.mutate(detailItem.id)} loading={payMutation.isPending}>Öde</Button>
              )}
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
  fieldGroup: { gap: SPACE[1] },
  fieldLabel: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  segmentRow: { flexDirection: 'row', backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, padding: 3 },
  segment: { flex: 1, paddingVertical: SPACE[2], alignItems: 'center', borderRadius: RADIUS.md },
  segmentActive: { backgroundColor: COLORS.surface, ...SHADOW.sm },
  segmentText: { fontSize: FONT.sm, fontWeight: FONT.medium, color: COLORS.textMuted },
  segmentTextActive: { color: COLORS.text, fontWeight: FONT.semibold },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.lg, paddingHorizontal: SPACE[4], paddingVertical: SPACE[3], borderWidth: 1.5, borderColor: COLORS.border },
  pickerBtnText: { fontSize: FONT.base, color: COLORS.text, fontWeight: FONT.medium },
  pickerBtnPlaceholder: { fontSize: FONT.base, color: COLORS.textMuted },
  previewBox: { backgroundColor: COLORS.primaryMuted, borderRadius: RADIUS.lg, padding: SPACE[4], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  previewLabel: { fontSize: FONT.sm, color: COLORS.primaryDark, fontWeight: FONT.semibold },
  previewValue: { fontSize: FONT.lg, color: COLORS.primaryDark, fontWeight: FONT.extrabold },
  // Shared modal sheet chrome
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { flex: 1, backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'], maxHeight: '85%' },
  pickerSheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'], maxHeight: '85%', minHeight: '60%' },
  handle: { width: 40, height: 4, backgroundColor: COLORS.borderLight, borderRadius: 2, alignSelf: 'center', marginTop: SPACE[3] },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACE[5], paddingVertical: SPACE[4], borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  title: { fontSize: FONT.lg, fontWeight: FONT.bold, color: COLORS.text },
  closeBtn: { width: 32, height: 32, borderRadius: RADIUS.full, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  employeeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.lg, padding: SPACE[3] },
  employeeRowText: { flex: 1, fontSize: FONT.base, fontWeight: FONT.medium, color: COLORS.text },
  detailBody: { padding: SPACE[5], gap: SPACE[4] },
  detailTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailPeriod: { fontSize: FONT.sm, color: COLORS.textMuted, fontWeight: FONT.medium },
  detailStatsRow: { flexDirection: 'row', gap: SPACE[3] },
  detailStat: { flex: 1, backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.lg, padding: SPACE[3], gap: 2 },
  detailStatLabel: { fontSize: FONT.xs, color: COLORS.textMuted },
  detailStatValue: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.text },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.primaryMuted, borderRadius: RADIUS.lg, padding: SPACE[4] },
  totalLabel: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.primaryDark },
  totalValue: { fontSize: FONT.lg, fontWeight: FONT.extrabold, color: COLORS.primaryDark },
  desc: { fontSize: FONT.sm, color: COLORS.textMuted, marginTop: 2 },
  detailFooter: { padding: SPACE[5], borderTopWidth: 1, borderTopColor: COLORS.borderLight, flexDirection: 'row', gap: SPACE[3] },
});
