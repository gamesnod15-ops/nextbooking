import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { addDays, startOfWeek, format, isSameDay, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';
import type { Appointment } from '@/types';

const { width } = Dimensions.get('window');
const HOUR_HEIGHT = 60;

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 – 20:00

function getEventTop(startIso: string) {
  const d = parseISO(startIso);
  const minutesFromStart = (d.getHours() - 8) * 60 + d.getMinutes();
  return (minutesFromStart / 60) * HOUR_HEIGHT;
}

function getEventHeight(startIso: string, endIso: string) {
  const s = parseISO(startIso);
  const e = parseISO(endIso);
  const mins = (e.getTime() - s.getTime()) / 60000;
  return Math.max((mins / 60) * HOUR_HEIGHT, 30);
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const { data: events, refetch, isRefetching } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const res = await api.get('/appointments');
      const items = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
      return items.map((a: Appointment) => ({
        id: a.id, title: `${a.customerName ?? 'İsimsiz'} – ${a.serviceName ?? 'Hizmet'}`, start: a.startTime, end: a.endTime, status: a.status, employee: a.employeeName ?? '', color: a.status === 'confirmed' ? COLORS.successLight : a.status === 'pending' ? COLORS.warningLight : COLORS.infoLight,
      }));
    },
  });

  const dayEvents = (events ?? []).filter((e: { start: string }) =>
    isSameDay(parseISO(e.start), selectedDate)
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Takvim</Text>
          <Text style={styles.subtitle}>{format(selectedDate, 'MMMM yyyy', { locale: tr })}</Text>
        </View>
        <TouchableOpacity style={styles.todayBtn} onPress={() => setSelectedDate(today)} activeOpacity={0.8}>
          <Text style={styles.todayBtnText}>Bugün</Text>
        </TouchableOpacity>
      </View>

      {/* Week Strip */}
      <View style={styles.weekStrip}>
        {weekDays.map((d) => {
          const isSelected = isSameDay(d, selectedDate);
          const isToday = isSameDay(d, today);
          const hasEvents = (events ?? []).some((e: { start: string }) => isSameDay(parseISO(e.start), d));
          return (
            <TouchableOpacity
              key={d.toISOString()}
              style={[styles.dayCol, isSelected && styles.dayColSelected]}
              onPress={() => setSelectedDate(d)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                {format(d, 'EEE', { locale: tr }).slice(0, 3)}
              </Text>
              <View style={[styles.dayNum, isSelected && styles.dayNumSelected, isToday && !isSelected && styles.dayNumToday]}>
                <Text style={[styles.dayNumText, isSelected && styles.dayNumTextSelected, isToday && !isSelected && styles.dayNumTextToday]}>
                  {format(d, 'd')}
                </Text>
              </View>
              {hasEvents && <View style={[styles.eventDot, isSelected && styles.eventDotSelected]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Timeline */}
      <ScrollView style={styles.timeline} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}>
        <View style={styles.timelineInner}>
          {/* Hour lines */}
          {HOURS.map((h) => (
            <View key={h} style={[styles.hourRow, { top: (h - 8) * HOUR_HEIGHT }]}>
              <Text style={styles.hourLabel}>{h.toString().padStart(2, '0')}:00</Text>
              <View style={styles.hourLine} />
            </View>
          ))}

          {/* Events */}
          {dayEvents.map((ev: { id: string; start: string; end: string; title: string; employee: string; color: string; status: string }) => {
            const top = getEventTop(ev.start);
            const height = getEventHeight(ev.start, ev.end);
            return (
              <View
                key={ev.id}
                style={[
                  styles.event,
                  {
                    top,
                    height,
                    backgroundColor: ev.color,
                    borderLeftColor: ev.status === 'confirmed' ? COLORS.success :
                      ev.status === 'pending' ? COLORS.warning : COLORS.info,
                  },
                ]}
              >
                <Text style={styles.eventTitle} numberOfLines={1}>{ev.title}</Text>
                <Text style={styles.eventEmployee} numberOfLines={1}>{ev.employee}</Text>
                <Text style={styles.eventTime}>
                  {format(parseISO(ev.start), 'HH:mm')} – {format(parseISO(ev.end), 'HH:mm')}
                </Text>
              </View>
            );
          })}

          {/* Current time line */}
          {isSameDay(selectedDate, today) && (
            <View
              style={[
                styles.nowLine,
                {
                  top: ((today.getHours() - 8) * 60 + today.getMinutes()) / 60 * HOUR_HEIGHT,
                },
              ]}
            >
              <View style={styles.nowDot} />
            </View>
          )}
        </View>
      </ScrollView>

      {dayEvents.length === 0 && (
        <View style={styles.noEvents}>
          <Ionicons name="calendar-outline" size={36} color={COLORS.textMuted} />
          <Text style={styles.noEventsText}>Bu gün randevu yok</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE[5],
    paddingVertical: SPACE[4],
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: { fontSize: FONT.xl, fontWeight: FONT.extrabold, color: COLORS.text },
  subtitle: { fontSize: FONT.xs, color: COLORS.textMuted, marginTop: 2 },
  todayBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  todayBtnText: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.primaryDark },

  weekStrip: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACE[3],
    paddingBottom: SPACE[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACE[2],
    borderRadius: RADIUS.lg,
  },
  dayColSelected: {},
  dayName: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: FONT.semibold,
    textTransform: 'uppercase',
  },
  dayNameSelected: { color: COLORS.primaryDark },
  dayNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumSelected: {
    backgroundColor: COLORS.primary,
  },
  dayNumToday: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  dayNumText: {
    fontSize: FONT.sm,
    fontWeight: FONT.semibold,
    color: COLORS.textSecondary,
  },
  dayNumTextSelected: { color: COLORS.white, fontWeight: FONT.bold },
  dayNumTextToday: { color: COLORS.primaryDark, fontWeight: FONT.bold },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.textMuted,
  },
  eventDotSelected: { backgroundColor: COLORS.primaryDark },

  timeline: { flex: 1 },
  timelineInner: {
    marginLeft: 60,
    position: 'relative',
    height: HOURS.length * HOUR_HEIGHT + 40,
  },
  hourRow: {
    position: 'absolute',
    left: -60,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hourLabel: {
    width: 52,
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: FONT.medium,
    textAlign: 'right',
    paddingRight: 8,
  },
  hourLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  event: {
    position: 'absolute',
    left: SPACE[2],
    right: SPACE[4],
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    padding: SPACE[2],
    gap: 2,
  },
  eventTitle: {
    fontSize: FONT.xs,
    fontWeight: FONT.bold,
    color: COLORS.text,
  },
  eventEmployee: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  eventTime: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: FONT.medium,
  },
  nowLine: {
    position: 'absolute',
    left: 0,
    right: SPACE[4],
    height: 2,
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
    marginLeft: -4,
  },
  noEvents: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: SPACE[2],
  },
  noEventsText: {
    fontSize: FONT.sm,
    color: COLORS.textMuted,
    fontWeight: FONT.medium,
  },
});

