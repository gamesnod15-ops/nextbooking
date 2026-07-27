import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { DotGrid } from '@/components/ui/DotGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import api from '@/lib/api';
import { getDeviceId } from '@/lib/deviceId';

interface MyReview {
  id: string;
  businessId: string;
  businessName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export default function MyReviewsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: async () => {
      const deviceId = await getDeviceId();
      const res = await api.get(`/reviews/by-device?deviceId=${deviceId}`);
      return Array.isArray(res.data) ? res.data as MyReview[] : [];
    },
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.blobBlue} />
      <DotGrid style={styles.dotGridTopRight} rows={5} cols={4} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Yorumlarım</Text>
          <View style={styles.headerUnderline} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="star-outline"
              title="Henüz yorum yok"
              description="Randevu aldığınız işletmelere yorum bırakın"
            />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.businessName} numberOfLines={1}>{item.businessName}</Text>
              <View style={styles.ratingRow}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Ionicons key={i} name={i < item.rating ? 'star' : 'star-outline'} size={14} color={COLORS.warning} />
                ))}
              </View>
            </View>
            {item.comment && <Text style={styles.comment}>{item.comment}</Text>}
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  blobBlue: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#3B82F6',
    opacity: 0.08,
  },
  dotGridTopRight: {
    position: 'absolute',
    top: 24,
    right: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACE[5], paddingVertical: SPACE[4] },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
  },
  headerTitle: { fontSize: FONT.xl, fontWeight: FONT.extrabold, color: COLORS.text, textAlign: 'center' },
  headerUnderline: { width: 36, height: 4, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, marginTop: 6, alignSelf: 'center' },
  list: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[10], flexGrow: 1 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[2], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[2] },
  businessName: { flex: 1, fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.text },
  ratingRow: { flexDirection: 'row', gap: 2 },
  comment: { fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 19 },
  date: { fontSize: FONT.xs, color: COLORS.textMuted },
});
