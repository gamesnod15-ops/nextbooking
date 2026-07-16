import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { FormModal } from '@/components/ui/FormModal';
import { FormField } from '@/components/ui/FormField';
import { formatCurrency } from '@/lib/utils';
import type { BusinessPackage } from '@/types';
import api from '@/lib/api';

export default function PackagesScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const { data: items } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => { const res = await api.get('/packages'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
  });
  const list = (items ?? []) as BusinessPackage[];
  const filtered = list.filter((p) => (p.name?.toLowerCase() ?? '').includes(search.toLowerCase()));

  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; item?: BusinessPackage }>({ open: false });
  const [form, setForm] = useState({ name: '', description: '', price: '', sessions: '', services: '', isActive: true });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/packages', { name: form.name, description: form.description || undefined, price: Number(form.price), sessions: Number(form.sessions), services: form.services.split(',').map(s => s.trim()).filter(Boolean), isActive: form.isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['packages'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Paket eklenemedi.'),
  });
  const updateMutation = useMutation({
    mutationFn: async () => api.put(`/packages/${modal.item!.id}`, { name: form.name, description: form.description || undefined, price: Number(form.price), sessions: Number(form.sessions), services: form.services.split(',').map(s => s.trim()).filter(Boolean), isActive: form.isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['packages'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Paket güncellenemedi.'),
  });
  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/packages/${modal.item!.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['packages'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Paket silinemedi.'),
  });

  function openCreate() { setForm({ name: '', description: '', price: '', sessions: '', services: '', isActive: true }); setModal({ open: true, item: undefined }); }
  function openEdit(item: BusinessPackage) { setForm({ name: item.name, description: item.description ?? '', price: String(item.price), sessions: String(item.sessions), services: (item.services ?? []).join(', '), isActive: item.isActive }); setModal({ open: true, item }); }
  function handleSave() {
    if (!form.name || !form.price || !form.sessions) { Alert.alert('Uyarı', 'Ad, fiyat ve seans sayısı zorunludur.'); return; }
    if (modal.item) updateMutation.mutate(); else createMutation.mutate();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Paketler" subtitle={`${list.length} paket`} showBack
        right={<TouchableOpacity style={styles.addBtn} onPress={openCreate}><Ionicons name="add" size={22} color={COLORS.white} /></TouchableOpacity>}
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
              {(item.services ?? []).map((s) => (
                <View key={s} style={styles.serviceTag}>
                  <Text style={styles.serviceTagText}>{s}</Text>
                </View>
              ))}
            </View>
            <View style={styles.footer}>
              <View style={styles.sessions}>
                <Ionicons name="refresh-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.sessionsText}>{item.sessions} seans</Text>
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
        <FormField label="Seans Sayısı" value={form.sessions} onChangeText={v => setForm(p => ({...p,sessions:v}))} keyboardType="numeric" placeholder="Örn: 5" />
        <FormField label="Fiyat (₺)" value={form.price} onChangeText={v => setForm(p => ({...p,price:v}))} keyboardType="numeric" placeholder="Örn: 1999" />
        <FormField label="Hizmetler (virgülle ayır)" value={form.services} onChangeText={v => setForm(p => ({...p,services:v}))} placeholder="Saç Kesimi, Sakal, Fön" />
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
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
});

