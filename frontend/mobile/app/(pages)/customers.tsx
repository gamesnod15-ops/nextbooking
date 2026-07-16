import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Modal, ScrollView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { Avatar } from '@/components/ui/Avatar';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { FormModal } from '@/components/ui/FormModal';
import { FormField } from '@/components/ui/FormField';
import { MenuButton, NotifButton } from '@/components/DrawerMenu';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Customer } from '@/types';

function useCustomers() {
  return useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/customers');
      return Array.isArray(res.data) ? res.data : res.data?.items ?? [];
    },
    staleTime: 1000 * 60,
  });
}

export default function CustomersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, isLoading, refetch } = useCustomers();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; item?: Customer }>({ open: false });
  const [form, setForm] = useState({ name: '', phone: '', email: '', tags: '' });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/customers', {
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Müşteri eklenemedi.'),
  });

  const updateMutation = useMutation({
    mutationFn: async () => api.put(`/customers/${modal.item!.id}`, {
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Müşteri güncellenemedi.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/customers/${modal.item!.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Müşteri silinemedi.'),
  });

  function openCreate() { setForm({ name: '', phone: '', email: '', tags: '' }); setModal({ open: true, item: undefined }); }
  function openEdit(item: Customer) { setForm({ name: item.name, phone: item.phone, email: item.email ?? '', tags: (item.tags ?? []).join(', ') }); setModal({ open: true, item }); }
  function handleSave() {
    if (!form.name || !form.phone) { Alert.alert('Uyarı', 'Ad ve telefon zorunludur.'); return; }
    if (modal.item) updateMutation.mutate(); else createMutation.mutate();
  }

  const filtered = (data ?? []).filter((c) =>
    (c.name?.toLowerCase() ?? '').includes(search.toLowerCase()) ||
    (c.phone ?? '').includes(search)
  );

  function renderItem({ item }: { item: Customer }) {
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => openEdit(item)}>
        <Avatar name={item.name} size={48} />
        <View style={styles.info}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACE[2] }}>
            <Text style={styles.name}>{item.name}</Text>
            {item.tags?.includes('VIP') && <Badge variant="primary" size="sm">VIP</Badge>}
          </View>
          <Text style={styles.phone}>{item.phone}</Text>
          <Text style={styles.stats}>
            {item.totalVisits ?? 0} randevu · {formatCurrency(item.totalSpent ?? 0)}
          </Text>
        </View>
        <View style={styles.right}>
          <View style={styles.pointsChip}>
            <Ionicons name="star" size={12} color={COLORS.warning} />
            <Text style={styles.points}>{item.totalVisits ?? 0}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACE[2] }}>
          <TouchableOpacity onPress={() => router.replace('/(business)')} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Müşteriler</Text>
            <Text style={styles.subtitle}>{filtered.length} müşteri</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={openCreate}>
            <Ionicons name="add" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <NotifButton />
          <MenuButton />
        </View>
      </View>
      <SearchBar value={search} onChangeText={setSearch} placeholder="İsim veya telefon ara…" style={styles.search} />
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={<EmptyState icon="people-outline" title="Müşteri yok" description="Arama kriterlerinize uygun müşteri bulunamadı." />}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
      />
      <FormModal
        visible={modal.open}
        onClose={() => setModal({ open: false })}
        onSave={handleSave}
        title={modal.item ? 'Müşteri Düzenle' : 'Yeni Müşteri'}
        saving={createMutation.isPending || updateMutation.isPending}
        deleteLabel={modal.item ? 'Sil' : undefined}
        onDelete={modal.item ? () => deleteMutation.mutate() : undefined}
      >
        <FormField label="Ad Soyad" value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} placeholder="Örn: Ali Yılmaz" />
        <FormField label="Telefon" value={form.phone} onChangeText={v => setForm(p => ({ ...p, phone: v }))} placeholder="0555 555 55 55" keyboardType="phone-pad" />
        <FormField label="E-posta" value={form.email} onChangeText={v => setForm(p => ({ ...p, email: v }))} placeholder="ornek@mail.com" keyboardType="email-address" />
        <FormField label="Etiketler" value={form.tags} onChangeText={v => setForm(p => ({ ...p, tags: v }))} placeholder="VIP, Yeni, Düzenli (virgülle ayırın)" />
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE[5],
    paddingVertical: SPACE[4],
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: { fontSize: FONT.xl, fontWeight: FONT.extrabold, color: COLORS.text },
  subtitle: { fontSize: FONT.xs, color: COLORS.textMuted, marginTop: 2 },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.primary,
  },
  search: { marginHorizontal: SPACE[5], marginVertical: SPACE[3] },
  list: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[10] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACE[4],
    gap: SPACE[3],
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW.sm,
  },
  info: { flex: 1, gap: 3 },
  name: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  phone: { fontSize: FONT.xs, color: COLORS.textMuted },
  stats: { fontSize: FONT.xs, color: COLORS.textSecondary, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: SPACE[2] },
  pointsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  points: { fontSize: FONT.xs, fontWeight: FONT.bold, color: '#92400E' },
});
