import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { PatternOverlay } from '@/components/ui/PatternOverlay';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { FormField } from '@/components/ui/FormField';
import { formatCurrency } from '@/lib/utils';
import api, { API_ORIGIN } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const LOW_STOCK_THRESHOLD = 5;

// Local shape matching the backend's ProductDto (RandevumKolay.Application.Features.Products.ProductDto)
// exactly — the shared `Product` type in `@/types` used different field names (price/stock/sku)
// that don't exist on the API response, so it isn't used here.
interface ProductRecord {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  barcode?: string | null;
  salePrice: number;
  costPrice?: number | null;
  stockQuantity: number;
  minStockLevel: number;
  unit: string;
  isActive: boolean;
  isLowStock: boolean;
  imageUrl?: string | null;
}

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const toast = useToast();
  const [search, setSearch] = useState('');
  const { data: items } = useQuery({
    queryKey: ['products'],
    queryFn: async () => { const res = await api.get('/products'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
  });
  const safeItems = (items ?? []) as ProductRecord[];
  const filtered = safeItems.filter((p) => (p.name?.toLowerCase() ?? '').includes(search.toLowerCase()) || (p.barcode ?? '').toLowerCase().includes(search.toLowerCase()));

  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; item?: ProductRecord }>({ open: false });
  const [form, setForm] = useState({ name: '', barcode: '', price: '', stock: '', category: '', description: '', costPrice: '', minStockLevel: '5', unit: 'adet' });

  function buildPayload() {
    return {
      name: form.name,
      salePrice: Number(form.price),
      stockQuantity: Number(form.stock),
      category: form.category || undefined,
      barcode: form.barcode || undefined,
      costPrice: form.costPrice ? Number(form.costPrice) : undefined,
      // MinStockLevel and Unit are non-nullable on the backend's Create/UpdateProductCommand
      // with no default value — omitting them (or sending undefined) resets MinStockLevel to 0
      // and Unit to null on every save, so they must always be carried even without a form field.
      minStockLevel: form.minStockLevel ? Number(form.minStockLevel) : 5,
      unit: form.unit || 'adet',
      description: form.description || undefined,
    };
  }

  const [uploadingImage, setUploadingImage] = useState(false);

  async function pickProductImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { toast.warning('Galeri erişimine izin vermelisiniz.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    if (!modal.item?.id) { toast.warning('Önce ürünü kaydedin.'); return; }
    setUploadingImage(true);
    try {
      const filename = result.assets[0].uri.split('/').pop() || 'product.jpg';
      const formData = new FormData();
      formData.append('file', { uri: result.assets[0].uri, name: filename, type: 'image/jpeg' } as any);
      await api.put(`/products/${modal.item.id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Ürün fotoğrafı güncellendi.');
    } catch {
      toast.error('Fotoğraf yüklenemedi.');
    } finally {
      setUploadingImage(false);
    }
  }

  const createMutation = useMutation({
    mutationFn: async () => api.post('/products', buildPayload()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setModal({ open: false }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Ürün eklenemedi.'),
  });
  const updateMutation = useMutation({
    // UpdateProductCommand.Id is bound from the request body and compared against the route id
    // by ProductsController (`if (id != command.Id) return BadRequest()`) — it must be included here.
    mutationFn: async () => api.put(`/products/${modal.item!.id}`, { id: modal.item!.id, ...buildPayload() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setModal({ open: false }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Ürün güncellenemedi.'),
  });
  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/products/${modal.item!.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setModal({ open: false }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Ürün silinemedi.'),
  });

  function openCreate() { setForm({ name: '', barcode: '', price: '', stock: '0', category: '', description: '', costPrice: '', minStockLevel: '5', unit: 'adet' }); setModal({ open: true, item: undefined }); }
  function openEdit(item: ProductRecord) {
    setForm({
      name: item.name,
      barcode: item.barcode ?? '',
      price: String(item.salePrice),
      stock: String(item.stockQuantity),
      category: item.category ?? '',
      description: item.description ?? '',
      costPrice: item.costPrice != null ? String(item.costPrice) : '',
      minStockLevel: String(item.minStockLevel ?? 5),
      unit: item.unit || 'adet',
    });
    setModal({ open: true, item });
  }
  function handleSave() {
    if (!form.name || !form.price) { toast.warning('Ad ve fiyat zorunludur.'); return; }
    if (modal.item) updateMutation.mutate(); else createMutation.mutate();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <PatternOverlay opacity={0.25} />
      <ScreenHeader title="Ürünler & Stok" subtitle={`${safeItems.length} ürün`} showBack
        right={<TouchableOpacity style={styles.addBtn} onPress={openCreate} accessibilityRole="button" accessibilityLabel="Ekle"><Ionicons name="add" size={22} color={STATIC_WHITE} /></TouchableOpacity>}
      />
      {/* Low stock alert */}
      {safeItems.some(p => p.stockQuantity <= LOW_STOCK_THRESHOLD && p.isActive) && (
        <View style={styles.alert}>
          <Ionicons name="warning" size={16} color={COLORS.warning} />
          <Text style={styles.alertText}>{safeItems.filter(p => p.stockQuantity <= LOW_STOCK_THRESHOLD && p.isActive).length} ürün kritik stok seviyesinde</Text>
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
          const isLow = item.stockQuantity > 0 && item.stockQuantity <= LOW_STOCK_THRESHOLD;
          const isOut = item.stockQuantity === 0;
          return (
            <TouchableOpacity style={styles.card} onPress={() => openEdit(item)} activeOpacity={0.7}>
              {item.imageUrl ? (
                <Image source={{ uri: `${API_ORIGIN}${item.imageUrl}` }} style={styles.productImage} />
              ) : (
                <View style={[styles.iconBox, { backgroundColor: isOut ? COLORS.errorLight : isLow ? COLORS.warningLight : COLORS.infoLight }]}>
                  <Ionicons name="cube" size={22} color={isOut ? COLORS.error : isLow ? COLORS.warning : COLORS.info} />
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sku}>{item.barcode} · {item.category}</Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.price}>{formatCurrency(item.salePrice)}</Text>
                <View style={styles.stockRow}>
                  <Ionicons name={isOut ? 'close-circle' : isLow ? 'alert-circle' : 'checkmark-circle'} size={14} color={isOut ? COLORS.error : isLow ? COLORS.warning : COLORS.success} />
                  <Text style={[styles.stock, { color: isOut ? COLORS.error : isLow ? COLORS.warning : COLORS.textMuted }]}>
                    {item.stockQuantity} adet
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
        <FormField label="SKU (stok kodu)" value={form.barcode} onChangeText={v => setForm(p => ({...p,barcode:v}))} placeholder="PRD-001" />
        <FormField label="Kategori" value={form.category} onChangeText={v => setForm(p => ({...p,category:v}))} placeholder="Saç Bakım" />
        <FormField label="Fiyat (₺)" value={form.price} onChangeText={v => setForm(p => ({...p,price:v}))} keyboardType="numeric" />
        <FormField label="Stok Adedi" value={form.stock} onChangeText={v => setForm(p => ({...p,stock:v}))} keyboardType="numeric" />
        {modal.item && (
          <TouchableOpacity style={styles.imageUploadBtn} onPress={pickProductImage} disabled={uploadingImage}>
            <Ionicons name="camera" size={20} color={STATIC_WHITE} />
            <Text style={styles.imageUploadText}>{uploadingImage ? 'Yükleniyor…' : 'Fotoğraf Ekle'}</Text>
          </TouchableOpacity>
        )}
      </FormModal>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  addBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.primary },
  alert: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], backgroundColor: COLORS.warningLight, marginHorizontal: SPACE[5], marginTop: SPACE[3], borderRadius: RADIUS.lg, padding: SPACE[3] },
  alertText: { fontSize: FONT.sm, color: COLORS.warning, fontWeight: FONT.semibold },
  list: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[10] },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  productImage: { width: 48, height: 48, borderRadius: RADIUS.lg },
  iconBox: { width: 48, height: 48, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 3 },
  name: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  sku: { fontSize: FONT.xs, color: COLORS.textMuted },
  right: { alignItems: 'flex-end', gap: SPACE[2] },
  price: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stock: { fontSize: FONT.xs, fontWeight: FONT.medium },
  imageUploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE[2], backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACE[3] },
  imageUploadText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: STATIC_WHITE },
});

