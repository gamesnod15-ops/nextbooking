import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import type { Survey } from '@/types';
import api from '@/lib/api';

function Stars({ rating }: { rating: number }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= rating ? 'star' : 'star-outline'}
          size={13}
          color={n <= rating ? COLORS.warning : COLORS.textMuted}
        />
      ))}
    </View>
  );
}

export default function SurveysScreen() {
  const insets = useSafeAreaInsets();
  const { data: list = [], refetch, isRefetching } = useQuery<Survey[]>({
    queryKey: ['surveys'],
    queryFn: async () => { const res = await api.get('/surveys'); return Array.isArray(res.data) ? res.data : []; },
  });

  const qc = useQueryClient();

  const approvalMutation = useMutation({
    mutationFn: async ({ id, isApproved }: { id: string; isApproved: boolean }) =>
      api.patch(`/surveys/${id}/approval`, { isApproved }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['surveys'] }),
    onError: () => Alert.alert('Hata', 'Durum güncellenemedi.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/surveys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['surveys'] }),
    onError: () => Alert.alert('Hata', 'Silinemedi.'),
  });

  const avgRating = useMemo(() => {
    if (list.length === 0) return '0.0';
    return (list.reduce((sum, s) => sum + s.rating, 0) / list.length).toFixed(1);
  }, [list]);

  function confirmDelete(id: string) {
    Alert.alert('Geri bildirimi sil', 'Bu geri bildirim kalıcı olarak silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Memnuniyet Anketi"
        subtitle={list.length > 0 ? `${list.length} geri bildirim · ort. ${avgRating}` : 'Geri bildirim yok'}
        showBack
      />
      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="star-outline"
            title="Henüz geri bildirim yok"
            description="Randevular tamamlandıkça müşteri değerlendirmeleri burada listelenir."
          />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <Text style={styles.ratingBig}>{item.rating}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.title}>{item.customerName ?? 'Anonim müşteri'}</Text>
                <Stars rating={item.rating} />
                <Text style={styles.meta}>
                  {item.serviceName ? `${item.serviceName} · ` : ''}{formatDate(item.createdAt)}
                </Text>
              </View>
              <Badge variant={item.isApproved ? 'success' : 'default'} size="sm">
                {item.isApproved ? 'Yayında' : 'Gizli'}
              </Badge>
            </View>

            {!!item.comment && <Text style={styles.comment}>“{item.comment}”</Text>}

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => approvalMutation.mutate({ id: item.id, isApproved: !item.isApproved })}
                disabled={approvalMutation.isPending}
              >
                <Ionicons
                  name={item.isApproved ? 'eye-off-outline' : 'checkmark-circle-outline'}
                  size={14}
                  color={COLORS.primaryDark}
                />
                <Text style={styles.actionText}>{item.isApproved ? 'Gizle' : 'Yayınla'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDelete(item.id)}>
                <Ionicons name="trash-outline" size={14} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  list: { paddingHorizontal: SPACE[5], paddingVertical: SPACE[4], paddingBottom: SPACE[10] },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE[3] },
  iconBox: { width: 44, height: 44, borderRadius: RADIUS.lg, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  ratingBig: { fontSize: FONT.lg, fontWeight: FONT.bold, color: COLORS.primaryDark },
  info: { flex: 1, gap: 3 },
  title: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.text },
  starsRow: { flexDirection: 'row', gap: 2 },
  meta: { fontSize: FONT.xs, color: COLORS.textMuted },
  comment: { fontSize: FONT.sm, color: COLORS.text, fontStyle: 'italic', lineHeight: 20 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: SPACE[3] },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.full },
  actionText: { fontSize: FONT.xs, color: COLORS.primaryDark, fontWeight: FONT.bold },
  deleteBtn: { marginLeft: 'auto', padding: 7 },
});
