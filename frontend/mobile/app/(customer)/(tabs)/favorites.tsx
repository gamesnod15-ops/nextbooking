import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { DotGrid } from '@/components/ui/DotGrid';
import api from '@/lib/api';
import { getDeviceId } from '@/lib/deviceId';

interface FavoriteBusiness {
  id: string;
  businessId: string;
  name: string;
  categoryName: string;
  city: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  description: string | null;
  isActive: boolean;
}

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: items = [], refetch, isRefetching, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const deviceId = await getDeviceId();
      const res = await api.get(`/favorites/by-device?deviceId=${deviceId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const removeMutation = useMutation({
    mutationFn: async (businessId: string) => {
      const deviceId = await getDeviceId();
      await api.delete(`/favorites/by-device/${businessId}?deviceId=${deviceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.blobBlue} />
      <DotGrid style={styles.dotGridTopRight} rows={5} cols={4} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Favorilerim</Text>
          <View style={styles.headerUnderline} />
        </View>
        <Text style={styles.headerSub}>{items.length} salon</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(i: FavoriteBusiness) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="heart-outline"
              title="Henüz favori yok"
              description="Beğendiğiniz işletmeleri favorilere ekleyin"
              action={
                <TouchableOpacity onPress={() => router.push('/(customer)/(tabs)')}>
                  <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Keşfet</Text>
                </TouchableOpacity>
              }
            />
          ) : null
        }
        renderItem={({ item }: { item: FavoriteBusiness }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => router.push(`/(customer)/business/${item.businessId}`)}
          >
            {item.coverImageUrl || item.logoUrl ? (
              <Avatar name={item.name} size={56} url={item.coverImageUrl || item.logoUrl || undefined} />
            ) : (
              <Avatar name={item.name} size={56} />
            )}
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <View style={styles.metaRow}>
                <Badge variant="default" size="sm">{item.categoryName}</Badge>
                {item.city && (
                  <View style={styles.cityRow}>
                    <Ionicons name="location-outline" size={11} color={COLORS.textMuted} />
                    <Text style={styles.dist}>{item.city}</Text>
                  </View>
                )}
              </View>
              {!item.isActive && (
                <Badge variant="default" size="sm">Pasif</Badge>
              )}
            </View>
            <TouchableOpacity
              style={styles.heartBtn}
              onPress={() => removeMutation.mutate(item.businessId)}
              disabled={removeMutation.isPending}
            >
              <Ionicons name="heart" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: SPACE[5], paddingVertical: SPACE[4] },
  headerTitle: { fontSize: FONT['2xl'], fontWeight: FONT.extrabold, color: COLORS.text },
  headerUnderline: { width: 44, height: 4, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, marginTop: 6 },
  headerSub: { fontSize: FONT.sm, color: COLORS.textMuted },
  list: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[10], flexGrow: 1 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  info: { flex: 1, gap: 6 },
  name: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2], flexWrap: 'wrap' },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  dist: { fontSize: FONT.xs, color: COLORS.textMuted },
  heartBtn: { padding: 4 },
});
