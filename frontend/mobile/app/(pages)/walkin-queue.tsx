import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { FormField } from '@/components/ui/FormField';
import { useState } from 'react';
import type { QueueEntry } from '@/types';
import api from '@/lib/api';

const COLUMNS: { status: QueueEntry['status']; label: string; color: string }[] = [
  { status: 'waiting', label: 'Bekliyor', color: COLORS.warning },
  { status: 'in_service', label: 'Hizmette', color: COLORS.info },
  { status: 'completed', label: 'Tamamlandı', color: COLORS.success },
];

export default function WalkinQueueScreen() {
  const insets = useSafeAreaInsets();
  const { data: queue = [] } = useQuery<QueueEntry[]>({
    queryKey: ['walkin-queue'],
    queryFn: async () => { const res = await api.get('/walkin-queue'); return Array.isArray(res.data) ? res.data : []; },
  });

  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean }>({ open: false });
  const [form, setForm] = useState({ customerName: '', serviceName: '', employeeName: '' });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/walkin-queue', { customerName: form.customerName, serviceName: form.serviceName || undefined, employeeName: form.employeeName || undefined, status: 'waiting', waitingMinutes: 0 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['walkin-queue'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Müşteri eklenemedi.'),
  });

  function handleSave() {
    if (!form.customerName) { Alert.alert('Uyarı', 'Müşteri adı zorunludur.'); return; }
    createMutation.mutate();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Sıra Takibi" subtitle={`${queue.filter(e => e.status !== 'completed').length} aktif müşteri`} showBack
        right={<TouchableOpacity style={styles.addBtn} onPress={() => { setForm({customerName:'',serviceName:'',employeeName:''}); setModal({open:true}); }}><Ionicons name="person-add" size={18} color={COLORS.white} /></TouchableOpacity>}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: SPACE[4], gap: SPACE[3] }}>
        {COLUMNS.map((col) => {
          const items = queue.filter((e) => e.status === col.status);
          return (
            <View key={col.status} style={styles.column}>
              <View style={[styles.colHeader, { borderTopColor: col.color }]}>
                <Text style={styles.colTitle}>{col.label}</Text>
                <View style={[styles.colBadge, { backgroundColor: col.color + '20' }]}>
                  <Text style={[styles.colBadgeText, { color: col.color }]}>{items.length}</Text>
                </View>
              </View>
              {items.map((item) => (
                <View key={item.id} style={styles.queueCard}>
                  <Avatar name={item.customerName} size={36} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.customerName}>{item.customerName}</Text>
                    <Text style={styles.serviceName}>{item.serviceName}</Text>
                    {item.employeeName && <Text style={styles.empName}>{item.employeeName}</Text>}
                    {item.waitingMinutes > 0 && (
                      <View style={styles.waitRow}>
                        <Ionicons name="time-outline" size={12} color={COLORS.warning} />
                        <Text style={styles.waitText}>{item.waitingMinutes} dk bekleme</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ gap: SPACE[2] }}>
                    {col.status === 'waiting' && (
                      <View style={[styles.moveBtn, { backgroundColor: COLORS.infoLight }]}>
                        <Ionicons name="play" size={12} color={COLORS.info} />
                      </View>
                    )}
                    {col.status === 'in_service' && (
                      <View style={[styles.moveBtn, { backgroundColor: COLORS.successLight }]}>
                        <Ionicons name="checkmark" size={12} color={COLORS.success} />
                      </View>
                    )}
                  </View>
                </View>
              ))}
              {items.length === 0 && (
                <View style={styles.emptyCol}>
                  <Text style={styles.emptyColText}>Boş</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
      <FormModal
        visible={modal.open}
        onClose={() => setModal({ open: false })}
        onSave={handleSave}
        title="Sıraya Ekle"
        saving={createMutation.isPending}
      >
        <FormField label="Müşteri Adı" value={form.customerName} onChangeText={v => setForm(p => ({...p, customerName: v}))} placeholder="Örn: Ali Yılmaz" />
        <FormField label="Hizmet" value={form.serviceName} onChangeText={v => setForm(p => ({...p, serviceName: v}))} placeholder="Örn: Saç Kesimi" />
        <FormField label="Personel" value={form.employeeName} onChangeText={v => setForm(p => ({...p, employeeName: v}))} placeholder="Opsiyonel" />
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  addBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.primary },
  column: { width: 230, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm, alignSelf: 'flex-start' },
  colHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACE[4], borderTopWidth: 3, backgroundColor: COLORS.surface },
  colTitle: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.text },
  colBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  colBadgeText: { fontSize: FONT.xs, fontWeight: FONT.bold },
  queueCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE[3], padding: SPACE[4], borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  customerName: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  serviceName: { fontSize: FONT.xs, color: COLORS.textMuted },
  empName: { fontSize: FONT.xs, color: COLORS.textSecondary },
  waitRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  waitText: { fontSize: 11, color: COLORS.warning, fontWeight: FONT.medium },
  moveBtn: { width: 28, height: 28, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  emptyCol: { padding: SPACE[6], alignItems: 'center' },
  emptyColText: { fontSize: FONT.sm, color: COLORS.textMuted },
});

