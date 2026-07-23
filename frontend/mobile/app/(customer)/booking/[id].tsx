import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import api from '@/lib/api';

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
    if (!businessId) return;
    setLoadingServices(true);
    api.get(`/businesses/${businessId}`)
      .then((res) => {
        setBusinessName(res.data.name);
        setServices(res.data.services || []);
      })
      .catch(() => Alert.alert('Hata', 'İşletme bilgileri yüklenemedi.'))
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
      });
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
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  if (success) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <LinearGradient colors={[COLORS.primaryDark, '#08224B']} style={StyleSheet.absoluteFill} />
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
          </View>
          <Text style={styles.successTitle}>Randevu Oluşturuldu!</Text>
          <Text style={styles.successText}>
            Randevu talebiniz alındı. İşletme sizinle iletişime geçecektir.
          </Text>
          <TouchableOpacity
            style={styles.successBtn}
            onPress={() => { resetForm(); router.replace('/(customer)/(tabs)/appointments'); }}
            activeOpacity={0.85}
          >
            <Text style={styles.successBtnText}>Randevularımı Gör</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.successSecondaryBtn}
            onPress={() => { resetForm(); router.back(); }}
            activeOpacity={0.85}
          >
            <Text style={styles.successSecondaryText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={[COLORS.primaryDark, '#051638']} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: insets.top + SPACE[3] }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => step > 1 ? setStep(step - 1) : router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Randevu Al</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{businessName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.stepBar}>
        {stepLabels.map((label, i) => {
          const s = i + 1;
          return (
            <React.Fragment key={s}>
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, step >= s && styles.stepCircleActive]}>
                  <Text style={[styles.stepNumber, step >= s && styles.stepNumberActive]}>{s}</Text>
                </View>
                <Text style={[styles.stepLabel, step >= s && styles.stepLabelActive]}>{label}</Text>
              </View>
              {s < stepLabels.length && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
            </React.Fragment>
          );
        })}
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Hizmet Seçin</Text>
            {services.length === 0 ? (
              <Text style={styles.emptyText}>Henüz hizmet eklenmemiş.</Text>
            ) : (
              services.map((svc) => (
                <TouchableOpacity
                  key={svc.id}
                  style={[styles.serviceCard, selectedService === svc.id && styles.serviceCardActive]}
                  onPress={() => setSelectedService(svc.id)}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceName}>{svc.name}</Text>
                    <Text style={styles.serviceDuration}>{svc.durationMinutes} dk</Text>
                  </View>
                  <Text style={[styles.servicePrice, selectedService === svc.id && styles.servicePriceActive]}>
                    ₺{svc.price.toLocaleString('tr-TR')}
                  </Text>
                  {selectedService === svc.id && (
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <View style={styles.stepTitleRow}>
              <Text style={styles.stepTitle}>Tarih Seçin</Text>
              {selectedServiceData && <Text style={styles.stepTitleSub}>{selectedServiceData.name}</Text>}
            </View>

            <View style={styles.calendarNav}>
              <TouchableOpacity onPress={prevMonth} disabled={!canMonthGoBack()} activeOpacity={0.7} style={[styles.calNavBtn, !canMonthGoBack() && { opacity: 0.3 }]}>
                <Ionicons name="chevron-back" size={18} color={COLORS.white} />
              </TouchableOpacity>
              <Text style={styles.calMonth}>{MONTHS[calendarMonth]} {calendarYear}</Text>
              <TouchableOpacity onPress={nextMonth} activeOpacity={0.7} style={styles.calNavBtn}>
                <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
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
                        isSelected && styles.calDaySelected,
                        isToday && !isSelected && styles.calDayToday,
                        hasSlots && !isPast && !isSelected && styles.calDayAvailable,
                        !hasSlots && !isPast && !isSelected && !isToday && styles.calDayUnavailable,
                      ]}
                      onPress={() => { if (!isPast && hasSlots) { setSelectedDate(dateStr); setSelectedTime(null); } }}
                      disabled={isPast || !hasSlots}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.calDayNum,
                        isPast && styles.calDayNumPast,
                        isSelected && styles.calDayNumSelected,
                        isToday && !isSelected && styles.calDayNumToday,
                      ]}>
                        {d.getDate()}
                      </Text>
                      {!isPast && hasSlots && <Text style={styles.calDayAvailableText}>Uygun</Text>}
                      {!isPast && !hasSlots && !isSelected && <Text style={styles.calDayUnavailableText}>Dolu</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <View style={styles.stepTitleRow}>
              <Text style={styles.stepTitle}>Saat Seçin</Text>
              <Text style={styles.stepTitleSub}>{selectedDate}</Text>
            </View>

            {slotsLoading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: SPACE[8] }} />
            ) : timeSlots.filter(s => s.isAvailable).length === 0 ? (
              <View style={styles.emptySlots}>
                <Text style={styles.emptyText}>Bu tarihte uygun saat bulunmamaktadır.</Text>
                <TouchableOpacity onPress={() => setStep(2)} activeOpacity={0.7}>
                  <Text style={styles.linkText}>Başka bir tarih seçin</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.timeGrid}>
                {timeSlots.filter(s => s.isAvailable).map((slot) => {
                  const timeStr = new Date(slot.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <TouchableOpacity
                      key={slot.startTime}
                      style={[styles.timeSlot, selectedTime === timeStr && styles.timeSlotActive]}
                      onPress={() => setSelectedTime(timeStr)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.timeSlotText, selectedTime === timeStr && styles.timeSlotTextActive]}>
                        {timeStr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Kişisel Bilgiler</Text>

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
                style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Randevu ile ilgili eklemek istedikleriniz..."
                placeholderTextColor={COLORS.textMuted}
                value={form.aciklama}
                onChangeText={(v) => handleFormChange('aciklama', v)}
                multiline
              />
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
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Ücret</Text>
                <Text style={styles.summaryPrice}>₺{selectedServiceData?.price.toLocaleString('tr-TR')}</Text>
              </View>
            </View>
          </View>
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
            <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.nextBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.white} />
                <Text style={styles.nextBtnText}>Randevu Oluştur</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE[5],
    paddingBottom: SPACE[3],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.white },
  headerSub: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE[5],
    paddingVertical: SPACE[4],
    gap: 0,
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: { backgroundColor: COLORS.primary },
  stepNumber: { fontSize: FONT.sm, fontWeight: FONT.bold, color: 'rgba(255,255,255,0.4)' },
  stepNumberActive: { color: COLORS.white },
  stepLabel: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.3)' },
  stepLabelActive: { color: COLORS.white },
  stepLine: { width: 30, height: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 4, marginBottom: 16 },
  stepLineActive: { backgroundColor: COLORS.primary },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[2],
    marginHorizontal: SPACE[5],
    marginBottom: SPACE[3],
    backgroundColor: 'rgba(1,84,240,0.1)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(1,84,240,0.2)',
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[3],
  },
  errorText: { fontSize: FONT.sm, color: COLORS.textSecondary, flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[8] },
  stepContent: { gap: SPACE[4] },
  stepTitle: { fontSize: FONT.lg, fontWeight: FONT.bold, color: COLORS.white },
  stepTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepTitleSub: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.5)' },
  emptyText: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginVertical: SPACE[6] },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[4],
  },
  serviceCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(1,84,240,0.08)',
  },
  serviceName: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.white },
  serviceDuration: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  servicePrice: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.primary },
  servicePriceActive: { color: COLORS.primary },
  calendarNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calMonth: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.white },
  calDayHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  calDayHeader: { fontSize: FONT.xs, fontWeight: FONT.semibold, color: 'rgba(255,255,255,0.3)', width: 40, textAlign: 'center' },
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
    gap: 2,
  },
  calDayPast: { opacity: 0.3 },
  calDaySelected: { backgroundColor: COLORS.primary },
  calDayToday: { backgroundColor: 'rgba(1,84,240,0.15)' },
  calDayAvailable: { backgroundColor: 'rgba(34,197,94,0.1)' },
  calDayUnavailable: { backgroundColor: 'rgba(255,255,255,0.03)' },
  calDayNum: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.white },
  calDayNumPast: { color: 'rgba(255,255,255,0.2)' },
  calDayNumSelected: { color: COLORS.white },
  calDayNumToday: { color: COLORS.primary },
  calDayAvailableText: { fontSize: 7, color: COLORS.success, fontWeight: FONT.semibold },
  calDayUnavailableText: { fontSize: 7, color: 'rgba(255,255,255,0.2)' },
  emptySlots: { alignItems: 'center', marginVertical: SPACE[6] },
  linkText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.primary, marginTop: SPACE[2] },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE[2],
  },
  timeSlot: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: SPACE[3],
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  timeSlotActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(1,84,240,0.1)',
  },
  timeSlotText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: 'rgba(255,255,255,0.6)' },
  timeSlotTextActive: { color: COLORS.primary },
  formRow: { flexDirection: 'row', gap: SPACE[3] },
  formField: { flex: 1, gap: SPACE[2] },
  formLabel: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: 'rgba(255,255,255,0.6)' },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[3],
    fontSize: FONT.sm,
    color: COLORS.white,
  },
  phoneWrap: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  phonePrefix: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: SPACE[3],
    paddingVertical: SPACE[3],
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.1)',
  },
  phonePrefixText: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.5)' },
  phoneInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[3],
    fontSize: FONT.sm,
    color: COLORS.white,
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: SPACE[4],
    gap: SPACE[3],
  },
  summaryTitle: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.white },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.4)' },
  summaryValue: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.white },
  summaryPrice: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.primary },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE[5],
    paddingTop: SPACE[3],
    backgroundColor: COLORS.surfaceDark,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
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
  nextBtnText: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.white },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[2],
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACE[6],
    paddingVertical: SPACE[4],
    borderRadius: RADIUS.lg,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE[8],
    gap: SPACE[4],
  },
  successIcon: { marginBottom: SPACE[2] },
  successTitle: { fontSize: FONT['2xl'], fontWeight: FONT.extrabold, color: COLORS.white, textAlign: 'center' },
  successText: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22 },
  successBtn: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACE[4],
    borderRadius: RADIUS.lg,
    marginTop: SPACE[4],
    ...SHADOW.primary,
  },
  successBtnText: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.white },
  successSecondaryBtn: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: SPACE[3],
  },
  successSecondaryText: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.4)' },
});
