import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
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

export default function EmployeesScreen() {
  const insets = useSafeAreaInsets();
  const { data, refetch } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => { const r = await api.get('/employees'); return Array.isArray(r.data) ? r.data : r.data?.items ?? []; },
  });
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; item?: Employee }>({ open: false });
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', jobTitle: '' });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/employees', { fullName: form.fullName, phone: form.phone || undefined, email: form.email || undefined, jobTitle: form.jobTitle || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Personel eklenemedi.'),
  });

  const updateMutation = useMutation({
    mutationFn: async () => api.put(`/employees/${modal.item!.id}`, { fullName: form.fullName, phone: form.phone || undefined, email: form.email || undefined, jobTitle: form.jobTitle || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Personel güncellenemedi.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/employees/${modal.item!.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Personel silinemedi.'),
  });

  function openCreate() { setForm({ fullName: '', phone: '', email: '', jobTitle: '' }); setModal({ open: true, item: undefined }); }
  function openEdit(item: Employee) { setForm({ fullName: item.fullName, phone: item.phone ?? '', email: item.email ?? '', jobTitle: item.jobTitle ?? '' }); setModal({ open: true, item }); }
  function handleSave() {
    if (!form.fullName) { Alert.alert('Uyarı', 'Ad zorunludur.'); return; }
    if (modal.item) updateMutation.mutate(); else createMutation.mutate();
  }

  async function onRefresh() { setRefreshing(true); await refetch(); setRefreshing(false); }
  const filtered = (data ?? []).filter((e) => (e.fullName?.toLowerCase() ?? '').includes(search.toLowerCase()));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Çalışanlar" subtitle={`${(data ?? []).length} personel`} showBack
        right={<TouchableOpacity style={styles.addBtn} onPress={openCreate}><Ionicons name="add" size={22} color={COLORS.black} /></TouchableOpacity>}
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
              <Avatar name={item.fullName} size={52} />
              <View style={[styles.activeDot, { backgroundColor: item.isActive ? COLORS.success : COLORS.textMuted }]} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.fullName}</Text>
              {item.jobTitle && <Text style={styles.title}>{item.jobTitle}</Text>}
              {item.phone && (
                <View style={styles.row}>
                  <Ionicons name="call-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.detail}>{item.phone}</Text>
                </View>
              )}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: SPACE[2] }}>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {item.services?.map((s) => <Badge key={s} variant="default" size="sm">{s}</Badge>)}
                </View>
              </ScrollView>
            </View>
            <View>
              <TouchableOpacity style={styles.moreBtn}>
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
        <FormField label="Ad Soyad" value={form.fullName} onChangeText={v => setForm(p => ({ ...p, fullName: v }))} placeholder="Örn: Ali Yılmaz" />
        <FormField label="Telefon" value={form.phone} onChangeText={v => setForm(p => ({ ...p, phone: v }))} placeholder="0555 555 55 55" keyboardType="phone-pad" />
        <FormField label="E-posta" value={form.email} onChangeText={v => setForm(p => ({ ...p, email: v }))} placeholder="ornek@email.com" keyboardType="email-address" />
        <FormField label="Ünvan" value={form.jobTitle} onChangeText={v => setForm(p => ({ ...p, jobTitle: v }))} placeholder="Örn: Kalfası" />
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
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

