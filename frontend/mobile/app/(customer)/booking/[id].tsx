import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeOut, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { useQueryClient } from '@tanstack/react-query';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import api from '@/lib/api';
import { getDeviceId } from '@/lib/deviceId';
import { useToast } from '@/components/ui/Toast';
import { SkeletonList } from '@/components/ui/Skeleton';

const GUEST_INFO_KEY = 'guest_customer_info';

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

interface ServiceDto {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
}

interface AvailabilityDay {
  date: string;
  hasAvailability: boolean;
  availableEmployeeCount: number;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export default function BookingScreen() {
  const { id: businessId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [businessName, setBusinessName] = useState('');
  const [loadingServices, setLoadingServices] = useState(true);

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [form, setForm] = useState({ ad: '', soyad: '', telefon: '', email: '', sehir: '', aciklama: '' });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const today = useMemo(() => new Date(), []);
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [availability, setAvailability] = useState<Map<string, AvailabilityDay>>(new Map());
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const selectedServiceData = useMemo(
    () => services.find(s => s.id === selectedService),
    [selectedService, services]
  );

  useEffect(() => {
    SecureStore.getItemAsync(GUEST_INFO_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw);
        setForm((prev) => ({ ...prev, ...saved }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!businessId) return;
    setLoadingServices(true);
    api.get(`/businesses/${businessId}`)
      .then((res) => {
        setBusinessName(res.data.name);
        setServices(res.data.services || []);
      })
      .catch(() => toast.error('İşletme bilgileri yüklenemedi.'))
      .finally(() => setLoadingServices(false));
  }, [businessId]);

  useEffect(() => {
    if (!selectedService || step < 2 || !businessId) return;
    setAvailabilityLoading(true);
    setError(null);

    api.get(`/businesses/${businessId}/availability?serviceId=${selectedService}&month=${calendarMonth + 1}&year=${calendarYear}`)
      .then((res) => {
        const data: AvailabilityDay[] = Array.isArray(res.data) ? res.data : [];
        const map = new Map<string, AvailabilityDay>();
        data.forEach(d => map.set(d.date, d));
        setAvailability(map);
      })
      .catch(() => setError('Takvim yüklenirken bir hata oluştu.'))
      .finally(() => setAvailabilityLoading(false));
  }, [selectedService, calendarMonth, calendarYear, businessId, step]);

  useEffect(() => {
    if (!selectedDate || !selectedService || !businessId) return;
    setSlotsLoading(true);
    setSelectedTime(null);
    setError(null);

    api.get(`/appointments/available-slots?serviceId=${selectedService}&date=${selectedDate}&businessId=${businessId}`)
      .then((res) => setTimeSlots(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('Saatler yüklenirken bir hata oluştu.'))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, selectedService, businessId]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
    const startPad = (firstDay.getDay() + 6) % 7;
    const days: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(calendarYear, calendarMonth, d));
    return days;
  }, [calendarMonth, calendarYear]);

  function formatDate(d: Date) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function isDateInPast(d: Date) {
    const date = new Date(d);
    date.setHours(23, 59, 59, 999);
    return date < today;
  }

  function canMonthGoBack() {
    return calendarYear > today.getFullYear() || (calendarYear === today.getFullYear() && calendarMonth > today.getMonth());
  }

  function prevMonth() {
    if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(p => p - 1); }
    else setCalendarMonth(p => p - 1);
  }

  function nextMonth() {
    if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(p => p + 1); }
    else setCalendarMonth(p => p + 1);
  }

  function formatPhoneDisplay(raw: string) {
    const digits = raw.replace(/\D/g, '');
    const local = digits.startsWith('90') ? digits.slice(2) : digits.startsWith('0') ? digits.slice(1) : digits;
    const d = local.slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
  }

  function handlePhoneChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    setForm(prev => ({ ...prev, telefon: digits ? `+90${digits}` : '' }));
  }

  function handleFormChange(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setStep(1);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setForm({ ad: '', soyad: '', telefon: '', email: '', sehir: '', aciklama: '' });
    setLoading(false);
    setError(null);
    setSuccess(false);
    setTimeSlots([]);
    setCalendarMonth(today.getMonth());
    setCalendarYear(today.getFullYear());
  }

  async function handleSubmit() {
    if (!selectedService || !selectedDate || !selectedTime || !form.ad || !form.soyad || !form.telefon || !form.email || !form.sehir) {
      setError('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const deviceId = await getDeviceId();
      await api.post('/appointments', {
        serviceId: selectedService,
        employeeId: null,
        date: selectedDate,
        time: selectedTime,
        firstName: form.ad,
        lastName: form.soyad,
        phone: form.telefon,
        email: form.email,
        city: form.sehir,
        notes: form.aciklama,
        deviceId,
      });
      await SecureStore.setItemAsync(GUEST_INFO_KEY, JSON.stringify({
        ad: form.ad,
        soyad: form.soyad,
        telefon: form.telefon,
        email: form.email,
        sehir: form.sehir,
      }));
      await queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Randevu oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  const stepLabels = ['Hizmet', 'Tarih', 'Saat', 'Bilgiler'];

  if (loadingServices) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={{ padding: SPACE[5] }}>
          <SkeletonList variant="row" count={4} />
        </View>
      </View>
    );
  }

  if (success) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.successScroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(450)} style={styles.successContainer}>
            <View style={styles.successIconOuter}>
              <LinearGradient
                colors={[COLORS.primaryLight, COLORS.primaryMuted]}
                style={styles.successIconGlow}
              />
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark" size={54} color={STATIC_WHITE} />
              </View>
            </View>

            <Text style={styles.successTitle}>Randevunuz Alındı!</Text>
            <Text style={styles.successText}>
              Randevu talebiniz başarıyla iletildi. İşletme en kısa sürede sizinle iletişime geçecektir.
            </Text>

            <View style={styles.successSummaryCard}>
              <View style={styles.successSummaryRow}>
                <View style={styles.successSummaryIcon}>
                  <Ionicons name="business-outline" size={16} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.successSummaryLabel}>İşletme</Text>
                  <Text style={styles.successSummaryValue} numberOfLines={1}>{businessName}</Text>
                </View>
              </View>
              <View style={styles.successDivider} />
              <View style={styles.successSummaryRow}>
                <View style={styles.successSummaryIcon}>
                  <Ionicons name="cut-outline" size={16} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.successSummaryLabel}>Hizmet</Text>
                  <Text style={styles.successSummaryValue} numberOfLines={1}>{selectedServiceData?.name}</Text>
                </View>
              </View>
              <View style={styles.successDivider} />
              <View style={styles.successSummaryRow}>
                <View style={styles.successSummaryIcon}>
                  <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.successSummaryLabel}>Tarih ve Saat</Text>
                  <Text style={styles.successSummaryValue}>{selectedDate} · {selectedTime}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => { resetForm(); router.replace('/(customer)/(tabs)/appointments'); }}
              activeOpacity={0.85}
            >
              <Ionicons name="calendar" size={18} color={STATIC_WHITE} />
              <Text style={styles.successBtnText}>Randevularımı Gör</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.successSecondaryBtn}
              onPress={() => { resetForm(); router.back(); }}
              activeOpacity={0.7}
            >
              <Text style={styles.successSecondaryText}>İşletmeye Geri Dön</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + SPACE[3] }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => step > 1 ? setStep(step - 1) : router.back()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Randevu Al</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{businessName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.stepBarCard}>
        {stepLabels.map((label, i) => {
          const s = i + 1;
          const isDone = step > s;
          const isActive = step === s;
          return (
            <React.Fragment key={s}>
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, isActive && styles.stepCircleActive, isDone && styles.stepCircleDone]}>
                  {isDone ? (
                    <Ionicons name="checkmark" size={16} color={STATIC_WHITE} />
                  ) : (
                    <Text style={[styles.stepNumber, isActive && styles.stepNumberActive]}>{s}</Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, (isActive || isDone) && styles.stepLabelActive]} numberOfLines={1}>{label}</Text>
              </View>
              {s < stepLabels.length && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
            </React.Fragment>
          );
        })}
      </View>

      {error && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <Animated.View entering={FadeIn.duration(220)} style={styles.stepContent}>
            <Text style={styles.stepTitle}>Hizmet Seçin</Text>
            <Text style={styles.stepSubtitle}>Randevu almak istediğiniz hizmeti seçerek devam edin.</Text>
            {services.length === 0 ? (
              <Text style={styles.emptyText}>Henüz hizmet eklenmemiş.</Text>
            ) : (
              services.map((svc, idx) => {
                const active = selectedService === svc.id;
                return (
                  <Animated.View key={svc.id} entering={FadeInUp.duration(280).delay(idx * 40)}>
                    <TouchableOpacity
                      style={[styles.serviceCard, active && styles.serviceCardActive]}
                      onPress={() => setSelectedService(svc.id)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.serviceIcon, active && styles.serviceIconActive]}>
                        <Ionicons name="cut-outline" size={18} color={active ? STATIC_WHITE : COLORS.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.serviceName}>{svc.name}</Text>
                        <View style={styles.serviceMetaRow}>
                          <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                          <Text style={styles.serviceDuration}>{svc.durationMinutes} dk</Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text style={styles.servicePrice}>₺{svc.price.toLocaleString('tr-TR')}</Text>
                        {active && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })
            )}
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeIn.duration(220)} style={styles.stepContent}>
            <View style={styles.stepTitleRow}>
              <View>
                <Text style={styles.stepTitle}>Tarih Seçin</Text>
                {selectedServiceData && <Text style={styles.stepTitleSub}>{selectedServiceData.name}</Text>}
              </View>
            </View>

            <View style={styles.calCard}>
              <View style={styles.calendarNav}>
                <TouchableOpacity onPress={prevMonth} disabled={!canMonthGoBack()} activeOpacity={0.7} style={[styles.calNavBtn, !canMonthGoBack() && styles.calNavBtnDisabled]} accessibilityRole="button" accessibilityLabel="Önceki ay">
                  <Ionicons name="chevron-back" size={18} color={canMonthGoBack() ? COLORS.text : COLORS.textMuted} />
                </TouchableOpacity>
                <Text style={styles.calMonth}>{MONTHS[calendarMonth]} {calendarYear}</Text>
                <TouchableOpacity onPress={nextMonth} activeOpacity={0.7} style={styles.calNavBtn} accessibilityRole="button" accessibilityLabel="Sonraki ay">
                  <Ionicons name="chevron-forward" size={18} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.calDayHeaders}>
                {DAY_NAMES.map(d => <Text key={d} style={styles.calDayHeader}>{d}</Text>)}
              </View>

              {availabilityLoading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: SPACE[8] }} />
              ) : (
                <View style={styles.calGrid}>
                  {calendarDays.map((d, i) => {
                    if (!d) return <View key={`empty-${i}`} style={styles.calDay} />;
                    const dateStr = formatDate(d);
                    const isPast = isDateInPast(d);
                    const isSelected = selectedDate === dateStr;
                    const isToday = dateStr === formatDate(today);
                    const dayAvail = availability.get(dateStr);
                    const hasSlots = dayAvail?.hasAvailability ?? false;

                    return (
                      <TouchableOpacity
                        key={dateStr}
                        style={[
                          styles.calDay,
                          isPast && styles.calDayPast,
                          !isPast && hasSlots && !isSelected && styles.calDayAvailable,
                          !isPast && !hasSlots && !isSelected && styles.calDayUnavailable,
                          isToday && !isSelected && styles.calDayToday,
                          isSelected && styles.calDaySelected,
                        ]}
                        onPress={() => { if (!isPast && hasSlots) { setSelectedDate(dateStr); setSelectedTime(null); } }}
                        disabled={isPast || !hasSlots}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.calDayNum,
                          isPast && styles.calDayNumPast,
                          !isPast && !hasSlots && !isSelected && styles.calDayNumUnavailable,
                          isToday && !isSelected && styles.calDayNumToday,
                          isSelected && styles.calDayNumSelected,
                        ]}>
                          {d.getDate()}
                        </Text>
                        {!isPast && hasSlots && !isSelected && <View style={styles.calDayDot} />}
                        {isSelected && <View style={styles.calDayDotSelected} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={styles.calLegend}>
                <View style={styles.calLegendItem}>
                  <View style={[styles.calLegendDot, { backgroundColor: COLORS.success }]} />
                  <Text style={styles.calLegendText}>Uygun</Text>
                </View>
                <View style={styles.calLegendItem}>
                  <View style={[styles.calLegendDot, { backgroundColor: COLORS.border }]} />
                  <Text style={styles.calLegendText}>Dolu</Text>
                </View>
                <View style={styles.calLegendItem}>
                  <View style={[styles.calLegendDot, { backgroundColor: COLORS.primary }]} />
                  <Text style={styles.calLegendText}>Bugün</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {step === 3 && (
          <Animated.View entering={FadeIn.duration(220)} style={styles.stepContent}>
            <View style={styles.stepTitleRow}>
              <View>
                <Text style={styles.stepTitle}>Saat Seçin</Text>
                <Text style={styles.stepTitleSub}>{selectedDate}</Text>
              </View>
            </View>

            {slotsLoading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: SPACE[8] }} />
            ) : timeSlots.filter(s => s.isAvailable).length === 0 ? (
              <View style={styles.emptySlots}>
                <Ionicons name="time-outline" size={32} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>Bu tarihte uygun saat bulunmamaktadır.</Text>
                <TouchableOpacity onPress={() => setStep(2)} activeOpacity={0.7}>
                  <Text style={styles.linkText}>Başka bir tarih seçin</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.timeGrid}>
                {timeSlots.filter(s => s.isAvailable).map((slot, idx) => {
                  const timeStr = new Date(slot.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
                  const active = selectedTime === timeStr;
                  return (
                    <Animated.View key={slot.startTime} entering={FadeInUp.duration(220).delay(Math.min(idx, 12) * 25)}>
                      <TouchableOpacity
                        style={[styles.timeSlot, active && styles.timeSlotActive]}
                        onPress={() => setSelectedTime(timeStr)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="time-outline" size={14} color={active ? STATIC_WHITE : COLORS.primary} />
                        <Text style={[styles.timeSlotText, active && styles.timeSlotTextActive]}>
                          {timeStr}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </Animated.View>
        )}

        {step === 4 && (
          <Animated.View entering={FadeIn.duration(220)} style={styles.stepContent}>
            <Text style={styles.stepTitle}>Kişisel Bilgiler</Text>
            <Text style={styles.stepSubtitle}>Randevunuzu onaylayabilmemiz için iletişim bilgilerinizi girin.</Text>

            <View style={styles.formCard}>
              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Ad *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Ad"
                    placeholderTextColor={COLORS.textMuted}
                    value={form.ad}
                    onChangeText={(v) => handleFormChange('ad', v)}
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Soyad *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Soyad"
                    placeholderTextColor={COLORS.textMuted}
                    value={form.soyad}
                    onChangeText={(v) => handleFormChange('soyad', v)}
                  />
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Telefon *</Text>
                <View style={styles.phoneWrap}>
                  <View style={styles.phonePrefix}>
                    <Text style={styles.phonePrefixText}>+90</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="5XX XXX XX XX"
                    placeholderTextColor={COLORS.textMuted}
                    value={formatPhoneDisplay(form.telefon)}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>E-posta *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="ornek@email.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={form.email}
                  onChangeText={(v) => handleFormChange('email', v)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Şehir *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Şehir"
                  placeholderTextColor={COLORS.textMuted}
                  value={form.sehir}
                  onChangeText={(v) => handleFormChange('sehir', v)}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Açıklama</Text>
                <TextInput
                  style={[styles.formInput, { height: 84, textAlignVertical: 'top' }]}
                  placeholder="Randevu ile ilgili eklemek istedikleriniz..."
                  placeholderTextColor={COLORS.textMuted}
                  value={form.aciklama}
                  onChangeText={(v) => handleFormChange('aciklama', v)}
                  multiline
                />
              </View>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Randevu Özeti</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Hizmet</Text>
                <Text style={styles.summaryValue}>{selectedServiceData?.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tarih</Text>
                <Text style={styles.summaryValue}>{selectedDate}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Saat</Text>
                <Text style={styles.summaryValue}>{selectedTime}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>Toplam Ücret</Text>
                <Text style={styles.summaryPrice}>₺{selectedServiceData?.price.toLocaleString('tr-TR')}</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACE[3] }]}>
        {step > 1 && (
          <TouchableOpacity style={styles.backStepBtn} onPress={() => setStep(step - 1)} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={18} color={COLORS.textSecondary} />
            <Text style={styles.backStepText}>Geri</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        {step < 4 ? (
          <TouchableOpacity
            style={[styles.nextBtn, (
              (step === 1 && !selectedService) ||
              (step === 2 && !selectedDate) ||
              (step === 3 && !selectedTime)
            ) && styles.nextBtnDisabled]}
            onPress={() => setStep(step + 1)}
            disabled={
              (step === 1 && !selectedService) ||
              (step === 2 && !selectedDate) ||
              (step === 3 && !selectedTime)
            }
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>Devam Et</Text>
            <Ionicons name="chevron-forward" size={18} color={STATIC_WHITE} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.nextBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={STATIC_WHITE} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color={STATIC_WHITE} />
                <Text style={styles.nextBtnText}>Randevu Oluştur</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE[5],
    paddingBottom: SPACE[3],
    backgroundColor: COLORS.bg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text },
  headerSub: { fontSize: FONT.xs, color: COLORS.textSecondary, marginTop: 2 },
  stepBarCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginHorizontal: SPACE[5],
    marginBottom: SPACE[3],
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SPACE[3],
    paddingVertical: SPACE[4],
    ...SHADOW.sm,
  },
  stepItem: { alignItems: 'center', gap: 6, width: 56 },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepCircleDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  stepNumber: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.textMuted },
  stepNumberActive: { color: STATIC_WHITE },
  stepLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: FONT.medium },
  stepLabelActive: { color: COLORS.text, fontWeight: FONT.semibold },
  stepLine: { width: 20, height: 2, backgroundColor: COLORS.border, marginHorizontal: 2, marginTop: 15 },
  stepLineActive: { backgroundColor: COLORS.success },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[2],
    marginHorizontal: SPACE[5],
    marginBottom: SPACE[3],
    backgroundColor: COLORS.errorLight,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.error + '33',
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[3],
  },
  errorText: { fontSize: FONT.sm, color: COLORS.errorText, flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[8] },
  stepContent: { gap: SPACE[3] },
  stepTitle: { fontSize: FONT.xl, fontWeight: FONT.extrabold, color: COLORS.text },
  stepSubtitle: { fontSize: FONT.sm, color: COLORS.textSecondary, marginTop: -SPACE[2], marginBottom: SPACE[1] },
  stepTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepTitleSub: { fontSize: FONT.xs, color: COLORS.textSecondary, marginTop: 2 },
  emptyText: { fontSize: FONT.sm, color: COLORS.textMuted, textAlign: 'center', marginVertical: SPACE[2] },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[4],
    ...SHADOW.sm,
  },
  serviceCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryMuted,
  },
  serviceIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIconActive: { backgroundColor: COLORS.primary },
  serviceName: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  serviceMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  serviceDuration: { fontSize: FONT.xs, color: COLORS.textMuted },
  servicePrice: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.primary },
  calCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACE[4],
    gap: SPACE[3],
    ...SHADOW.sm,
  },
  calendarNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calNavBtnDisabled: { opacity: 0.4 },
  calMonth: { fontSize: FONT.md, fontWeight: FONT.extrabold, color: COLORS.text },
  calDayHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  calDayHeader: { fontSize: FONT.xs, fontWeight: FONT.semibold, color: COLORS.textMuted, width: 40, textAlign: 'center' },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  calDay: {
    width: '13.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    gap: 3,
  },
  calDayPast: { opacity: 0.35 },
  calDaySelected: { backgroundColor: COLORS.primary },
  calDayToday: { backgroundColor: COLORS.primaryMuted, borderWidth: 1.5, borderColor: COLORS.primary },
  calDayAvailable: { backgroundColor: COLORS.successLight },
  calDayUnavailable: { backgroundColor: COLORS.surfaceAlt },
  calDayNum: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.text },
  calDayNumPast: { color: COLORS.textMuted },
  calDayNumUnavailable: { color: COLORS.textMuted },
  calDayNumSelected: { color: STATIC_WHITE },
  calDayNumToday: { color: COLORS.primary },
  calDayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.success },
  calDayDotSelected: { width: 4, height: 4, borderRadius: 2, backgroundColor: STATIC_WHITE },
  calLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACE[4],
    paddingTop: SPACE[2],
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  calLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  calLegendDot: { width: 8, height: 8, borderRadius: 4 },
  calLegendText: { fontSize: FONT.xs, color: COLORS.textSecondary },
  emptySlots: { alignItems: 'center', marginVertical: SPACE[6], gap: SPACE[2] },
  linkText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.primary, marginTop: SPACE[1] },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE[2],
  },
  timeSlot: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: SPACE[3],
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surface,
    ...SHADOW.sm,
  },
  timeSlotActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  timeSlotText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  timeSlotTextActive: { color: STATIC_WHITE },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACE[4],
    gap: SPACE[4],
    ...SHADOW.sm,
  },
  formRow: { flexDirection: 'row', gap: SPACE[3] },
  formField: { flex: 1, gap: SPACE[2] },
  formLabel: { fontSize: FONT.xs, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  formInput: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[3],
    fontSize: FONT.sm,
    color: COLORS.text,
  },
  phoneWrap: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  phonePrefix: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: SPACE[3],
    paddingVertical: SPACE[3],
    justifyContent: 'center',
    borderRightWidth: 1.5,
    borderRightColor: COLORS.border,
  },
  phonePrefixText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  phoneInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[3],
    fontSize: FONT.sm,
    color: COLORS.text,
  },
  summaryCard: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.xl,
    padding: SPACE[4],
    gap: SPACE[3],
    ...SHADOW.md,
  },
  summaryTitle: { fontSize: FONT.sm, fontWeight: FONT.bold, color: STATIC_WHITE },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.55)' },
  summaryValue: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: STATIC_WHITE },
  summaryDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
  summaryTotalLabel: { fontSize: FONT.sm, fontWeight: FONT.bold, color: STATIC_WHITE },
  summaryPrice: { fontSize: FONT.lg, fontWeight: FONT.extrabold, color: COLORS.primaryLight },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE[5],
    paddingTop: SPACE[3],
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  backStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACE[3],
  },
  backStepText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[2],
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACE[6],
    paddingVertical: SPACE[4],
    borderRadius: RADIUS.lg,
    ...SHADOW.primary,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { fontSize: FONT.sm, fontWeight: FONT.bold, color: STATIC_WHITE },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[2],
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACE[6],
    paddingVertical: SPACE[4],
    borderRadius: RADIUS.lg,
    ...SHADOW.md,
  },
  successScroll: { flexGrow: 1, justifyContent: 'center' },
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACE[6],
    paddingVertical: SPACE[8],
    gap: SPACE[3],
  },
  successIconOuter: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE[2],
  },
  successIconGlow: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
  },
  successIconCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.lg,
  },
  successTitle: { fontSize: FONT['2xl'], fontWeight: FONT.extrabold, color: COLORS.text, textAlign: 'center' },
  successText: { fontSize: FONT.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: SPACE[2] },
  successSummaryCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACE[4],
    gap: SPACE[3],
    marginTop: SPACE[3],
    ...SHADOW.sm,
  },
  successSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  successSummaryIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successSummaryLabel: { fontSize: FONT.xs, color: COLORS.textMuted },
  successSummaryValue: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text, marginTop: 1 },
  successDivider: { height: 1, backgroundColor: COLORS.borderLight },
  successBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE[2],
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACE[4],
    borderRadius: RADIUS.lg,
    marginTop: SPACE[5],
    ...SHADOW.primary,
  },
  successBtnText: { fontSize: FONT.md, fontWeight: FONT.bold, color: STATIC_WHITE },
  successSecondaryBtn: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: SPACE[3],
  },
  successSecondaryText: { fontSize: FONT.sm, fontWeight: FONT.medium, color: COLORS.textSecondary },
});
