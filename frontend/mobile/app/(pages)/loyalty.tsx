import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { PatternOverlay } from '@/components/ui/PatternOverlay';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils';
import type { LoyaltyMember, LoyaltyTier } from '@/types';
import api from '@/lib/api';

// Cosmetic config (emoji/color) keyed by a tier's position, since
// LoyaltyTierDto (GetLoyaltyTiersQuery) only gives a Tailwind color class and a
// web icon name (Star/Zap/Crown/Heart) — not something usable directly as an RN
// color/Ionicons name. The seeded default tiers (LoyaltyTier.CreateDefaults) are
// always Bronz/Gümüş/Altın/Platin in that sort order, so we match by position.
const TIER_VISUALS = [
  { color: '#D97706', bg: '#FEF9C3', icon: '🥉' }, // sortOrder 0 — Bronz
  { color: '#6B7280', bg: '#F3F4F6', icon: '🥈' }, // sortOrder 1 — Gümüş
  { color: '#F59E0B', bg: '#FEF3C7', icon: '🏆' }, // sortOrder 2 — Altın
  { color: '#8B5CF6', bg: '#EDE9FE', icon: '💎' }, // sortOrder 3 — Platin
];
const FALLBACK_VISUAL = { color: '#6B7280', bg: '#F3F4F6', icon: '⭐' };

export default function LoyaltyScreen() {
  const insets = useSafeAreaInsets();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  // GetLoyaltyMembersQuery/GetLoyaltyTiersQuery (LoyaltyController.cs) return a
  // PaginatedList (`{ items: [...] }`), not a bare array.
  const { data: list = [] } = useQuery<LoyaltyMember[]>({
    queryKey: ['loyalty-members'],
    queryFn: async () => { const res = await api.get('/loyalty/members'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
  });
  const { data: tiers = [] } = useQuery<LoyaltyTier[]>({
    queryKey: ['loyalty-tiers'],
    queryFn: async () => { const res = await api.get('/loyalty/tiers'); return Array.isArray(res.data) ? res.data : res.data?.items ?? []; },
  });

  const tierById = useMemo(() => {
    const sorted = [...tiers].sort((a, b) => a.sortOrder - b.sortOrder);
    return new Map(sorted.map((t, idx) => [t.id, { ...t, visual: TIER_VISUALS[idx] ?? FALLBACK_VISUAL }]));
  }, [tiers]);

  const tierCounts = list.reduce((acc, m) => {
    const name = tierById.get(m.tierId)?.name ?? 'Diğer';
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <PatternOverlay opacity={0.25} />
      <ScreenHeader title="Sadakat Programı" showBack />

      {/* Tier Cards */}
      <View style={styles.tierRow}>
        {[...tiers].sort((a, b) => a.sortOrder - b.sortOrder).map((t, idx) => {
          const visual = TIER_VISUALS[idx] ?? FALLBACK_VISUAL;
          return (
            <View key={t.id} style={[styles.tierCard, { borderTopColor: visual.color }]}>
              <Text style={styles.tierEmoji}>{visual.icon}</Text>
              <Text style={styles.tierLabel}>{t.name}</Text>
              <Text style={[styles.tierCount, { color: visual.color }]}>{tierCounts[t.name] ?? 0}</Text>
            </View>
          );
        })}
      </View>

      {/* Members */}
      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Üyeler</Text>}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
        ListEmptyComponent={<EmptyState icon="star-outline" title="Üye yok" />}
        renderItem={({ item }) => {
          const tier = tierById.get(item.tierId);
          const visual = tier?.visual ?? FALLBACK_VISUAL;
          return (
            <View style={styles.card}>
              <Avatar name={item.name} size={46} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.spent}>{formatCurrency(item.totalSpent)} toplam harcama</Text>
              </View>
              <View style={styles.right}>
                <View style={[styles.tierBadge, { backgroundColor: visual.bg }]}>
                  <Text style={{ fontSize: 12 }}>{visual.icon}</Text>
                  <Text style={[styles.tierBadgeText, { color: visual.color }]}>{tier?.name ?? 'Diğer'}</Text>
                </View>
                <View style={styles.pointsRow}>
                  <Ionicons name="star" size={12} color={COLORS.warning} />
                  <Text style={styles.points}>{item.points} puan</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  tierRow: { flexDirection: 'row', gap: SPACE[3], paddingHorizontal: SPACE[5], paddingVertical: SPACE[4] },
  tierCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACE[3], alignItems: 'center', gap: SPACE[1], borderTopWidth: 3, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  tierEmoji: { fontSize: 20 },
  tierLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: FONT.medium },
  tierCount: { fontSize: FONT.xl, fontWeight: FONT.bold },
  sectionTitle: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text, marginBottom: SPACE[3] },
  list: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[10] },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  info: { flex: 1, gap: 3 },
  name: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  spent: { fontSize: FONT.xs, color: COLORS.textMuted },
  right: { alignItems: 'flex-end', gap: SPACE[2] },
  tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  tierBadgeText: { fontSize: 11, fontWeight: FONT.bold },
  pointsRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  points: { fontSize: FONT.xs, fontWeight: FONT.bold, color: '#92400E' },
});
