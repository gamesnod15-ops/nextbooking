import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Modal, TextInput, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addDays, addWeeks, startOfWeek, startOfMonth,
  format, isSameDay, isSameMonth, isToday as isTodayFn,
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { PatternOverlay } from '@/components/ui/PatternOverlay';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MenuButton } from '@/components/DrawerMenu';
import api from '@/lib/api';
import { appointmentLocalDate, formatAppointmentTime, formatAppointmentDate, formatCurrency } from '@/lib/utils';
import type { Appointment, Employee, Service } from '@/types';
import { useToast } from '@/components/ui/Toast';

const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 – 20:00
const TIME_SLOTS = HOURS.flatMap((h) => [`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`]);
const MONTH_NAMES = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

const STATUS_FILTERS = ['Beklemede', 'Onaylandı', 'Tamamlandı', 'İptal'];
const STATUS_KEYS: Record<string, string> = {
  'Beklemede': 'pending', 'Onaylandı': 'confirmed', 'Tamamlandı': 'completed', 'İptal': 'cancelled',
};
const getStatusMap = (COLORS: Palette): Record<string, { label: string; variant: any; bg: string; bar: string }> => ({
  pending:   { label: 'Beklemede', variant: 'pending', bg: COLORS.warningLight, bar: COLORS.warning },
  confirmed: { label: 'Onaylandı', variant: 'confirmed', bg: COLORS.infoLight, bar: COLORS.info },
  cancelled: { label: 'İptal', variant: 'cancelled', bg: COLORS.errorLight, bar: COLORS.error },
  completed: { label: 'Tamamlandı', variant: 'completed', bg: COLORS.successLight, bar: COLORS.success },
  no_show:   { label: 'Gelmedi', variant: 'no_show', bg: COLORS.surfaceAlt, bar: COLORS.textMuted },
});

function getEventTop(startIso: string) {
  const d = appointmentLocalDate(startIso);
  const minutesFromStart = (d.getHours() - 8) * 60 + d.getMinutes();
  return (minutesFromStart / 60) * HOUR_HEIGHT;
}

function getEventHeight(startIso: string, endIso: string) {
  const s = appointmentLocalDate(startIso);
  const e = appointmentLocalDate(endIso);
  const mins = (e.getTime() - s.getTime()) / 60000;
  return Math.max((mins / 60) * HOUR_HEIGHT, 34);
}

function useAppointments() {
  return useQuery<Appointment[]>({
    queryKey: ['appointments'],
    queryFn: async () => {
      const res = await api.get('/appointments');
      return (Array.isArray(res.data) ? res.data : res.data?.items ?? res.data?.data ?? []) as Appointment[];
    },
    staleTime: 1000 * 30,
  });
}

function useEmployees() {
  return useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/employees');
      return Array.isArray(res.data) ? res.data : res.data?.items ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

function useServices() {
  return useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await api.get('/services');
      return Array.isArray(res.data) ? res.data : res.data?.items ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Detail sheet (view + confirm/complete/cancel) ──────────────────────────
function DetailSheet({ apt, visible, onClose, onAction }: {
  apt: Appointment | null;
  visible: boolean;
  onClose: () => void;
  onAction: (action: 'confirm' | 'complete' | 'cancel', id: string) => void;
}) {
  const COLORS = useColors();
  const sheet = useMemo(() => createSheetStyles(COLORS), [COLORS]);
  const statusMap = useMemo(() => getStatusMap(COLORS), [COLORS]);
  if (!apt) return null;
  const s = statusMap[apt.status];
  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={sheet.overlay}>
        <View style={sheet.sheet}>
          <View style={sheet.handle} />
          <View style={sheet.header}>
            <Text style={sheet.title}>Randevu Detayı</Text>
            <TouchableOpacity onPress={onClose} style={sheet.closeBtn} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Kapat">
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACE[5], gap: SPACE[4] }}>
            <Badge variant={s?.variant}>{s?.label}</Badge>
            {[
              { label: 'Müşteri', value: apt.customerName, icon: 'person-outline' },
              { label: 'Telefon', value: apt.customerPhone, icon: 'call-outline' },
              ...(apt.customerEmail ? [{ label: 'E-posta', value: apt.customerEmail, icon: 'mail-outline' }] : []),
              { label: 'Hizmet', value: `${apt.serviceName} (${apt.serviceDurationMinutes} dk)`, icon: 'cut-outline' },
              { label: 'Personel', value: apt.employeeName, icon: 'person-circle-outline' },
              { label: 'Tarih', value: formatAppointmentDate(apt.startTime), icon: 'calendar-outline' },
              { label: 'Saat', value: `${formatAppointmentTime(apt.startTime)} – ${formatAppointmentTime(apt.endTime)}`, icon: 'time-outline' },
              { label: 'Ücret', value: formatCurrency(apt.price), icon: 'cash-outline' },
              ...(apt.notes ? [{ label: 'Not', value: apt.notes, icon: 'document-text-outline' }] : []),
            ].map((row) => (
              <View key={row.label} style={sheet.row}>
                <View style={sheet.rowIcon}>
                  <Ionicons name={row.icon as any} size={16} color={COLORS.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={sheet.rowLabel}>{row.label}</Text>
                  <Text style={sheet.rowValue}>{row.value}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={sheet.actions}>
            {apt.status === 'pending' && (
              <Button variant="primary" style={{ flex: 1 }} onPress={() => { onAction('confirm', apt.id); onClose(); }}>Onayla</Button>
            )}
            {apt.status === 'confirmed' && (
              <Button variant="primary" style={{ flex: 1 }} onPress={() => { onAction('complete', apt.id); onClose(); }}>Tamamla</Button>
            )}
            {(apt.status === 'pending' || apt.status === 'confirmed') && (
              <Button variant="destructive" onPress={() => { onAction('cancel', apt.id); onClose(); }}>İptal</Button>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Create appointment modal ────────────────────────────────────────────────
function CreateModal({ visible, onClose, date, employees, services }: {
  visible: boolean; onClose: () => void; date: Date; employees: Employee[]; services: Service[];
}) {
  const COLORS = useColors();
  const sheet = useMemo(() => createSheetStyles(COLORS), [COLORS]);
  const form = useMemo(() => createFormStyles(COLORS), [COLORS]);
  const toast = useToast();
  const qc = useQueryClient();
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [time, setTime] = useState('09:00');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      if (!serviceId) throw new Error('Hizmet seçin');
      return api.post('/appointments', {
        serviceId,
        employeeId: employeeId || undefined,
        date: format(date, 'yyyy-MM-dd'),
        time,
        firstName,
        lastName,
        phone,
        email: email || 'musteri@example.com',
        source: 'business',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      reset();
      onClose();
      toast.success('Randevu oluşturuldu.');
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || 'Randevu oluşturulamadı. Bilgileri kontrol edin.');
    },
  });

  function reset() {
    setServiceId(null); setEmployeeId(null); setTime('09:00');
    setFirstName(''); setLastName(''); setPhone(''); setEmail('');
  }

  function handleClose() { reset(); onClose(); }

  const canSubmit = !!serviceId && firstName.trim() && lastName.trim() && phone.trim();

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={sheet.overlay}>
        <View style={sheet.sheet}>
          <View style={sheet.handle} />
          <View style={sheet.header}>
            <Text style={sheet.title}>Yeni Randevu · {format(date, 'd MMMM', { locale: tr })}</Text>
            <TouchableOpacity onPress={handleClose} style={sheet.closeBtn} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Kapat">
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACE[5], gap: SPACE[4] }}>
            <View style={{ gap: SPACE[2] }}>
              <Text style={form.label}>Hizmet</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: SPACE[2] }}>
                {services.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[form.chip, serviceId === s.id && form.chipActive]}
                    onPress={() => setServiceId(s.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[form.chipText, serviceId === s.id && form.chipTextActive]}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ gap: SPACE[2] }}>
              <Text style={form.label}>Personel (opsiyonel)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: SPACE[2] }}>
                <TouchableOpacity
                  style={[form.chip, employeeId === null && form.chipActive]}
                  onPress={() => setEmployeeId(null)}
                  activeOpacity={0.8}
                >
                  <Text style={[form.chipText, employeeId === null && form.chipTextActive]}>Otomatik</Text>
                </TouchableOpacity>
                {employees.map((e) => (
                  <TouchableOpacity
                    key={e.id}
                    style={[form.chip, employeeId === e.id && form.chipActive]}
                    onPress={() => setEmployeeId(e.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[form.chipText, employeeId === e.id && form.chipTextActive]}>{e.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ gap: SPACE[2] }}>
              <Text style={form.label}>Saat</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: SPACE[2] }}>
                {TIME_SLOTS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[form.chip, time === t && form.chipActive]}
                    onPress={() => setTime(t)}
                    activeOpacity={0.8}
                  >
                    <Text style={[form.chipText, time === t && form.chipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ flexDirection: 'row', gap: SPACE[3] }}>
              <View style={{ flex: 1, gap: SPACE[1] }}>
                <Text style={form.label}>Ad</Text>
                <TextInput style={form.input} value={firstName} onChangeText={setFirstName} placeholder="Ad" placeholderTextColor={COLORS.textMuted} />
              </View>
              <View style={{ flex: 1, gap: SPACE[1] }}>
                <Text style={form.label}>Soyad</Text>
                <TextInput style={form.input} value={lastName} onChangeText={setLastName} placeholder="Soyad" placeholderTextColor={COLORS.textMuted} />
              </View>
            </View>
            <View style={{ gap: SPACE[1] }}>
              <Text style={form.label}>Telefon</Text>
              <TextInput style={form.input} value={phone} onChangeText={setPhone} placeholder="05XX XXX XX XX" keyboardType="phone-pad" placeholderTextColor={COLORS.textMuted} />
            </View>
            <View style={{ gap: SPACE[1] }}>
              <Text style={form.label}>E-posta (opsiyonel)</Text>
              <TextInput style={form.input} value={email} onChangeText={setEmail} placeholder="ornek@eposta.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={COLORS.textMuted} />
            </View>
          </ScrollView>
          <View style={sheet.actions}>
            <Button variant="outline" style={{ flex: 1 }} onPress={handleClose} disabled={mutation.isPending}>Vazgeç</Button>
            <Button variant="primary" style={{ flex: 1 }} onPress={() => mutation.mutate()} disabled={!canSubmit} loading={mutation.isPending}>Oluştur</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Filter modal ────────────────────────────────────────────────────────────
function FilterModal({ visible, onClose, employees, statusFilters, setStatusFilters, employeeFilters, setEmployeeFilters }: {
  visible: boolean; onClose: () => void; employees: Employee[];
  statusFilters: string[]; setStatusFilters: (v: string[]) => void;
  employeeFilters: string[]; setEmployeeFilters: (v: string[]) => void;
}) {
  const COLORS = useColors();
  const sheet = useMemo(() => createSheetStyles(COLORS), [COLORS]);
  const form = useMemo(() => createFormStyles(COLORS), [COLORS]);
  function toggleStatus(s: string) {
    setStatusFilters(statusFilters.includes(s) ? statusFilters.filter((x) => x !== s) : [...statusFilters, s]);
  }
  function toggleEmployee(id: string) {
    setEmployeeFilters(employeeFilters.includes(id) ? employeeFilters.filter((x) => x !== id) : [...employeeFilters, id]);
  }
  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={sheet.overlay}>
        <View style={[sheet.sheet, { height: '60%' }]}>
          <View style={sheet.handle} />
          <View style={sheet.header}>
            <Text style={sheet.title}>Filtrele</Text>
            <TouchableOpacity onPress={onClose} style={sheet.closeBtn} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Kapat">
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACE[5], gap: SPACE[4] }}>
            <View style={{ gap: SPACE[2] }}>
              <Text style={form.label}>Durum</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[2] }}>
                {STATUS_FILTERS.map((s) => (
                  <TouchableOpacity key={s} style={[form.chip, statusFilters.includes(s) && form.chipActive]} onPress={() => toggleStatus(s)} activeOpacity={0.8}>
                    <Text style={[form.chipText, statusFilters.includes(s) && form.chipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ gap: SPACE[2] }}>
              <Text style={form.label}>Personel</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[2] }}>
                {employees.map((e) => (
                  <TouchableOpacity key={e.id} style={[form.chip, employeeFilters.includes(e.id) && form.chipActive]} onPress={() => toggleEmployee(e.id)} activeOpacity={0.8}>
                    <Text style={[form.chipText, employeeFilters.includes(e.id) && form.chipTextActive]}>{e.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          <View style={sheet.actions}>
            <Button variant="outline" style={{ flex: 1 }} onPress={() => { setStatusFilters([]); setEmployeeFilters([]); }}>Temizle</Button>
            <Button variant="primary" style={{ flex: 1 }} onPress={onClose}>Uygula</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Month/year picker modal ─────────────────────────────────────────────────
function MonthPickerModal({ visible, onClose, cursor, onSelect }: {
  visible: boolean; onClose: () => void; cursor: Date; onSelect: (d: Date) => void;
}) {
  const COLORS = useColors();
  const picker = useMemo(() => createPickerStyles(COLORS), [COLORS]);
  const [year, setYear] = useState(cursor.getFullYear());
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <TouchableOpacity style={picker.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={picker.card} onPress={() => {}}>
          <View style={picker.yearRow}>
            <TouchableOpacity onPress={() => setYear(year - 1)} style={picker.yearBtn} accessibilityRole="button" accessibilityLabel="Önceki yıl">
              <Ionicons name="chevron-back" size={18} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={picker.yearText}>{year}</Text>
            <TouchableOpacity onPress={() => setYear(year + 1)} style={picker.yearBtn} accessibilityRole="button" accessibilityLabel="Sonraki yıl">
              <Ionicons name="chevron-forward" size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <View style={picker.grid}>
            {MONTH_NAMES.map((m, idx) => {
              const active = idx === cursor.getMonth() && year === cursor.getFullYear();
              return (
                <TouchableOpacity
                  key={m}
                  style={[picker.monthBtn, active && picker.monthBtnActive]}
                  onPress={() => { onSelect(new Date(year, idx, 1)); onClose(); }}
                  activeOpacity={0.8}
                >
                  <Text style={[picker.monthText, active && picker.monthTextActive]}>{m.slice(0, 3)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const eventCard = useMemo(() => createEventCardStyles(COLORS), [COLORS]);
  const statusMap = useMemo(() => getStatusMap(COLORS), [COLORS]);
  const toast = useToast();
  const today = new Date();
  const qc = useQueryClient();

  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekAnchor, setWeekAnchor] = useState(today);
  const [monthCursor, setMonthCursor] = useState(today);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [employeeFilters, setEmployeeFilters] = useState<string[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: events = [], refetch, isRefetching } = useAppointments();
  const { data: employees = [] } = useEmployees();
  const { data: services = [] } = useServices();

  const mutation = useMutation({
    mutationFn: ({ action, id }: { action: string; id: string }) => {
      if (action === 'confirm') return api.post(`/appointments/${id}/confirm`);
      if (action === 'complete') return api.post(`/appointments/${id}/complete`);
      return api.post(`/appointments/${id}/cancel`, { reason: 'İşletme tarafından iptal edildi.' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'İşlem gerçekleştirilemedi.'),
  });

  const activeFilterCount = statusFilters.length + employeeFilters.length;

  const filteredEvents = useMemo(() => events.filter((e) => {
    const matchSearch = !search ||
      e.customerName.toLowerCase().includes(search.toLowerCase()) ||
      e.serviceName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilters.length === 0 || statusFilters.some((f) => STATUS_KEYS[f] === e.status);
    const matchEmployee = employeeFilters.length === 0 || (e.employeeId && employeeFilters.includes(e.employeeId));
    return matchSearch && matchStatus && matchEmployee;
  }), [events, search, statusFilters, employeeFilters]);

  const weekStart = startOfWeek(weekAnchor, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function selectDay(d: Date) {
    setSelectedDate(d);
    setWeekAnchor(d);
    setMonthCursor(d);
    if (viewMode === 'month') setViewMode('day');
  }

  function goToday() {
    setSelectedDate(today);
    setWeekAnchor(today);
    setMonthCursor(today);
  }

  function callCustomer(phone: string) {
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch(() => toast.error('Arama başlatılamadı.'));
  }

  function renderEventCard(ev: Appointment, compact = false) {
    const s = statusMap[ev.status] ?? statusMap.pending;
    return (
      <TouchableOpacity
        key={ev.id}
        style={[eventCard.row, { backgroundColor: s.bg, borderLeftColor: s.bar }]}
        activeOpacity={0.85}
        onPress={() => setSelectedAppt(ev)}
      >
        <View style={eventCard.timeCol}>
          <Text style={eventCard.timeText}>{formatAppointmentTime(ev.startTime)}</Text>
          <Text style={eventCard.timeTextMuted}>{formatAppointmentTime(ev.endTime)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={eventCard.name} numberOfLines={1}>{ev.customerName}</Text>
          <Text style={eventCard.service} numberOfLines={1}>{ev.serviceName}</Text>
          <View style={eventCard.empRow}>
            <Ionicons name="person-outline" size={11} color={COLORS.textMuted} />
            <Text style={eventCard.empText} numberOfLines={1}>{ev.employeeName}</Text>
          </View>
        </View>
        {!compact && (
          <View style={eventCard.actions}>
            <TouchableOpacity style={[eventCard.callBtn, { backgroundColor: s.bar + '22' }]} onPress={() => callCustomer(ev.customerPhone)} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Müşteriyi ara">
              <Ionicons name="call" size={16} color={s.bar} />
            </TouchableOpacity>
            <TouchableOpacity style={eventCard.kebabBtn} onPress={() => setSelectedAppt(ev)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Diğer işlemler">
              <Ionicons name="ellipsis-vertical" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  const dayEvents = filteredEvents.filter((e) => isSameDay(appointmentLocalDate(e.startTime), selectedDate));

  const monthGridStart = startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 1 });
  const monthGridDays = Array.from({ length: 42 }, (_, i) => addDays(monthGridStart, i));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <PatternOverlay opacity={0.25} />
      {/* Header */}
      <View style={styles.header}>
        <MenuButton showBadge={false} />
        <TouchableOpacity style={{ flex: 1, marginLeft: SPACE[3] }} onPress={() => setMonthPickerOpen(true)} activeOpacity={0.7}>
          <Text style={styles.title}>Takvim</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Text style={styles.subtitle}>{format(monthCursor, 'MMMM yyyy', { locale: tr })}</Text>
            <Ionicons name="chevron-down" size={14} color={COLORS.textMuted} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setSearchOpen((v) => !v)} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Ara">
          <Ionicons name="search" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setFilterOpen(true)} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Filtrele">
          <Ionicons name="filter" size={19} color={COLORS.text} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{activeFilterCount}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      {searchOpen && (
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Müşteri veya hizmet ara…"
            placeholderTextColor={COLORS.textMuted}
            autoFocus
            accessibilityLabel="Müşteri veya hizmet ara"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel="Aramayı temizle">
              <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* View toggle */}
      <View style={styles.viewToggle}>
        {([['day', 'Gün'], ['week', 'Hafta'], ['month', 'Ay']] as const).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.viewBtn, viewMode === key && styles.viewBtnActive]}
            onPress={() => setViewMode(key)}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar" size={14} color={viewMode === key ? STATIC_WHITE : COLORS.textSecondary} />
            <Text style={[styles.viewBtnText, viewMode === key && styles.viewBtnTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {viewMode !== 'month' && (
        <View style={styles.weekStripWrap}>
          <TouchableOpacity onPress={() => setWeekAnchor(addWeeks(weekAnchor, -1))} style={styles.weekNavBtn} accessibilityRole="button" accessibilityLabel="Önceki hafta">
            <Ionicons name="chevron-back" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <View style={styles.weekStrip}>
            {weekDays.map((d) => {
              const isSelected = isSameDay(d, selectedDate);
              const isTd = isTodayFn(d);
              const hasEvents = filteredEvents.some((e) => isSameDay(appointmentLocalDate(e.startTime), d));
              return (
                <TouchableOpacity key={d.toISOString()} style={styles.dayCol} onPress={() => selectDay(d)} activeOpacity={0.8}>
                  <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>{format(d, 'EEE', { locale: tr }).slice(0, 3).toUpperCase()}</Text>
                  <View style={[styles.dayNum, isSelected && styles.dayNumSelected, isTd && !isSelected && styles.dayNumToday]}>
                    <Text style={[styles.dayNumText, isSelected && styles.dayNumTextSelected, isTd && !isSelected && styles.dayNumTextToday]}>{format(d, 'd')}</Text>
                  </View>
                  {hasEvents && <View style={[styles.eventDot, isSelected && styles.eventDotSelected]} />}
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity onPress={() => setWeekAnchor(addWeeks(weekAnchor, 1))} style={styles.weekNavBtn} accessibilityRole="button" accessibilityLabel="Sonraki hafta">
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {viewMode === 'day' && (
        <>
          <View style={styles.dateBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACE[2] }}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
              <Text style={styles.dateBannerText}>{format(selectedDate, 'd MMMM yyyy, EEEE', { locale: tr })}</Text>
            </View>
            <TouchableOpacity style={styles.todayPill} onPress={goToday} activeOpacity={0.8}>
              <Text style={styles.todayPillText}>Bugün</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.timeline}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
          >
            <View style={styles.timelineInner}>
              {HOURS.map((h) => (
                <View key={h} style={[styles.hourRow, { top: (h - 8) * HOUR_HEIGHT }]}>
                  <Text style={styles.hourLabel}>{h.toString().padStart(2, '0')}:00</Text>
                  <View style={styles.hourLine} />
                </View>
              ))}
              {dayEvents.map((ev) => {
                const s = statusMap[ev.status] ?? statusMap.pending;
                return (
                  <TouchableOpacity
                    key={ev.id}
                    style={[styles.event, { top: getEventTop(ev.startTime), height: getEventHeight(ev.startTime, ev.endTime), backgroundColor: s.bg, borderLeftColor: s.bar }]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedAppt(ev)}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.eventTitle} numberOfLines={1}>{ev.customerName}</Text>
                      <Text style={styles.eventService} numberOfLines={1}>{ev.serviceName}</Text>
                      <View style={styles.eventEmpRow}>
                        <Ionicons name="person-outline" size={11} color={COLORS.textMuted} />
                        <Text style={styles.eventEmployee} numberOfLines={1}>{ev.employeeName}</Text>
                      </View>
                    </View>
                    <View style={styles.eventActions}>
                      <TouchableOpacity style={[styles.eventCallBtn, { backgroundColor: s.bar + '22' }]} onPress={() => callCustomer(ev.customerPhone)} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Müşteriyi ara">
                        <Ionicons name="call" size={15} color={s.bar} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.eventKebabBtn} onPress={() => setSelectedAppt(ev)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Diğer işlemler">
                        <Ionicons name="ellipsis-vertical" size={15} color={COLORS.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {isSameDay(selectedDate, today) && (
                <View style={[styles.nowLine, { top: ((today.getHours() - 8) * 60 + today.getMinutes()) / 60 * HOUR_HEIGHT }]}>
                  <Text style={styles.nowTimeLabel}>{format(today, 'HH:mm')}</Text>
                  <View style={styles.nowDot} />
                  <View style={styles.nowLineBar} />
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
        </>
      )}

      {viewMode === 'week' && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: SPACE[5], paddingBottom: 120, gap: SPACE[4] }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
        >
          {weekDays.map((d) => {
            const dEvents = filteredEvents
              .filter((e) => isSameDay(appointmentLocalDate(e.startTime), d))
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            return (
              <View key={d.toISOString()}>
                <TouchableOpacity onPress={() => selectDay(d)} activeOpacity={0.7} style={styles.weekDayHeader}>
                  <Text style={[styles.weekDayHeaderText, isTodayFn(d) && { color: COLORS.primary }]}>
                    {format(d, 'EEEE, d MMMM', { locale: tr })}
                  </Text>
                  {dEvents.length > 0 && <Badge variant="default" size="sm">{dEvents.length}</Badge>}
                </TouchableOpacity>
                {dEvents.length === 0 ? (
                  <Text style={styles.weekEmptyText}>Randevu yok</Text>
                ) : (
                  <View style={{ gap: SPACE[2] }}>
                    {dEvents.map((ev) => renderEventCard(ev, true))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {viewMode === 'month' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACE[4], paddingBottom: 120 }}>
          <View style={styles.monthWeekHeader}>
            {['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PAZ'].map((d) => (
              <Text key={d} style={styles.monthWeekHeaderText}>{d}</Text>
            ))}
          </View>
          <View style={styles.monthGrid}>
            {monthGridDays.map((d) => {
              const inMonth = isSameMonth(d, monthCursor);
              const isSelected = isSameDay(d, selectedDate);
              const isTd = isTodayFn(d);
              const count = filteredEvents.filter((e) => isSameDay(appointmentLocalDate(e.startTime), d)).length;
              return (
                <TouchableOpacity key={d.toISOString()} style={styles.monthCell} onPress={() => selectDay(d)} activeOpacity={0.7}>
                  <View style={[styles.monthCellNum, isSelected && styles.monthCellNumSelected, isTd && !isSelected && styles.monthCellNumToday]}>
                    <Text style={[styles.monthCellNumText, !inMonth && styles.monthCellNumTextDim, isSelected && styles.monthCellNumTextSelected, isTd && !isSelected && styles.monthCellNumTextToday]}>
                      {format(d, 'd')}
                    </Text>
                  </View>
                  {count > 0 && (
                    <View style={styles.monthDotsRow}>
                      {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                        <View key={i} style={styles.monthDot} />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setCreateOpen(true)} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Randevu ekle">
        <Ionicons name="add" size={28} color={STATIC_WHITE} />
      </TouchableOpacity>

      <DetailSheet
        apt={selectedAppt}
        visible={!!selectedAppt}
        onClose={() => setSelectedAppt(null)}
        onAction={(action, id) => mutation.mutate({ action, id })}
      />
      <CreateModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        date={selectedDate}
        employees={employees}
        services={services}
      />
      <FilterModal
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        employees={employees}
        statusFilters={statusFilters}
        setStatusFilters={setStatusFilters}
        employeeFilters={employeeFilters}
        setEmployeeFilters={setEmployeeFilters}
      />
      <MonthPickerModal
        visible={monthPickerOpen}
        onClose={() => setMonthPickerOpen(false)}
        cursor={monthCursor}
        onSelect={(d) => { setMonthCursor(d); setWeekAnchor(d); setSelectedDate(d); setViewMode('month'); }}
      />
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACE[5], paddingVertical: SPACE[3], gap: SPACE[2],
  },
  title: { fontSize: FONT.xl, fontWeight: FONT.extrabold, color: COLORS.text },
  subtitle: { fontSize: FONT.sm, color: COLORS.textSecondary, fontWeight: FONT.medium },
  iconBtn: {
    width: 40, height: 40, borderRadius: RADIUS.lg, backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm,
  },
  filterBadge: {
    position: 'absolute', top: -3, right: -3, width: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  filterBadgeText: { fontSize: 9, fontWeight: FONT.bold, color: STATIC_WHITE },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACE[2],
    marginHorizontal: SPACE[5], marginBottom: SPACE[2],
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, paddingHorizontal: SPACE[3], height: 42,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  searchInput: { flex: 1, fontSize: FONT.sm, color: COLORS.text },

  viewToggle: {
    flexDirection: 'row', marginHorizontal: SPACE[5], marginBottom: SPACE[3],
    backgroundColor: COLORS.surface, borderRadius: RADIUS.full, padding: 4, gap: 4,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  viewBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 9, borderRadius: RADIUS.full,
  },
  viewBtnActive: { backgroundColor: COLORS.primary },
  viewBtnText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  viewBtnTextActive: { color: STATIC_WHITE },

  weekStripWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, marginHorizontal: SPACE[4], borderRadius: RADIUS.xl,
    paddingVertical: SPACE[2], marginBottom: SPACE[3], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm,
  },
  weekNavBtn: { paddingHorizontal: SPACE[1], alignSelf: 'center' },
  weekStrip: { flex: 1, flexDirection: 'row' },
  dayCol: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: SPACE[1] },
  dayName: { fontSize: 10, color: COLORS.textMuted, fontWeight: FONT.semibold },
  dayNameSelected: { color: COLORS.primaryDark },
  dayNum: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dayNumSelected: { backgroundColor: COLORS.primary },
  dayNumToday: { borderWidth: 2, borderColor: COLORS.primary },
  dayNumText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  dayNumTextSelected: { color: STATIC_WHITE, fontWeight: FONT.bold },
  dayNumTextToday: { color: COLORS.primaryDark, fontWeight: FONT.bold },
  eventDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.textMuted },
  eventDotSelected: { backgroundColor: COLORS.primaryDark },

  dateBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: SPACE[5], marginBottom: SPACE[3],
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, paddingHorizontal: SPACE[4], paddingVertical: SPACE[3],
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  dateBannerText: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.text },
  todayPill: { backgroundColor: COLORS.primaryMuted, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5 },
  todayPillText: { fontSize: FONT.xs, fontWeight: FONT.bold, color: COLORS.primaryDark },

  timeline: { flex: 1 },
  timelineInner: { marginLeft: 60, marginHorizontal: SPACE[4], position: 'relative', height: HOURS.length * HOUR_HEIGHT + 40 },
  hourRow: { position: 'absolute', left: -60, right: 0, flexDirection: 'row', alignItems: 'center' },
  hourLabel: { width: 52, fontSize: 10, color: COLORS.textMuted, fontWeight: FONT.medium, textAlign: 'right', paddingRight: 8 },
  hourLine: { flex: 1, height: 1, backgroundColor: COLORS.borderLight },
  event: {
    position: 'absolute', left: 0, right: 0, borderRadius: RADIUS.md, borderLeftWidth: 3,
    padding: SPACE[2], flexDirection: 'row', alignItems: 'center', gap: SPACE[2],
  },
  eventTitle: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.text },
  eventService: { fontSize: FONT.xs, color: COLORS.textSecondary, marginTop: 1 },
  eventEmpRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  eventEmployee: { fontSize: 10, color: COLORS.textMuted },
  eventActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eventCallBtn: { width: 30, height: 30, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  eventKebabBtn: { width: 26, height: 30, alignItems: 'center', justifyContent: 'center' },

  nowLine: { position: 'absolute', left: -60, right: 0, flexDirection: 'row', alignItems: 'center' },
  nowTimeLabel: { width: 52, fontSize: 10, fontWeight: FONT.bold, color: COLORS.error, textAlign: 'right', paddingRight: 6 },
  nowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error, marginRight: -4 },
  nowLineBar: { flex: 1, height: 2, backgroundColor: COLORS.error },

  noEvents: { position: 'absolute', bottom: 140, left: 0, right: 0, alignItems: 'center', gap: SPACE[2] },
  noEventsText: { fontSize: FONT.sm, color: COLORS.textMuted, fontWeight: FONT.medium },

  weekDayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE[2] },
  weekDayHeaderText: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.text, textTransform: 'capitalize' },
  weekEmptyText: { fontSize: FONT.xs, color: COLORS.textMuted, fontStyle: 'italic' },

  monthWeekHeader: { flexDirection: 'row', marginBottom: SPACE[2] },
  monthWeekHeaderText: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: FONT.bold, color: COLORS.textMuted },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  monthCell: { width: '14.28%', alignItems: 'center', paddingVertical: SPACE[2], gap: 3 },
  monthCellNum: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  monthCellNumSelected: { backgroundColor: COLORS.primary },
  monthCellNumToday: { borderWidth: 2, borderColor: COLORS.primary },
  monthCellNumText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  monthCellNumTextDim: { color: COLORS.textMuted },
  monthCellNumTextSelected: { color: STATIC_WHITE, fontWeight: FONT.bold },
  monthCellNumTextToday: { color: COLORS.primaryDark, fontWeight: FONT.bold },
  monthDotsRow: { flexDirection: 'row', gap: 2 },
  monthDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary },

  fab: {
    position: 'absolute', right: SPACE[5], bottom: SPACE[6],
    width: 56, height: 56, borderRadius: RADIUS.full, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', ...SHADOW.primary,
  },
});

const createEventCardStyles = (COLORS: Palette) => StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: SPACE[3],
    borderRadius: RADIUS.lg, borderLeftWidth: 3, padding: SPACE[3],
  },
  timeCol: { width: 46, alignItems: 'center' },
  timeText: { fontSize: FONT.xs, fontWeight: FONT.bold, color: COLORS.text },
  timeTextMuted: { fontSize: 10, color: COLORS.textMuted },
  name: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.text },
  service: { fontSize: FONT.xs, color: COLORS.textSecondary, marginTop: 1 },
  empRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  empText: { fontSize: 10, color: COLORS.textMuted },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  callBtn: { width: 30, height: 30, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  kebabBtn: { width: 24, height: 30, alignItems: 'center', justifyContent: 'center' },
});

const createSheetStyles = (COLORS: Palette) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'], height: '85%' },
  handle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: RADIUS.full, alignSelf: 'center', marginTop: SPACE[3] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACE[5], borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  title: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text, flex: 1 },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceAlt },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE[3], paddingVertical: SPACE[2], borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  rowIcon: { width: 32, height: 32, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: FONT.medium },
  rowValue: { fontSize: FONT.base, color: COLORS.text, fontWeight: FONT.medium, marginTop: 2 },
  actions: { flexDirection: 'row', gap: SPACE[3], padding: SPACE[5], borderTopWidth: 1, borderTopColor: COLORS.borderLight },
});

const createFormStyles = (COLORS: Palette) => StyleSheet.create({
  label: { fontSize: FONT.xs, fontWeight: FONT.bold, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.lg,
    paddingHorizontal: SPACE[4], paddingVertical: SPACE[3], fontSize: FONT.base, color: COLORS.text, backgroundColor: COLORS.white,
  },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: 'transparent' },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  chipTextActive: { color: STATIC_WHITE },
});

const createPickerStyles = (COLORS: Palette) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  card: { width: '84%', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[5], gap: SPACE[4] },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  yearBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  yearText: { fontSize: FONT.lg, fontWeight: FONT.extrabold, color: COLORS.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE[2] },
  monthBtn: { width: '30%', paddingVertical: SPACE[3], borderRadius: RADIUS.lg, alignItems: 'center', backgroundColor: COLORS.surfaceAlt },
  monthBtnActive: { backgroundColor: COLORS.primary },
  monthText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  monthTextActive: { color: STATIC_WHITE },
});
