import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { FormField } from '@/components/ui/FormField';
import { formatDate } from '@/lib/utils';
import type { Survey } from '@/types';
import api from '@/lib/api';

export default function SurveysScreen() {
  const insets = useSafeAreaInsets();
  const { data: list = [] } = useQuery<Survey[]>({
    queryKey: ['surveys'],
    queryFn: async () => { const res = await api.get('/surveys'); return Array.isArray(res.data) ? res.data : []; },
  });

  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean }>({ open: false });
  const [form, setForm] = useState({ title: '', description: '' });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/surveys', { title: form.title, description: form.description || undefined, questions: 0, responses: 0, avgRating: 0, isActive: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['surveys'] }); setModal({ open: false }); },
    onError: () => Alert.alert('Hata', 'Anket eklenemedi.'),
  });

  function handleSave() {
    if (!form.title) { Alert.alert('Uyarı', 'Anket adı zorunludur.'); return; }
    createMutation.mutate();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Anketler" subtitle={`${list.filter(s => s.isActive).length} aktif`} showBack
        right={<TouchableOpacity style={styles.addBtn} onPress={() => setModal({ open: true })}><Ionicons name="add" size={22} color={COLORS.black} /></TouchableOpacity>}
      />
      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
        ListEmptyComponent={<EmptyState icon="bar-chart-outline" title="Anket yok" />}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.9} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <Ionicons name="clipboard" size={22} color={COLORS.primaryDark} />
              </View>
              <View style={styles.info}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.meta}>{item.questions} soru · {formatDate(item.createdAt)}</Text>
              </View>
              <Badge variant={item.isActive ? 'success' : 'default'} size="sm">{item.isActive ? 'Aktif' : 'Pasif'}</Badge>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{item.responses}</Text>
                <Text style={styles.statLabel}>Yanıt</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color={COLORS.warning} />
                  <Text style={styles.statValue}>{item.avgRating}</Text>
                </View>
                <Text style={styles.statLabel}>Ort. Puan</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{item.questions}</Text>
                <Text style={styles.statLabel}>Soru</Text>
              </View>
              <TouchableOpacity style={styles.viewBtn}>
                <Text style={styles.viewBtnText}>Sonuçlar</Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.primaryDark} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
      <FormModal
        visible={modal.open}
        onClose={() => setModal({ open: false })}
        title="Yeni Anket"
        onSave={handleSave}
        saving={createMutation.isPending}
      >
        <FormField label="Anket Adı" placeholder="Örn: Müşteri Memnuniyeti" value={form.title} onChangeText={(t) => setForm(p => ({ ...p, title: t }))} />
        <FormField label="Açıklama (isteğe bağlı)" placeholder="Anket açıklaması" value={form.description} onChangeText={(t) => setForm(p => ({ ...p, description: t }))} multiline />
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  addBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOW.primary },
  list: { paddingHorizontal: SPACE[5], paddingVertical: SPACE[4], paddingBottom: SPACE[10] },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[4], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE[3] },
  iconBox: { width: 44, height: 44, borderRadius: RADIUS.lg, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 3 },
  title: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.text },
  meta: { fontSize: FONT.xs, color: COLORS.textMuted },
  statsRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: SPACE[4], gap: SPACE[3] },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.textMuted },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.borderLight },
  viewBtn: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.full },
  viewBtnText: { fontSize: FONT.xs, color: COLORS.primaryDark, fontWeight: FONT.bold },
});

