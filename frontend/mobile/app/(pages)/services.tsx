import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, ScrollView, Switch, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { formatCurrency } from '@/lib/utils';
import type { Service } from '@/types';
import api from '@/lib/api';
import { FormModal } from '@/components/ui/FormModal';
import { FormField } from '@/components/ui/FormField';

const CATEGORIES = ['Tümü', 'Saç', 'Bakım', 'Tırnak', 'Yüz'];

export default function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const { data, refetch } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => { const res = await api.get('/services'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
  });
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('Tümü');
  const [refreshing, setRefreshing] = useState(false);

  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; item?: Service }>({ open: false });
  const [form, setForm] = useState({ name: '', description: '', price: '', durationMinutes: '' });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/services', { name: form.name, description: form.description, price: Number(form.price), durationMinutes: Number(form.durationMinutes) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Servis eklenemedi.'),
  });

  const updateMutation = useMutation({
    mutationFn: async () => api.put(`/services/${modal.item!.id}`, { name: form.name, description: form.description, price: Number(form.price), durationMinutes: Number(form.durationMinutes) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Servis güncellenemedi.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/services/${modal.item!.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Servis silinemedi.'),
  });

  function openCreate() { setForm({ name: '', description: '', price: '', durationMinutes: '' }); setModal({ open: true, item: undefined }); }
  function openEdit(item: Service) { setForm({ name: item.name, description: item.description ?? '', price: String(item.price), durationMinutes: String(item.durationMinutes) }); setModal({ open: true, item }); }
  function handleSave() {
    if (!form.name || !form.price) { Alert.alert('Uyarı', 'Ad ve fiyat zorunludur.'); return; }
    if (modal.item) updateMutation.mutate(); else createMutation.mutate();
  }

  async function onRefresh() { setRefreshing(true); await refetch(); setRefreshing(false); }

  const filtered = (data ?? []).filter((s) =>
    (cat === 'Tümü' || s.category === cat) &&
    (s.name?.toLowerCase() ?? '').includes(search.toLowerCase())
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Hizmetler" subtitle={`${(data ?? []).length} hizmet`} showBack
        right={
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={openCreate}>
            <Ionicons name="add" size={22} color={COLORS.white} />
          </TouchableOpacity>
        }
      />
      <SearchBar value={search} onChangeText={setSearch} placeholder="Hizmet ara…" style={{ margin: SPACE[4] }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACE[5], gap: SPACE[2], paddingBottom: SPACE[3], alignItems: 'center' }}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity key={c} style={[styles.chip, cat === c && styles.chipActive]} onPress={() => setCat(c)} activeOpacity={0.8}>
            <Text style={[styles.chipText, cat === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={<EmptyState icon="cut-outline" title="Hizmet yok" />}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => openEdit(item)}>
            <View style={[styles.catDot, { backgroundColor: item.isActive ? COLORS.successLight : COLORS.errorLight }]}>
              <Ionicons name="cut-outline" size={18} color={item.isActive ? COLORS.success : COLORS.error} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              {item.description && <Text style={styles.desc} numberOfLines={1}>{item.description}</Text>}
              <View style={styles.meta}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{item.durationMinutes} dk</Text>
                </View>
                {item.category && (
                  <Badge variant="default" size="sm">{item.category}</Badge>
                )}
              </View>
            </View>
            <View style={styles.right}>
              <Text style={styles.price}>{formatCurrency(item.price)}</Text>
              <Badge variant={item.isActive ? 'success' : 'error'} size="sm">
                {item.isActive ? 'Aktif' : 'Pasif'}
              </Badge>
            </View>
          </TouchableOpacity>
        )}
      />
      <FormModal
        visible={modal.open}
        onClose={() => setModal({ open: false })}
        onSave={handleSave}
        title={modal.item ? 'Hizmet Düzenle' : 'Yeni Hizmet'}
        saving={createMutation.isPending || updateMutation.isPending}
        deleteLabel={modal.item ? 'Sil' : undefined}
        onDelete={modal.item ? () => deleteMutation.mutate() : undefined}
      >
        <FormField label="Hizmet Adı" value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} placeholder="Örn: Saç Kesimi" />
        <FormField label="Açıklama" value={form.description} onChangeText={v => setForm(p => ({ ...p, description: v }))} placeholder="İsteğe bağlı" multiline />
        <FormField label="Süre (dk)" value={form.durationMinutes} onChangeText={v => setForm(p => ({ ...p, durationMinutes: v }))} placeholder="45" keyboardType="numeric" />
        <FormField label="Fiyat (₺)" value={form.price} onChangeText={v => setForm(p => ({ ...p, price: v }))} placeholder="250" keyboardType="numeric" />
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  addBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.primary },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: 'transparent', justifyContent: 'center' },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white },
  list: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[10] },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  catDot: { width: 44, height: 44, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 3 },
  name: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  desc: { fontSize: FONT.xs, color: COLORS.textMuted },
  meta: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: FONT.xs, color: COLORS.textMuted },
  right: { alignItems: 'flex-end', gap: SPACE[2] },
  price: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text },
});

