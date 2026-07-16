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
import api from '@/lib/api';
import type { Branch } from '@/types';

export default function BranchesScreen() {
  const insets = useSafeAreaInsets();
  const { data } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => { const res = await api.get('/branches'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
  });

  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; item?: Branch }>({ open: false });
  const [form, setForm] = useState({ name: '', address: '', phone: '' });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/branches', { name: form.name, address: form.address, phone: form.phone || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branches'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Şube eklenemedi.'),
  });

  const updateMutation = useMutation({
    mutationFn: async () => api.put(`/branches/${modal.item!.id}`, { name: form.name, address: form.address, phone: form.phone || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branches'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Şube güncellenemedi.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/branches/${modal.item!.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branches'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Şube silinemedi.'),
  });

  function openCreate() { setForm({ name: '', address: '', phone: '' }); setModal({ open: true, item: undefined }); }
  function openEdit(item: Branch) { setForm({ name: item.name, address: item.address, phone: item.phone ?? '' }); setModal({ open: true, item }); }
  function handleSave() {
    if (!form.name || !form.address) { Alert.alert('Uyarı', 'Ad ve adres zorunludur.'); return; }
    if (modal.item) updateMutation.mutate(); else createMutation.mutate();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Şubeler" subtitle={`${(data ?? []).length} şube`} showBack
        right={<TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={openCreate}><Ionicons name="add" size={22} color={COLORS.white} /></TouchableOpacity>}
      />
      <FlatList
        data={data ?? []}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
        ListEmptyComponent={<EmptyState icon="business-outline" title="Şube yok" />}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={() => openEdit(item)}>
            <View style={[styles.iconBox, { backgroundColor: item.isActive ? COLORS.primaryLight : COLORS.surfaceAlt }]}>
              <Ionicons name="business" size={22} color={item.isActive ? COLORS.primaryDark : COLORS.textMuted} />
            </View>
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.name}</Text>
                {item.isMain && (
                  <View style={styles.mainBadge}>
                    <Text style={styles.mainBadgeText}>Ana Şube</Text>
                  </View>
                )}
              </View>
              <View style={styles.row}>
                <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.address}>{item.address}</Text>
              </View>
              <View style={styles.row}>
                <Ionicons name="call-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.phone}>{item.phone}</Text>
              </View>
            </View>
            <View style={styles.right}>
              <Badge variant={item.isActive ? 'success' : 'default'} size="sm">{item.isActive ? 'Aktif' : 'Kapalı'}</Badge>
              {item.isActive && (
                <Text style={styles.apptCount}>{item.appointmentCount} randevu</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
      <FormModal
        visible={modal.open}
        onClose={() => setModal({ open: false })}
        onSave={handleSave}
        title={modal.item ? 'Şube Düzenle' : 'Yeni Şube'}
        saving={createMutation.isPending || updateMutation.isPending}
        deleteLabel={modal.item ? 'Sil' : undefined}
        onDelete={modal.item ? () => deleteMutation.mutate() : undefined}
      >
        <FormField label="Şube Adı" value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} placeholder="Örn: Merkez Şube" />
        <FormField label="Adres" value={form.address} onChangeText={v => setForm(p => ({ ...p, address: v }))} placeholder="Örn: Atatürk Cad. No:1" />
        <FormField label="Telefon" value={form.phone} onChangeText={v => setForm(p => ({ ...p, phone: v }))} placeholder="0555 555 55 55" keyboardType="phone-pad" />
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  addBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.primary },
  list: { paddingHorizontal: SPACE[5], paddingVertical: SPACE[4], paddingBottom: SPACE[10] },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  iconBox: { width: 48, height: 48, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2] },
  name: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.text },
  mainBadge: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  mainBadgeText: { fontSize: 10, color: COLORS.primaryDark, fontWeight: FONT.bold },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  address: { fontSize: FONT.xs, color: COLORS.textMuted },
  phone: { fontSize: FONT.xs, color: COLORS.textMuted },
  right: { alignItems: 'flex-end', gap: SPACE[2] },
  apptCount: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: FONT.medium },
});
