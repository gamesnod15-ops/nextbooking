import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { FormField } from '@/components/ui/FormField';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';
import api from '@/lib/api';

const LOW_STOCK_THRESHOLD = 5;

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const { data: items } = useQuery({
    queryKey: ['products'],
    queryFn: async () => { const res = await api.get('/products'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
  });
  const safeItems = (items ?? []) as Product[];
  const filtered = safeItems.filter((p) => (p.name?.toLowerCase() ?? '').includes(search.toLowerCase()) || (p.sku ?? '').toLowerCase().includes(search.toLowerCase()));

  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; item?: Product }>({ open: false });
  const [form, setForm] = useState({ name: '', sku: '', price: '', stock: '', category: '' });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/products', { name: form.name, sku: form.sku, price: Number(form.price), stock: Number(form.stock), category: form.category }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Ürün eklenemedi.'),
  });
  const updateMutation = useMutation({
    mutationFn: async () => api.put(`/products/${modal.item!.id}`, { name: form.name, sku: form.sku, price: Number(form.price), stock: Number(form.stock), category: form.category }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Ürün güncellenemedi.'),
  });
  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/products/${modal.item!.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Ürün silinemedi.'),
  });

  function openCreate() { setForm({ name: '', sku: '', price: '', stock: '0', category: '' }); setModal({ open: true, item: undefined }); }
  function openEdit(item: Product) { setForm({ name: item.name, sku: item.sku ?? '', price: String(item.price), stock: String(item.stock), category: item.category ?? '' }); setModal({ open: true, item }); }
  function handleSave() {
    if (!form.name || !form.price) { Alert.alert('Uyarı', 'Ad ve fiyat zorunludur.'); return; }
    if (modal.item) updateMutation.mutate(); else createMutation.mutate();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Ürünler & Stok" subtitle={`${safeItems.length} ürün`} showBack
        right={<TouchableOpacity style={styles.addBtn} onPress={openCreate}><Ionicons name="add" size={22} color={COLORS.white} /></TouchableOpacity>}
      />
      {/* Low stock alert */}
      {safeItems.some(p => p.stock <= LOW_STOCK_THRESHOLD && p.isActive) && (
        <View style={styles.alert}>
          <Ionicons name="warning" size={16} color={COLORS.warning} />
          <Text style={styles.alertText}>{safeItems.filter(p => p.stock <= LOW_STOCK_THRESHOLD && p.isActive).length} ürün kritik stok seviyesinde</Text>
        </View>
      )}
      <SearchBar value={search} onChangeText={setSearch} placeholder="Ürün veya SKU ara…" style={{ marginHorizontal: SPACE[5], marginBottom: SPACE[3] }} />
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
        ListEmptyComponent={<EmptyState icon="cube-outline" title="Ürün bulunamadı" />}
        renderItem={({ item }) => {
          const isLow = item.stock > 0 && item.stock <= LOW_STOCK_THRESHOLD;
          const isOut = item.stock === 0;
          return (
            <TouchableOpacity style={styles.card} onPress={() => openEdit(item)} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: isOut ? COLORS.errorLight : isLow ? COLORS.warningLight : COLORS.infoLight }]}>
                <Ionicons name="cube" size={22} color={isOut ? COLORS.error : isLow ? COLORS.warning : COLORS.info} />
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sku}>{item.sku} · {item.category}</Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.price}>{formatCurrency(item.price)}</Text>
                <View style={styles.stockRow}>
                  <Ionicons name={isOut ? 'close-circle' : isLow ? 'alert-circle' : 'checkmark-circle'} size={14} color={isOut ? COLORS.error : isLow ? COLORS.warning : COLORS.success} />
                  <Text style={[styles.stock, { color: isOut ? COLORS.error : isLow ? COLORS.warning : COLORS.textMuted }]}>
                    {item.stock} adet
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
      <FormModal
        visible={modal.open} onClose={() => setModal({ open: false })} onSave={handleSave}
        title={modal.item ? 'Ürün Düzenle' : 'Yeni Ürün'}
        saving={createMutation.isPending || updateMutation.isPending}
        deleteLabel={modal.item ? 'Sil' : undefined} onDelete={modal.item ? () => deleteMutation.mutate() : undefined}
      >
        <FormField label="Ürün Adı" value={form.name} onChangeText={v => setForm(p => ({...p,name:v}))} placeholder="Örn: Şampuan Pro" />
        <FormField label="SKU (stok kodu)" value={form.sku} onChangeText={v => setForm(p => ({...p,sku:v}))} placeholder="PRD-001" />
        <FormField label="Kategori" value={form.category} onChangeText={v => setForm(p => ({...p,category:v}))} placeholder="Saç Bakım" />
        <FormField label="Fiyat (₺)" value={form.price} onChangeText={v => setForm(p => ({...p,price:v}))} keyboardType="numeric" />
        <FormField label="Stok Adedi" value={form.stock} onChangeText={v => setForm(p => ({...p,stock:v}))} keyboardType="numeric" />
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  addBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.primary },
  alert: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], backgroundColor: COLORS.warningLight, marginHorizontal: SPACE[5], marginTop: SPACE[3], borderRadius: RADIUS.lg, padding: SPACE[3] },
  alertText: { fontSize: FONT.sm, color: COLORS.warning, fontWeight: FONT.semibold },
  list: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[10] },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  iconBox: { width: 48, height: 48, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 3 },
  name: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  sku: { fontSize: FONT.xs, color: COLORS.textMuted },
  right: { alignItems: 'flex-end', gap: SPACE[2] },
  price: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stock: { fontSize: FONT.xs, fontWeight: FONT.medium },
});

