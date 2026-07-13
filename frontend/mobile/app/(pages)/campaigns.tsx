import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { FormField } from '@/components/ui/FormField';
import { formatDate } from '@/lib/utils';
import type { Campaign } from '@/types';
import api from '@/lib/api';

export default function CampaignsScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Campaign | null>(null);
  const { data } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => { const res = await api.get('/campaigns'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
  });
  const list = data as Campaign[] | undefined;

  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; item?: Campaign }>({ open: false });
  const [form, setForm] = useState({ title: '', description: '', discountType: 'percent' as 'percent' | 'fixed', discountValue: '', startDate: '', endDate: '', maxUsage: '' });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/campaigns', { title: form.title, description: form.description || undefined, discountType: form.discountType, discountValue: Number(form.discountValue), startDate: form.startDate, endDate: form.endDate, maxUsage: form.maxUsage ? Number(form.maxUsage) : undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Kampanya eklenemedi.'),
  });
  const updateMutation = useMutation({
    mutationFn: async () => api.put(`/campaigns/${modal.item!.id}`, { title: form.title, description: form.description || undefined, discountType: form.discountType, discountValue: Number(form.discountValue), startDate: form.startDate, endDate: form.endDate, maxUsage: form.maxUsage ? Number(form.maxUsage) : undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Kampanya güncellenemedi.'),
  });
  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/campaigns/${modal.item!.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Kampanya silinemedi.'),
  });

  function openCreate() { setForm({ title: '', description: '', discountType: 'percent', discountValue: '', startDate: '', endDate: '', maxUsage: '' }); setModal({ open: true, item: undefined }); }
  function openEdit(item: Campaign) { setForm({ title: item.title, description: item.description ?? '', discountType: item.discountType, discountValue: String(item.discountValue), startDate: item.startDate, endDate: item.endDate, maxUsage: item.maxUsage ? String(item.maxUsage) : '' }); setModal({ open: true, item }); }
  function handleSave() {
    if (!form.title || !form.discountValue || !form.startDate || !form.endDate) { Alert.alert('Uyarı', 'Başlık, indirim değeri, başlangıç ve bitiş tarihi zorunludur.'); return; }
    if (modal.item) updateMutation.mutate(); else createMutation.mutate();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Kampanyalar" subtitle={`${(list ?? []).filter(c => c.isActive).length} aktif`} showBack
        right={<TouchableOpacity style={styles.addBtn} onPress={openCreate}><Ionicons name="add" size={22} color={COLORS.black} /></TouchableOpacity>}
      />
      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
        ListEmptyComponent={<EmptyState icon="megaphone-outline" title="Kampanya yok" />}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.9} onPress={() => openEdit(item)} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  {item.discountType === 'percent' ? `%${item.discountValue}` : `${item.discountValue}₺`}
                </Text>
                <Text style={styles.discountSub}>indirim</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.desc}>{item.description}</Text>
              </View>
              <Badge variant={item.isActive ? 'success' : 'default'} size="sm">{item.isActive ? 'Aktif' : 'Pasif'}</Badge>
            </View>
            <View style={styles.cardFooter}>
              <View style={styles.footerItem}>
                <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.footerText}>{formatDate(item.startDate)} – {formatDate(item.endDate)}</Text>
              </View>
              <View style={styles.footerItem}>
                <Ionicons name="people-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.footerText}>{item.usageCount} kullanım</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      <Modal visible={!!selected} animationType="slide" transparent presentationStyle="overFullScreen">
        {selected && (
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>{selected.title}</Text>
              <Text style={styles.sheetDesc}>{selected.description}</Text>
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>İndirim</Text>
                <Text style={styles.sheetValue}>{selected.discountType === 'percent' ? `%${selected.discountValue}` : `${selected.discountValue}₺`}</Text>
              </View>
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>Tarih</Text>
                <Text style={styles.sheetValue}>{formatDate(selected.startDate)} – {formatDate(selected.endDate)}</Text>
              </View>
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>Kullanım</Text>
                <Text style={styles.sheetValue}>{selected.usageCount}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
                <Text style={styles.closeBtnText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
      <FormModal
        visible={modal.open}
        onClose={() => setModal({ open: false })}
        onSave={handleSave}
        title={modal.item ? 'Kampanya Düzenle' : 'Yeni Kampanya'}
        saving={createMutation.isPending || updateMutation.isPending}
        deleteLabel={modal.item ? 'Sil' : undefined}
        onDelete={modal.item ? () => deleteMutation.mutate() : undefined}
      >
        <FormField label="Başlık" value={form.title} onChangeText={v => setForm(p => ({ ...p, title: v }))} placeholder="Örn: Yaz İndirimi" />
        <FormField label="Açıklama" value={form.description} onChangeText={v => setForm(p => ({ ...p, description: v }))} placeholder="Açıklama (isteğe bağlı)" multiline />
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>İndirim Türü</Text>
          <View style={styles.segmentRow}>
            <TouchableOpacity style={[styles.segment, form.discountType === 'percent' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, discountType: 'percent' }))}><Text style={[styles.segmentText, form.discountType === 'percent' && styles.segmentTextActive]}>Yüzde</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.segment, form.discountType === 'fixed' && styles.segmentActive]} onPress={() => setForm(p => ({ ...p, discountType: 'fixed' }))}><Text style={[styles.segmentText, form.discountType === 'fixed' && styles.segmentTextActive]}>Sabit</Text></TouchableOpacity>
          </View>
        </View>
        <FormField label="İndirim Değeri" value={form.discountValue} onChangeText={v => setForm(p => ({ ...p, discountValue: v }))} placeholder={form.discountType === 'percent' ? 'Örn: 20' : 'Örn: 150'} keyboardType="numeric" />
        <FormField label="Başlangıç Tarihi" value={form.startDate} onChangeText={v => setForm(p => ({ ...p, startDate: v }))} placeholder="Örn: 2025-01-01" />
        <FormField label="Bitiş Tarihi" value={form.endDate} onChangeText={v => setForm(p => ({ ...p, endDate: v }))} placeholder="Örn: 2025-12-31" />
        <FormField label="Maks. Kullanım" value={form.maxUsage} onChangeText={v => setForm(p => ({ ...p, maxUsage: v }))} placeholder="Sınırsız için boş bırakın" keyboardType="numeric" />
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  addBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.primary },
  list: { paddingHorizontal: SPACE[5], paddingVertical: SPACE[4], paddingBottom: SPACE[10] },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE[3] },
  discountBadge: { width: 56, height: 56, borderRadius: RADIUS.lg, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  discountText: { fontSize: FONT.base, fontWeight: FONT.extrabold, color: COLORS.primaryDark },
  discountSub: { fontSize: 9, color: COLORS.primaryDark, fontWeight: FONT.medium },
  info: { flex: 1, gap: 3 },
  title: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.text },
  desc: { fontSize: FONT.xs, color: COLORS.textMuted },
  cardFooter: { flexDirection: 'row', gap: SPACE[4], borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: SPACE[3] },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: FONT.xs, color: COLORS.textMuted },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'], padding: SPACE[6], gap: SPACE[4] },
  sheetHandle: { width: 40, height: 4, backgroundColor: COLORS.borderLight, borderRadius: 2, alignSelf: 'center', marginBottom: SPACE[2] },
  sheetTitle: { fontSize: FONT.lg, fontWeight: FONT.bold, color: COLORS.text },
  sheetDesc: { fontSize: FONT.sm, color: COLORS.textMuted },
  sheetRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACE[2], borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  sheetLabel: { fontSize: FONT.sm, color: COLORS.textMuted },
  sheetValue: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  closeBtn: { backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.xl, padding: SPACE[4], alignItems: 'center', marginTop: SPACE[2] },
  closeBtnText: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  fieldGroup: { gap: SPACE[1] },
  fieldLabel: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  segmentRow: { flexDirection: 'row', backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, padding: 3 },
  segment: { flex: 1, paddingVertical: SPACE[2], alignItems: 'center', borderRadius: RADIUS.md },
  segmentActive: { backgroundColor: COLORS.surface, ...SHADOW.sm },
  segmentText: { fontSize: FONT.sm, fontWeight: FONT.medium, color: COLORS.textMuted },
  segmentTextActive: { color: COLORS.text, fontWeight: FONT.semibold },
});
