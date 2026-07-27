import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { formatCurrency } from '@/lib/utils';
import type { Employee } from '@/types';
import api from '@/lib/api';
import { FormModal } from '@/components/ui/FormModal';
import { FormField } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';

export default function EmployeesScreen() {
  const insets = useSafeAreaInsets();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const toast = useToast();
  const { data, refetch } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => { const r = await api.get('/employees'); return Array.isArray(r.data) ? r.data : r.data?.items ?? []; },
  });
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; item?: Employee }>({ open: false });
  const [form, setForm] = useState({ name: '', phone: '', email: '', title: '' });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/employees', { name: form.name, phone: form.phone || undefined, email: form.email || undefined, title: form.title || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setModal({ open: false }); },
    onError: () => toast.error('Personel eklenemedi.'),
  });

  const updateMutation = useMutation({
    mutationFn: async () => api.put(`/employees/${modal.item!.id}`, { name: form.name, phone: form.phone || undefined, email: form.email || undefined, title: form.title || undefined, isActive: modal.item!.isActive, acceptsOnlineBookings: modal.item!.acceptsOnlineBookings ?? true, serviceIds: modal.item!.serviceIds }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setModal({ open: false }); },
    onError: () => toast.error('Personel güncellenemedi.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/employees/${modal.item!.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setModal({ open: false }); },
    onError: () => toast.error('Personel silinemedi.'),
  });

  function openCreate() { setForm({ name: '', phone: '', email: '', title: '' }); setModal({ open: true, item: undefined }); }
  function openEdit(item: Employee) { setForm({ name: item.name, phone: item.phone ?? '', email: item.email ?? '', title: item.title ?? '' }); setModal({ open: true, item }); }
  function handleSave() {
    if (!form.name) { toast.warning('Ad zorunludur.'); return; }
    if (modal.item) updateMutation.mutate(); else createMutation.mutate();
  }

  async function onRefresh() { setRefreshing(true); await refetch(); setRefreshing(false); }
  const filtered = (data ?? []).filter((e) => (e.name?.toLowerCase() ?? '').includes(search.toLowerCase()));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Çalışanlar" subtitle={`${(data ?? []).length} personel`} showBack
        right={<TouchableOpacity style={styles.addBtn} onPress={openCreate} accessibilityRole="button" accessibilityLabel="Ekle"><Ionicons name="add" size={22} color={STATIC_WHITE} /></TouchableOpacity>}
      />
      <SearchBar value={search} onChangeText={setSearch} placeholder="Personel ara…" style={{ margin: SPACE[4] }} />
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={<EmptyState icon="people-circle-outline" title="Personel yok" />}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => openEdit(item)}>
            <View>
              <Avatar name={item.name} size={52} />
              <View style={[styles.activeDot, { backgroundColor: item.isActive ? COLORS.success : COLORS.textMuted }]} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              {item.title && <Text style={styles.title}>{item.title}</Text>}
              {item.phone && (
                <View style={styles.row}>
                  <Ionicons name="call-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.detail}>{item.phone}</Text>
                </View>
              )}
              {item.serviceIds && item.serviceIds.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: SPACE[2] }}>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {item.serviceIds.map((s) => <Badge key={s} variant="default" size="sm">{s}</Badge>)}
                  </View>
                </ScrollView>
              )}
            </View>
            <View>
              <TouchableOpacity style={styles.moreBtn} accessibilityRole="button" accessibilityLabel="Diğer işlemler">
                <Ionicons name="ellipsis-vertical" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
      <FormModal
        visible={modal.open}
        onClose={() => setModal({ open: false })}
        onSave={handleSave}
        title={modal.item ? 'Personel Düzenle' : 'Yeni Personel'}
        saving={createMutation.isPending || updateMutation.isPending}
        deleteLabel={modal.item ? 'Sil' : undefined}
        onDelete={modal.item ? () => deleteMutation.mutate() : undefined}
      >
        <FormField label="Ad Soyad" value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} placeholder="Örn: Ali Yılmaz" />
        <FormField label="Telefon" value={form.phone} onChangeText={v => setForm(p => ({ ...p, phone: v }))} placeholder="0555 555 55 55" keyboardType="phone-pad" />
        <FormField label="E-posta" value={form.email} onChangeText={v => setForm(p => ({ ...p, email: v }))} placeholder="ornek@email.com" keyboardType="email-address" />
        <FormField label="Ünvan" value={form.title} onChangeText={v => setForm(p => ({ ...p, title: v }))} placeholder="Örn: Kalfası" />
      </FormModal>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  addBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.primary },
  list: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[10] },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  activeDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: COLORS.surface },
  info: { flex: 1, gap: 2 },
  name: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  title: { fontSize: FONT.xs, color: COLORS.textSecondary, fontWeight: FONT.medium },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  detail: { fontSize: FONT.xs, color: COLORS.textMuted },
  moreBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});

