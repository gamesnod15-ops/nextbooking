import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import api from '@/lib/api';

const MOCK_FAVORITES = [
  { id: '1', name: 'Elit Güzellik Salonu', category: 'Güzellik', rating: 4.9, reviewCount: 248, distance: '0.4 km', isOpen: true, nextSlot: 'Bugün 15:30' },
  { id: '2', name: 'Saç & Stil Atölyesi', category: 'Kuaför', rating: 4.6, reviewCount: 304, distance: '1.5 km', isOpen: true, nextSlot: 'Bugün 17:00' },
  { id: '3', name: 'Nail Studio Pro', category: 'Tırnak', rating: 4.8, reviewCount: 97, distance: '1.2 km', isOpen: false, nextSlot: 'Yarın 10:00' },
];

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { data: items = MOCK_FAVORITES, refetch, isRefetching } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => { const res = await api.get('/favorites'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
    placeholderData: MOCK_FAVORITES,
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorilerim</Text>
        <Text style={styles.headerSub}>{items.length} salon</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
        ListEmptyComponent={<EmptyState icon="heart-outline" title="Henüz favori yok" description="Beğendiğiniz salonları favorilere ekleyin" action={<TouchableOpacity><Text style={{ color: COLORS.primary, fontWeight: '600' }}>Keşfet</Text></TouchableOpacity>} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Avatar name={item.name} size={56} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="star" size={13} color={COLORS.warning} />
                <Text style={styles.rating}>{item.rating}</Text>
                <Text style={styles.reviews}>({item.reviewCount})</Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.dist}>{item.distance}</Text>
              </View>
              <View style={styles.bottomRow}>
                <Badge variant={item.isOpen ? 'success' : 'default'} size="sm">{item.isOpen ? 'Açık' : 'Kapalı'}</Badge>
                <TouchableOpacity style={styles.bookBtn}>
                  <Ionicons name="calendar" size={14} color={COLORS.black} />
                  <Text style={styles.bookBtnText}>{item.nextSlot}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.heartBtn}>
              <Ionicons name="heart" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACE[5], paddingVertical: SPACE[4] },
  headerTitle: { fontSize: FONT['2xl'], fontWeight: FONT.extrabold, color: COLORS.text },
  headerSub: { fontSize: FONT.sm, color: COLORS.textMuted, marginTop: 4 },
  list: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[10] },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  info: { flex: 1, gap: 6 },
  name: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  reviews: { fontSize: FONT.xs, color: COLORS.textMuted },
  dot: { color: COLORS.textMuted },
  dist: { fontSize: FONT.xs, color: COLORS.textMuted },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bookBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, ...SHADOW.primary },
  bookBtnText: { fontSize: FONT.xs, fontWeight: FONT.bold, color: COLORS.black },
  heartBtn: { padding: 4 },
});

