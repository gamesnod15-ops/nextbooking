import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateTime } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { NotificationItem } from '@/types';

const FILTER_OPTIONS = ['Tümü', 'Okunmamış', 'Randevu', 'Ödeme', 'Sistem'];

const TYPE_ICON: Record<string, any> = { appointment: 'calendar', message: 'chatbubble', payment: 'card', system: 'settings' };
const TYPE_COLOR: Record<string, string> = { appointment: COLORS.info, message: COLORS.success, payment: COLORS.primary, system: COLORS.warning };
const TYPE_BG: Record<string, string> = { appointment: COLORS.infoLight, message: COLORS.successLight, payment: COLORS.primaryLight, system: COLORS.warningLight };

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('Tümü');
  const { data: queryData = [] } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: async () => { const r = await api.get('/notifications'); return Array.isArray(r.data) ? r.data : r.data?.items ?? []; },
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>(queryData);

  const filtered = notifications.filter((n) => {
    if (filter === 'Okunmamış') return !n.isRead;
    if (filter === 'Randevu') return n.type === 'appointment';
    if (filter === 'Ödeme') return n.type === 'payment';
    if (filter === 'Sistem') return n.type === 'system';
    return true;
  });

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Bildirimler" subtitle={unreadCount > 0 ? `${unreadCount} okunmamış` : undefined} showBack
        right={unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllRead}>Tümünü oku</Text>
          </TouchableOpacity>
        ) : undefined}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACE[5], paddingVertical: SPACE[3], gap: SPACE[2], alignItems: 'center' }}>
        {FILTER_OPTIONS.map((f) => (
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
        ListEmptyComponent={<EmptyState icon="notifications-outline" title="Bildirim yok" />}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[2] }} />}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.9} style={[styles.card, !item.isRead && styles.cardUnread]} onPress={() => setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n))}>
            <View style={[styles.iconBox, { backgroundColor: TYPE_BG[item.type] }]}>
              <Ionicons name={TYPE_ICON[item.type]} size={20} color={TYPE_COLOR[item.type]} />
            </View>
            <View style={styles.info}>
              <View style={styles.row}>
                <Text style={[styles.title, !item.isRead && styles.titleUnread]}>{item.title}</Text>
                {!item.isRead && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.time}>{formatDateTime(item.createdAt)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  markAllRead: { fontSize: FONT.sm, color: COLORS.primaryDark, fontWeight: FONT.semibold },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: 'transparent', justifyContent: 'center' },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white },
  list: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[10] },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight },
  cardUnread: { borderColor: COLORS.primary + '40', backgroundColor: COLORS.primaryLight + '60' },
  iconBox: { width: 44, height: 44, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  info: { flex: 1, gap: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE[2] },
  title: { fontSize: FONT.base, fontWeight: FONT.medium, color: COLORS.text, flex: 1 },
  titleUnread: { fontWeight: FONT.bold },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  body: { fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 18 },
  time: { fontSize: FONT.xs, color: COLORS.textMuted },
});

