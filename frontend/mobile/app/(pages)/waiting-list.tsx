import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateTime } from '@/lib/utils';
import type { WaitingListEntry } from '@/types';
import api from '@/lib/api';
import { FormModal } from '@/components/ui/FormModal';
import { FormField } from '@/components/ui/FormField';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const STATUS_FILTERS = ['Tümü', 'Bekliyor', 'Bildirim Gitti', 'Onaylandı'];

export default function WaitingListScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('Tümü');
  const { data: list = [] } = useQuery<WaitingListEntry[]>({
    queryKey: ['waiting-list'],
    queryFn: async () => { const res = await api.get('/waiting-list'); return Array.isArray(res.data) ? res.data : []; },
  });
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean }>({ open: false });
  const [form, setForm] = useState({ customerName: '', customerPhone: '', serviceName: '', notes: '' });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/waiting-list', { customerName: form.customerName, customerPhone: form.customerPhone, serviceName: form.serviceName || undefined, notes: form.notes || undefined, status: 'waiting' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['waiting-list'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Kişi eklenemedi.'),
  });

  function handleSave() {
    if (!form.customerName) { Alert.alert('Uyarı', 'Müşteri adı zorunludur.'); return; }
    createMutation.mutate();
  }

  const filtered = list.filter((e) => {
    if (filter === 'Tümü') return true;
    if (filter === 'Bekliyor') return e.status === 'waiting';
    if (filter === 'Bildirim Gitti') return e.status === 'notified';
    if (filter === 'Onaylandı') return e.status === 'confirmed';
    return true;
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Bekleme Listesi" subtitle={`${list.length} kişi`} showBack
        right={<TouchableOpacity style={styles.addBtn} onPress={() => { setForm({customerName:'',customerPhone:'',serviceName:'',notes:''}); setModal({open:true}); }}><Ionicons name="add" size={22} color={COLORS.white} /></TouchableOpacity>}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACE[5], paddingVertical: SPACE[3], gap: SPACE[2], alignItems: 'center' }}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity key={f} style={[styles.chip, filter === f && styles.chipActive]} onPress={() => setFilter(f)} activeOpacity={0.8}>
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
        ListEmptyComponent={<EmptyState icon="hourglass-outline" title="Bekleme listesi boş" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Avatar name={item.customerName} size={44} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.customerName}</Text>
              <Text style={styles.service}>{item.serviceName}</Text>
              <View style={styles.row}>
                <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.date}>{formatDateTime(item.preferredDate ?? item.createdAt)}</Text>
              </View>
            </View>
            <View style={styles.right}>
              <Badge variant={item.status === 'confirmed' ? 'success' : item.status === 'notified' ? 'warning' : 'default'} size="sm">
                {item.status === 'confirmed' ? 'Onaylandı' : item.status === 'notified' ? 'Bildirim' : 'Bekliyor'}
              </Badge>
              {item.status === 'waiting' && (
                <TouchableOpacity style={styles.notifyBtn}>
                  <Ionicons name="notifications-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.notifyText}>Bildir</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
      <FormModal
        visible={modal.open}
        onClose={() => setModal({ open: false })}
        onSave={handleSave}
        title="Bekleme Listesine Ekle"
        saving={createMutation.isPending}
      >
        <FormField label="Müşteri Adı" value={form.customerName} onChangeText={v => setForm(p => ({...p, customerName: v}))} placeholder="Örn: Ali Yılmaz" />
        <FormField label="Telefon" value={form.customerPhone} onChangeText={v => setForm(p => ({...p, customerPhone: v}))} placeholder="05XX XXX XXXX" keyboardType="phone-pad" />
        <FormField label="Hizmet" value={form.serviceName} onChangeText={v => setForm(p => ({...p, serviceName: v}))} placeholder="Örn: Saç Kesimi" />
        <FormField label="Not" value={form.notes} onChangeText={v => setForm(p => ({...p, notes: v}))} placeholder="Opsiyonel" multiline />
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
  info: { flex: 1, gap: 3 },
  name: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  service: { fontSize: FONT.xs, color: COLORS.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  date: { fontSize: FONT.xs, color: COLORS.textMuted },
  right: { alignItems: 'flex-end', gap: SPACE[2] },
  notifyBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  notifyText: { fontSize: 11, color: COLORS.primary, fontWeight: FONT.bold },
});

