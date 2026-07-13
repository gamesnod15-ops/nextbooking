import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateTime } from '@/lib/utils';
import api from '@/lib/api';
import type { RootState } from '@/store';
import type { Review } from '@/types';

export default function ReviewsScreen() {
  const insets = useSafeAreaInsets();
  const businessId = useSelector((s: RootState) => s.business.business?.id);

  const { data: reviews = [], refetch, isRefetching } = useQuery({
    queryKey: ['reviews', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const res = await api.get(`/reviews/${businessId}`);
      return Array.isArray(res.data) ? res.data : res.data?.items ?? [];
    },
    enabled: !!businessId,
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Değerlendirmeler" subtitle={`${reviews.length} yorum`} showBack />
      <FlatList
        data={reviews}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
        ListEmptyComponent={<EmptyState icon="star-outline" title="Henüz yorum yok" description="Müşterileriniz değerlendirme yapınca burada görünecek" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.topRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{item.authorName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.meta}>
                <Text style={styles.author}>{item.authorName}</Text>
                <Text style={styles.date}>{formatDateTime(item.createdAt)}</Text>
              </View>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={13} color={COLORS.warning} />
                <Text style={styles.ratingText}>{item.rating}</Text>
              </View>
            </View>
            {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  list: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[10] },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACE[4],
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW.sm,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.primaryDark },
  meta: { flex: 1, gap: 2 },
  author: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.text },
  date: { fontSize: FONT.xs, color: COLORS.textMuted },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  ratingText: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.warning },
  comment: { fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 20, marginTop: SPACE[3] },
});
