import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateTime } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { NotificationItem } from '@/types';

// There is no NotificationsController on the backend yet — GET /notifications
// currently 404s and this list is always empty. Read-state is persisted
// locally only so that, once a real endpoint exists, "read" markers survive
// an app restart the same way the notification-preference toggles in
// settings.tsx do; it is not enforced by any backend read-tracking today.
const READ_IDS_KEY = 'business_notifications_read_ids';

const FILTER_OPTIONS = ['Tümü', 'Okunmamış', 'Randevu', 'Ödeme', 'Sistem'];

const TYPE_ICON: Record<string, any> = { appointment: 'calendar', message: 'chatbubble', payment: 'card', system: 'settings' };
const getTypeColor = (COLORS: Palette): Record<string, string> => ({ appointment: COLORS.info, message: COLORS.success, payment: COLORS.primary, system: COLORS.warning });
const getTypeBg = (COLORS: Palette): Record<string, string> => ({ appointment: COLORS.infoLight, message: COLORS.successLight, payment: COLORS.primaryLight, system: COLORS.warningLight });

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const TYPE_COLOR = useMemo(() => getTypeColor(COLORS), [COLORS]);
  const TYPE_BG = useMemo(() => getTypeBg(COLORS), [COLORS]);
  const [filter, setFilter] = useState('Tümü');
  const { data: queryData = [] } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: async () => { const r = await api.get('/notifications'); return Array.isArray(r.data) ? r.data : r.data?.items ?? []; },
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>(queryData);
  const [readIds, setReadIds] = useState<string[]>([]);

  // Seed local state from the query result whenever it (re)resolves — using
  // useState(queryData) alone only captures the value present at first
  // render, before the async fetch has completed.
  useEffect(() => {
    setNotifications((prev) => {
      const merged = queryData.map((n) => readIds.includes(n.id) ? { ...n, isRead: true } : n);
      return merged;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryData]);

  useEffect(() => {
    SecureStore.getItemAsync(READ_IDS_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved: string[] = JSON.parse(raw);
        setReadIds(saved);
        setNotifications(prev => prev.map(n => saved.includes(n.id) ? { ...n, isRead: true } : n));
      })
      .catch(() => {});
  }, []);

  function persistReadIds(ids: string[]) {
    setReadIds(ids);
    SecureStore.setItemAsync(READ_IDS_KEY, JSON.stringify(ids)).catch(() => {});
  }

  const filtered = notifications.filter((n) => {
    if (filter === 'Okunmamış') return !n.isRead;
    if (filter === 'Randevu') return n.type === 'appointment';
    if (filter === 'Ödeme') return n.type === 'payment';
    if (filter === 'Sistem') return n.type === 'system';
    return true;
  });

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    persistReadIds(Array.from(new Set([...readIds, ...notifications.map(n => n.id)])));
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
          <TouchableOpacity activeOpacity={0.9} style={[styles.card, !item.isRead && styles.cardUnread]} onPress={() => {
            setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
            if (!readIds.includes(item.id)) persistReadIds([...readIds, item.id]);
          }}>
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

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  markAllRead: { fontSize: FONT.sm, color: COLORS.primaryDark, fontWeight: FONT.semibold },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: 'transparent', justifyContent: 'center' },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  chipTextActive: { color: STATIC_WHITE },
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

