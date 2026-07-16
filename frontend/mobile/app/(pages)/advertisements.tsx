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
import type { Advertisement } from '@/types';
import api from '@/lib/api';

const PLATFORM_ICONS: Record<string, any> = { instagram: 'logo-instagram', facebook: 'logo-facebook', google: 'logo-google', twitter: 'logo-twitter' };
const PLATFORM_COLORS: Record<string, string> = { instagram: '#E1306C', facebook: '#1877F2', google: '#4285F4', twitter: '#1DA1F2' };

export default function AdvertisementsScreen() {
  const insets = useSafeAreaInsets();
  const { data } = useQuery({
    queryKey: ['advertisements'],
    queryFn: async () => { const res = await api.get('/advertisements'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
  });

  const list = data as Advertisement[] | undefined;
  const totalBudget = (list ?? []).reduce((s, a) => s + (a.budget ?? 0), 0);
  const totalSpent = (list ?? []).reduce((s, a) => s + (a.spent ?? 0), 0);
  const totalClicks = (list ?? []).reduce((s, a) => s + (a.clicks ?? 0), 0);

  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; item?: Advertisement }>({ open: false });
  const [form, setForm] = useState({ title: '', description: '', type: 'banner' as 'banner' | 'popup' | 'video', targetUrl: '', startDate: '', endDate: '', position: '' });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/advertisements', { title: form.title, description: form.description || undefined, type: form.type, targetUrl: form.targetUrl || undefined, startDate: form.startDate, endDate: form.endDate, position: form.position || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['advertisements'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Reklam eklenemedi.'),
  });
  const updateMutation = useMutation({
    mutationFn: async () => api.put(`/advertisements/${modal.item!.id}`, { title: form.title, description: form.description || undefined, type: form.type, targetUrl: form.targetUrl || undefined, startDate: form.startDate, endDate: form.endDate, position: form.position || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['advertisements'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Reklam güncellenemedi.'),
  });
  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/advertisements/${modal.item!.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['advertisements'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Reklam silinemedi.'),
  });

  function openCreate() { setForm({ title: '', description: '', type: 'banner', targetUrl: '', startDate: '', endDate: '', position: '' }); setModal({ open: true, item: undefined }); }
  function openEdit(item: Advertisement) { setForm({ title: item.title, description: item.description ?? '', type: item.type ?? 'banner', targetUrl: item.targetUrl ?? '', startDate: item.startDate, endDate: item.endDate ?? '', position: item.position ?? '' }); setModal({ open: true, item }); }
  function handleSave() {
    if (!form.title || !form.startDate || !form.endDate) { Alert.alert('Uyarı', 'Başlık, başlangıç ve bitiş tarihi zorunludur.'); return; }
    if (modal.item) updateMutation.mutate(); else createMutation.mutate();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Reklamlar" showBack
        right={<TouchableOpacity style={styles.addBtn} onPress={openCreate}><Ionicons name="add" size={22} color={COLORS.white} /></TouchableOpacity>}
      />
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Bütçe</Text>
          <Text style={styles.statValue}>{formatCurrency(totalBudget)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Harcama</Text>
          <Text style={styles.statValue}>{formatCurrency(totalSpent)}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
          <Text style={[styles.statLabel, { color: 'rgba(0,0,0,0.5)' }]}>Tıklamalar</Text>
          <Text style={[styles.statValue, { color: COLORS.white }]}>{totalClicks.toLocaleString('tr')}</Text>
        </View>
      </View>
      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
        ListEmptyComponent={<EmptyState icon="megaphone-outline" title="Reklam yok" />}
        renderItem={({ item }) => {
          const pctSpent = Math.round((item.spent / item.budget) * 100);
          const platformColor = PLATFORM_COLORS[item.platform] ?? COLORS.info;
          return (
            <TouchableOpacity activeOpacity={0.9} onPress={() => openEdit(item)} style={styles.card}>
              <View style={[styles.platformIcon, { backgroundColor: platformColor + '20' }]}>
                <Ionicons name={PLATFORM_ICONS[item.platform] ?? 'globe-outline'} size={22} color={platformColor} />
              </View>
              <View style={styles.info}>
                <View style={styles.row}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Badge variant={item.status === 'active' ? 'success' : 'default'} size="sm">{item.status === 'active' ? 'Aktif' : 'Bitti'}</Badge>
                </View>
                <Text style={styles.dates}>{formatDate(item.startDate)} – {formatDate(item.endDate)}</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(pctSpent, 100)}%`, backgroundColor: pctSpent >= 90 ? COLORS.error : COLORS.primary }]} />
                </View>
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetText}>{formatCurrency(item.spent)} / {formatCurrency(item.budget)}</Text>
                  <Text style={styles.statsText}>{item.impressions.toLocaleString('tr')} görüntüleme · {item.clicks} tıklama</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
      <FormModal
        visible={modal.open}
        onClose={() => setModal({ open: false })}
        onSave={handleSave}
        title={modal.item ? 'Reklam Düzenle' : 'Yeni Reklam'}
        saving={createMutation.isPending || updateMutation.isPending}
        deleteLabel={modal.item ? 'Sil' : undefined}
        onDelete={modal.item ? () => deleteMutation.mutate() : undefined}
      >
        <FormField label="Başlık" value={form.title} onChangeText={v => setForm(p => ({ ...p, title: v }))} placeholder="Örn: Yaz İndirimi" />
        <FormField label="Açıklama" value={form.description} onChangeText={v => setForm(p => ({ ...p, description: v }))} placeholder="Örn: Kampanya detayı" multiline />
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Tür</Text>
          <View style={styles.segmentRow}>
            <TouchableOpacity style={[styles.segment, form.type === 'banner' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, type: 'banner' }))}><Text style={[styles.segmentText, form.type === 'banner' && styles.segmentTextActive]}>Banner</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.segment, form.type === 'popup' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, type: 'popup' }))}><Text style={[styles.segmentText, form.type === 'popup' && styles.segmentTextActive]}>Popup</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.segment, form.type === 'video' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, type: 'video' }))}><Text style={[styles.segmentText, form.type === 'video' && styles.segmentTextActive]}>Video</Text></TouchableOpacity>
          </View>
        </View>
        <FormField label="Hedef URL" value={form.targetUrl} onChangeText={v => setForm(p => ({ ...p, targetUrl: v }))} placeholder="Örn: https://..." keyboardType="default" />
        <FormField label="Başlangıç Tarihi" value={form.startDate} onChangeText={v => setForm(p => ({ ...p, startDate: v }))} placeholder="Örn: 2025-06-01" />
        <FormField label="Bitiş Tarihi" value={form.endDate} onChangeText={v => setForm(p => ({ ...p, endDate: v }))} placeholder="Örn: 2025-06-30" />
        <FormField label="Pozisyon" value={form.position} onChangeText={v => setForm(p => ({ ...p, position: v }))} placeholder="Örn: header, sidebar" />
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  addBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.primary },
  statsRow: { flexDirection: 'row', gap: SPACE[3], paddingHorizontal: SPACE[5], paddingVertical: SPACE[4] },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  statLabel: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: FONT.medium, marginBottom: 4 },
  statValue: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text },
  list: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[10] },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  platformIcon: { width: 48, height: 48, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  info: { flex: 1, gap: SPACE[2] },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text, flex: 1, marginRight: SPACE[2] },
  dates: { fontSize: FONT.xs, color: COLORS.textMuted },
  progressBar: { height: 6, backgroundColor: COLORS.surfaceAlt, borderRadius: 3 },
  progressFill: { height: 6, borderRadius: 3 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetText: { fontSize: FONT.xs, fontWeight: FONT.semibold, color: COLORS.text },
  statsText: { fontSize: FONT.xs, color: COLORS.textMuted },
  fieldGroup: { gap: SPACE[1] },
  fieldLabel: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  segmentRow: { flexDirection: 'row', backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, padding: 3 },
  segment: { flex: 1, paddingVertical: SPACE[2], alignItems: 'center', borderRadius: RADIUS.md },
  segmentActive: { backgroundColor: COLORS.surface, ...SHADOW.sm },
  segmentText: { fontSize: FONT.sm, fontWeight: FONT.medium, color: COLORS.textMuted },
  segmentTextActive: { color: COLORS.text, fontWeight: FONT.semibold },
});
