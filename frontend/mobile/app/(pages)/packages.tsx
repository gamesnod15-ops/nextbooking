import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { FormModal } from '@/components/ui/FormModal';
import { FormField } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils';
import type { BusinessPackage, Service } from '@/types';
import api from '@/lib/api';

export default function PackagesScreen() {
  const insets = useSafeAreaInsets();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const toast = useToast();
  const [search, setSearch] = useState('');
  const { data: items } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => { const res = await api.get('/packages'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
  });
  const list = (items ?? []) as BusinessPackage[];
  const filtered = list.filter((p) => (p.name?.toLowerCase() ?? '').includes(search.toLowerCase()));

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => { const res = await api.get('/services'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
  });
  const serviceList = (services ?? []) as Service[];

  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; item?: BusinessPackage }>({ open: false });
  const [form, setForm] = useState({
    name: '', description: '', price: '', originalPrice: '', validityDays: '365', sessions: '1', isActive: true, serviceIds: [] as string[],
  });

  function buildPayload() {
    const selected = serviceList.filter((s) => form.serviceIds.includes(s.id));
    const quantity = Number(form.sessions) || 1;
    return {
      name: form.name,
      description: form.description || undefined,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      validityDays: Number(form.validityDays),
      isActive: form.isActive,
      imageUrl: undefined,
      items: selected.map((s) => ({ serviceId: s.id, serviceName: s.name, quantity })),
    };
  }

  const createMutation = useMutation({
    mutationFn: async () => api.post('/packages', buildPayload()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['packages'] }); setModal({ open: false }); },
    onError: () => toast.error('Paket eklenemedi.'),
  });
  const updateMutation = useMutation({
    mutationFn: async () => api.put(`/packages/${modal.item!.id}`, buildPayload()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['packages'] }); setModal({ open: false }); },
    onError: () => toast.error('Paket güncellenemedi.'),
  });
  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/packages/${modal.item!.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['packages'] }); setModal({ open: false }); },
    onError: () => toast.error('Paket silinemedi.'),
  });

  function openCreate() {
    setForm({ name: '', description: '', price: '', originalPrice: '', validityDays: '365', sessions: '1', isActive: true, serviceIds: [] });
    setModal({ open: true, item: undefined });
  }
  function openEdit(item: BusinessPackage) {
    const firstQuantity = item.items?.[0]?.quantity;
    setForm({
      name: item.name,
      description: item.description ?? '',
      price: String(item.price),
      originalPrice: item.originalPrice != null ? String(item.originalPrice) : '',
      validityDays: String(item.validityDays ?? 365),
      sessions: firstQuantity != null ? String(firstQuantity) : '1',
      isActive: item.isActive,
      serviceIds: (item.items ?? []).map((i) => i.serviceId),
    });
    setModal({ open: true, item });
  }
  function handleSave() {
    if (!form.name || !form.price || !form.validityDays) { toast.warning('Ad, fiyat ve geçerlilik süresi zorunludur.'); return; }
    if (Number(form.validityDays) <= 0) { toast.warning('Geçerlilik süresi 0\'dan büyük olmalıdır.'); return; }
    if (modal.item) updateMutation.mutate(); else createMutation.mutate();
  }
  function toggleService(id: string) {
    setForm((p) => ({
      ...p,
      serviceIds: p.serviceIds.includes(id) ? p.serviceIds.filter((s) => s !== id) : [...p.serviceIds, id],
    }));
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Paketler" subtitle={`${list.length} paket`} showBack
        right={<TouchableOpacity style={styles.addBtn} onPress={openCreate} accessibilityRole="button" accessibilityLabel="Ekle"><Ionicons name="add" size={22} color={STATIC_WHITE} /></TouchableOpacity>}
      />
      <SearchBar value={search} onChangeText={setSearch} placeholder="Paket ara…" style={{ margin: SPACE[4] }} />
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState icon="cube-outline" title="Paket yok" />}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openEdit(item)} activeOpacity={0.7}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.desc}>{item.description}</Text>
              </View>
              <Badge variant={item.isActive ? 'success' : 'error'} size="sm">{item.isActive ? 'Aktif' : 'Pasif'}</Badge>
            </View>
            <View style={styles.services}>
              {(item.items ?? []).map((s) => (
                <View key={s.serviceId} style={styles.serviceTag}>
                  <Text style={styles.serviceTagText}>{s.serviceName}</Text>
                </View>
              ))}
            </View>
            <View style={styles.footer}>
              <View style={styles.sessions}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.sessionsText}>{item.validityDays} gün geçerli</Text>
              </View>
              <Text style={styles.price}>{formatCurrency(item.price)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <FormModal
        visible={modal.open} onClose={() => setModal({ open: false })} onSave={handleSave}
        title={modal.item ? 'Paket Düzenle' : 'Yeni Paket'}
        saving={createMutation.isPending || updateMutation.isPending}
        deleteLabel={modal.item ? 'Sil' : undefined} onDelete={modal.item ? () => deleteMutation.mutate() : undefined}
      >
        <FormField label="Paket Adı" value={form.name} onChangeText={v => setForm(p => ({...p,name:v}))} placeholder="Örn: Güzellik Paketi" />
        <FormField label="Açıklama" value={form.description} onChangeText={v => setForm(p => ({...p,description:v}))} placeholder="İsteğe bağlı" />
        <FormField label="Fiyat (₺)" value={form.price} onChangeText={v => setForm(p => ({...p,price:v}))} keyboardType="numeric" placeholder="Örn: 1999" />
        <FormField label="Eski Fiyat (₺, isteğe bağlı)" value={form.originalPrice} onChangeText={v => setForm(p => ({...p,originalPrice:v}))} keyboardType="numeric" placeholder="Örn: 2499" />
        <FormField label="Geçerlilik Süresi (gün)" value={form.validityDays} onChangeText={v => setForm(p => ({...p,validityDays:v}))} keyboardType="numeric" placeholder="Örn: 365" />
        <FormField label="Hizmet Başına Seans" value={form.sessions} onChangeText={v => setForm(p => ({...p,sessions:v}))} keyboardType="numeric" placeholder="Örn: 5" />
        <View style={styles.field}>
          <Text style={styles.label}>Hizmetler</Text>
          <View style={styles.serviceGrid}>
            {serviceList.length === 0 ? (
              <Text style={styles.emptyServicesText}>Kayıtlı hizmet bulunamadı.</Text>
            ) : serviceList.map((s) => {
              const selected = form.serviceIds.includes(s.id);
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.serviceChip, selected && styles.serviceChipActive]}
                  onPress={() => toggleService(s.id)}
                  activeOpacity={0.8}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={s.name}
                >
                  <Ionicons
                    name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={selected ? STATIC_WHITE : COLORS.textMuted}
                  />
                  <Text style={[styles.serviceChipText, selected && styles.serviceChipTextActive]}>{s.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </FormModal>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  addBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.primary },
  list: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[10] },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.text },
  desc: { fontSize: FONT.xs, color: COLORS.textMuted, marginTop: 2 },
  services: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[2] },
  serviceTag: { backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  serviceTagText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: FONT.medium },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: SPACE[3] },
  sessions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sessionsText: { fontSize: FONT.xs, color: COLORS.textMuted },
  price: { fontSize: FONT.lg, fontWeight: FONT.bold, color: COLORS.text },
  field: { gap: SPACE[1] },
  label: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[2] },
  serviceChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surfaceAlt },
  serviceChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  serviceChipText: { fontSize: FONT.sm, fontWeight: FONT.medium, color: COLORS.textSecondary },
  serviceChipTextActive: { color: STATIC_WHITE },
  emptyServicesText: { fontSize: FONT.sm, color: COLORS.textMuted },
});
