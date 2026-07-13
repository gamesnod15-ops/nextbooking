import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils';
import type { LoyaltyMember } from '@/types';
import api from '@/lib/api';

const TIER_CONFIG = {
  platinum: { label: 'Platin', color: '#8B5CF6', bg: '#EDE9FE', icon: '💎' },
  gold:     { label: 'Altın',  color: '#F59E0B', bg: '#FEF3C7', icon: '🏆' },
  silver:   { label: 'Gümüş', color: '#6B7280', bg: '#F3F4F6', icon: '🥈' },
  bronze:   { label: 'Bronz', color: '#D97706', bg: '#FEF9C3', icon: '🥉' },
};

const TIER_THRESHOLDS = [
  { tier: 'bronze', label: 'Bronz', min: 0, max: 100, color: '#D97706' },
  { tier: 'silver', label: 'Gümüş', min: 100, max: 250, color: '#6B7280' },
  { tier: 'gold', label: 'Altın', min: 250, max: 500, color: '#F59E0B' },
  { tier: 'platinum', label: 'Platin', min: 500, max: Infinity, color: '#8B5CF6' },
];

export default function LoyaltyScreen() {
  const insets = useSafeAreaInsets();
  const { data: list = [] } = useQuery<LoyaltyMember[]>({
    queryKey: ['loyalty-members'],
    queryFn: async () => { const res = await api.get('/loyalty/members'); return Array.isArray(res.data) ? res.data : []; },
  });
  const tierCounts = list.reduce((acc, m) => { acc[m.tier] = (acc[m.tier] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Sadakat Programı" showBack />

      {/* Tier Cards */}
      <View style={styles.tierRow}>
        {(Object.entries(TIER_CONFIG) as [keyof typeof TIER_CONFIG, typeof TIER_CONFIG[keyof typeof TIER_CONFIG]][]).map(([tier, cfg]) => (
          <View key={tier} style={[styles.tierCard, { borderTopColor: cfg.color }]}>
            <Text style={styles.tierEmoji}>{cfg.icon}</Text>
            <Text style={styles.tierLabel}>{cfg.label}</Text>
            <Text style={[styles.tierCount, { color: cfg.color }]}>{tierCounts[tier] ?? 0}</Text>
          </View>
        ))}
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
          const cfg = TIER_CONFIG[item.tier];
          return (
            <View style={styles.card}>
              <Avatar name={item.customerName} size={46} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.customerName}</Text>
                <Text style={styles.spent}>{formatCurrency(item.totalSpent)} toplam harcama</Text>
              </View>
              <View style={styles.right}>
                <View style={[styles.tierBadge, { backgroundColor: cfg.bg }]}>
                  <Text style={{ fontSize: 12 }}>{cfg.icon}</Text>
                  <Text style={[styles.tierBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
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

const styles = StyleSheet.create({
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

