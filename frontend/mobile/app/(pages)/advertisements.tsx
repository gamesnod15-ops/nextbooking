import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { FormModal } from '@/components/ui/FormModal';
import { FormField } from '@/components/ui/FormField';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Advertisement, AdPackageType, AdTargetCategory, AdStatus } from '@/types';
import api from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

// Backend is an ad-boost purchase system (see AdvertisementsController.cs / Domain/Entities/Advertisement.cs):
// a business buys a promotional package targeting a category + location with a budget, and the
// backend computes impressions/clicks/conversions. There is no full-edit endpoint — only
// create (POST), list (GET), a status-only patch (PATCH /{id}/status) and delete (DELETE /{id}).

const PACKAGE_OPTIONS: { value: AdPackageType; label: string }[] = [
  { value: 'BasicBoost', label: 'Temel' },
  { value: 'ProfessionalBoost', label: 'Profesyonel' },
  { value: 'PremiumSpotlight', label: 'Premium Vitrin' },
];

const CATEGORY_OPTIONS: { value: AdTargetCategory; label: string }[] = [
  { value: 'All', label: 'Tümü' },
  { value: 'Hair', label: 'Saç' },
  { value: 'Beauty', label: 'Güzellik' },
  { value: 'Wellness', label: 'Sağlıklı Yaşam' },
  { value: 'Fitness', label: 'Fitness' },
  { value: 'Healthcare', label: 'Sağlık' },
  { value: 'Nail', label: 'Tırnak' },
  { value: 'Massage', label: 'Masaj' },
  { value: 'Other', label: 'Diğer' },
];

const STATUS_LABEL: Record<AdStatus, string> = {
  Active: 'Aktif',
  Pending: 'Onay Bekliyor',
  Expired: 'Süresi Doldu',
  Rejected: 'Reddedildi',
  Paused: 'Duraklatıldı',
};

const STATUS_VARIANT: Record<AdStatus, 'success' | 'warning' | 'error' | 'default'> = {
  Active: 'success',
  Pending: 'warning',
  Expired: 'default',
  Rejected: 'error',
  Paused: 'warning',
};

/** The backend parses PackageType/TargetCategory strings via `Enum.Parse(ignoreCase: true)`
 *  after a snake_case/camelCase -> PascalCase conversion, so either casing works — we send
 *  camelCase to match this app's JSON convention. */
function toCamel(pascal: string): string {
  return pascal.length ? pascal[0].toLowerCase() + pascal.slice(1) : pascal;
}

const emptyForm = {
  title: '',
  description: '',
  packageType: 'BasicBoost' as AdPackageType,
  targetCategory: 'All' as AdTargetCategory,
  targetLocation: '',
  budget: '',
  startDate: '',
  endDate: '',
};

export default function AdvertisementsScreen() {
  const insets = useSafeAreaInsets();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const toast = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['advertisements'],
    queryFn: async () => { const res = await api.get('/advertisements'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
  });
  const list = (data as Advertisement[] | undefined) ?? [];

  const totalBudget = list.reduce((s, a) => s + (a.budget ?? 0), 0);
  const totalImpressions = list.reduce((s, a) => s + (a.impressions ?? 0), 0);
  const totalClicks = list.reduce((s, a) => s + (a.clicks ?? 0), 0);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [detail, setDetail] = useState<Advertisement | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => api.post('/advertisements', {
      title: form.title,
      description: form.description || undefined,
      packageType: toCamel(form.packageType),
      targetCategory: toCamel(form.targetCategory),
      targetLocation: form.targetLocation || undefined,
      budget: Number(form.budget),
      startDate: form.startDate,
      endDate: form.endDate,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['advertisements'] }); setCreateOpen(false); toast.success('Reklam oluşturuldu.'); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Reklam eklenemedi.'),
  });

  const statusMutation = useMutation({
    mutationFn: async (status: AdStatus) => api.patch(`/advertisements/${detail!.id}/status`, { status: toCamel(status) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['advertisements'] }); setDetail(null); toast.success('Durum güncellendi.'); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Durum güncellenemedi.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/advertisements/${detail!.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['advertisements'] }); setDetail(null); toast.success('Reklam silindi.'); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Reklam silinemedi.'),
  });

  function openCreate() { setForm(emptyForm); setCreateOpen(true); }

  function handleSave() {
    if (!form.title.trim()) { toast.warning('Başlık zorunludur.'); return; }
    const budgetNum = Number(form.budget);
    if (!form.budget || Number.isNaN(budgetNum) || budgetNum <= 0) { toast.warning('Bütçe 0\'dan büyük olmalıdır.'); return; }
    if (!form.startDate || !form.endDate) { toast.warning('Başlangıç ve bitiş tarihi zorunludur.'); return; }
    if (form.endDate <= form.startDate) { toast.warning('Bitiş tarihi başlangıç tarihinden sonra olmalıdır.'); return; }
    createMutation.mutate();
  }

  function confirmDelete() {
    if (!detail) return;
    Alert.alert('Onay', 'Bu reklamı silmek istiyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Reklamlar" showBack
        right={<TouchableOpacity style={styles.addBtn} onPress={openCreate} accessibilityRole="button" accessibilityLabel="Yeni reklam ekle"><Ionicons name="add" size={22} color={STATIC_WHITE} /></TouchableOpacity>}
      />
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Toplam Bütçe</Text>
          <Text style={styles.statValue}>{formatCurrency(totalBudget)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Görüntüleme</Text>
          <Text style={styles.statValue}>{totalImpressions.toLocaleString('tr')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
          <Text style={[styles.statLabel, { color: 'rgba(0,0,0,0.5)' }]}>Tıklamalar</Text>
          <Text style={[styles.statValue, { color: STATIC_WHITE }]}>{totalClicks.toLocaleString('tr')}</Text>
        </View>
      </View>
      {isLoading ? (
        <View style={styles.list}><SkeletonList count={4} variant="card" /></View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
          ListEmptyComponent={<EmptyState icon="megaphone-outline" title="Reklam yok" />}
          renderItem={({ item }) => {
            const pkg = PACKAGE_OPTIONS.find(p => p.value === item.packageType)?.label ?? item.packageType;
            const cat = CATEGORY_OPTIONS.find(c => c.value === item.targetCategory)?.label ?? item.targetCategory;
            return (
              <TouchableOpacity activeOpacity={0.9} onPress={() => setDetail(item)} style={styles.card}>
                <View style={styles.iconWrap}>
                  <Ionicons name="megaphone-outline" size={22} color={COLORS.primaryDark} />
                </View>
                <View style={styles.info}>
                  <View style={styles.row}>
                    <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                    <Badge variant={STATUS_VARIANT[item.status]} size="sm">{STATUS_LABEL[item.status]}</Badge>
                  </View>
                  <Text style={styles.subtitle}>{pkg} · {cat}{item.targetLocation ? ` · ${item.targetLocation}` : ''}</Text>
                  <Text style={styles.dates}>{formatDate(item.startDate)} – {formatDate(item.endDate)}</Text>
                  <View style={styles.budgetRow}>
                    <Text style={styles.budgetText}>{formatCurrency(item.budget)}</Text>
                    <Text style={styles.statsText}>{item.impressions.toLocaleString('tr')} görüntüleme · {item.clicks} tıklama · {item.conversions} dönüşüm</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Detail sheet: real fields only, plus the only mutation this backend actually supports
          (Active <-> Paused via status patch) and delete. No full-edit affordance — none exists. */}
      <Modal visible={!!detail} animationType="slide" transparent presentationStyle="overFullScreen">
        {detail && (
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{detail.title}</Text>
                <Badge variant={STATUS_VARIANT[detail.status]} size="sm">{STATUS_LABEL[detail.status]}</Badge>
              </View>
              {detail.description ? <Text style={styles.sheetDesc}>{detail.description}</Text> : null}
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>Paket</Text>
                <Text style={styles.sheetValue}>{PACKAGE_OPTIONS.find(p => p.value === detail.packageType)?.label ?? detail.packageType}</Text>
              </View>
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>Hedef Kategori</Text>
                <Text style={styles.sheetValue}>{CATEGORY_OPTIONS.find(c => c.value === detail.targetCategory)?.label ?? detail.targetCategory}</Text>
              </View>
              {detail.targetLocation ? (
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Hedef Konum</Text>
                  <Text style={styles.sheetValue}>{detail.targetLocation}</Text>
                </View>
              ) : null}
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>Bütçe</Text>
                <Text style={styles.sheetValue}>{formatCurrency(detail.budget)}</Text>
              </View>
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>Tarih</Text>
                <Text style={styles.sheetValue}>{formatDate(detail.startDate)} – {formatDate(detail.endDate)}</Text>
              </View>
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>Görüntüleme / Tıklama / Dönüşüm</Text>
                <Text style={styles.sheetValue}>{detail.impressions} / {detail.clicks} / {detail.conversions}</Text>
              </View>

              <View style={styles.sheetActions}>
                {detail.status === 'Active' && (
                  <Button variant="secondary" onPress={() => statusMutation.mutate('Paused')} loading={statusMutation.isPending} style={{ flex: 1 }}>Duraklat</Button>
                )}
                {detail.status === 'Paused' && (
                  <Button variant="primary" onPress={() => statusMutation.mutate('Active')} loading={statusMutation.isPending} style={{ flex: 1 }}>Devam Ettir</Button>
                )}
                <Button variant="destructive" onPress={confirmDelete} loading={deleteMutation.isPending} style={{ flex: 1 }}>Sil</Button>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setDetail(null)} accessibilityRole="button" accessibilityLabel="Kapat">
                <Text style={styles.closeBtnText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      <FormModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleSave}
        title="Yeni Reklam"
        saving={createMutation.isPending}
      >
        <FormField label="Başlık" value={form.title} onChangeText={v => setForm(p => ({ ...p, title: v }))} placeholder="Örn: Yaz Kampanyası Öne Çıkarma" />
        <FormField label="Açıklama" value={form.description} onChangeText={v => setForm(p => ({ ...p, description: v }))} placeholder="Açıklama (isteğe bağlı)" multiline />

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Paket</Text>
          <View style={styles.segmentRow}>
            {PACKAGE_OPTIONS.map(opt => (
              <TouchableOpacity key={opt.value} style={[styles.segment, form.packageType === opt.value && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, packageType: opt.value }))}>
                <Text style={[styles.segmentText, form.packageType === opt.value && styles.segmentTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Hedef Kategori</Text>
          <View style={styles.chipWrap}>
            {CATEGORY_OPTIONS.map(opt => {
              const active = form.targetCategory === opt.value;
              return (
                <TouchableOpacity key={opt.value} style={[styles.chip, active && styles.chipActive]} onPress={() => setForm(p => ({ ...p, targetCategory: opt.value }))}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <FormField label="Hedef Konum" value={form.targetLocation} onChangeText={v => setForm(p => ({ ...p, targetLocation: v }))} placeholder="Örn: İstanbul (isteğe bağlı)" />
        <FormField label="Bütçe (₺)" value={form.budget} onChangeText={v => setForm(p => ({ ...p, budget: v }))} placeholder="Örn: 500" keyboardType="numeric" />
        <FormField label="Başlangıç Tarihi" value={form.startDate} onChangeText={v => setForm(p => ({ ...p, startDate: v }))} placeholder="Örn: 2025-06-01" />
        <FormField label="Bitiş Tarihi" value={form.endDate} onChangeText={v => setForm(p => ({ ...p, endDate: v }))} placeholder="Örn: 2025-06-30" />
      </FormModal>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  addBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.primary },
  statsRow: { flexDirection: 'row', gap: SPACE[3], paddingHorizontal: SPACE[5], paddingVertical: SPACE[4] },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  statLabel: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: FONT.medium, marginBottom: 4 },
  statValue: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text },
  list: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[10] },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  iconWrap: { width: 48, height: 48, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', marginTop: 2, backgroundColor: COLORS.primaryMuted },
  info: { flex: 1, gap: SPACE[2] },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text, flex: 1, marginRight: SPACE[2] },
  subtitle: { fontSize: FONT.xs, color: COLORS.textSecondary },
  dates: { fontSize: FONT.xs, color: COLORS.textMuted },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 },
  budgetText: { fontSize: FONT.xs, fontWeight: FONT.semibold, color: COLORS.text },
  statsText: { fontSize: FONT.xs, color: COLORS.textMuted },
  fieldGroup: { gap: SPACE[1] },
  fieldLabel: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  segmentRow: { flexDirection: 'row', backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, padding: 3 },
  segment: { flex: 1, paddingVertical: SPACE[2], alignItems: 'center', borderRadius: RADIUS.md },
  segmentActive: { backgroundColor: COLORS.surface, ...SHADOW.sm },
  segmentText: { fontSize: FONT.sm, fontWeight: FONT.medium, color: COLORS.textMuted },
  segmentTextActive: { color: COLORS.text, fontWeight: FONT.semibold },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[2] },
  chip: { paddingHorizontal: SPACE[3], paddingVertical: SPACE[2], borderRadius: RADIUS.full, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.primaryMuted, borderColor: COLORS.primary },
  chipText: { fontSize: FONT.xs, fontWeight: FONT.medium, color: COLORS.textMuted },
  chipTextActive: { color: COLORS.primaryDark, fontWeight: FONT.semibold },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'], padding: SPACE[6], gap: SPACE[3] },
  sheetHandle: { width: 40, height: 4, backgroundColor: COLORS.borderLight, borderRadius: 2, alignSelf: 'center', marginBottom: SPACE[2] },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: SPACE[2] },
  sheetTitle: { fontSize: FONT.lg, fontWeight: FONT.bold, color: COLORS.text, flex: 1 },
  sheetDesc: { fontSize: FONT.sm, color: COLORS.textMuted },
  sheetRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACE[2], borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  sheetLabel: { fontSize: FONT.sm, color: COLORS.textMuted },
  sheetValue: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  sheetActions: { flexDirection: 'row', gap: SPACE[3], marginTop: SPACE[3] },
  closeBtn: { backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.xl, padding: SPACE[4], alignItems: 'center', marginTop: SPACE[2] },
  closeBtnText: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
});
