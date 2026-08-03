import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { PatternOverlay } from '@/components/ui/PatternOverlay';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import api from '@/lib/api';

/** Plan ids must match the backend's ChangePlanCommand validator:
 *  starter | business | professional | custom. */
const PLANS = [
  {
    id: 'starter', name: 'Starter', priceLabel: '₺299', period: '/ay',
    features: ['Temel randevu, takvim ve müşteri yönetimi', 'Ödeme takibi ve temel raporlar', 'Formlar ve paket satışı', 'Tek şube ile hızlı başlangıç'],
    isPopular: false,
  },
  {
    id: 'business', name: 'Business', priceLabel: '₺599', period: '/ay',
    features: ['Kampanya, kupon ve indirim yönetimi', 'Online rezervasyon ve bekleme listesi', 'Sadakat programı ve yorum toplama', 'Çoklu şube yönetimi'],
    isPopular: true,
  },
  {
    id: 'professional', name: 'Professional', priceLabel: '₺999', period: '/ay',
    features: ['Ürün satışı ve stok yönetimi', 'Cari alacak ve taksit takibi', 'Personel performans takibi', 'Gelişmiş analitik & raporlar'],
    isPopular: false,
  },
  {
    id: 'custom', name: 'Kurumsal', priceLabel: 'Özel fiyat', period: '',
    features: ['Tüm Professional özellikleri', 'Canlı chatbot ve sıra yönetimi', 'Özel entegrasyon ve onboarding', 'SLA garantisi & 7/24 destek'],
    isPopular: false,
  },
];

/** Relative ranking of the fixed-price, self-service plans, used to detect
 *  downgrades. 'custom' is deliberately excluded — it has no fixed price and
 *  is handled via a "Bize Ulaşın" contact flow instead of self-service. */
const PLAN_TIER: Record<string, number> = { starter: 1, business: 2, professional: 3 };

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const toast = useToast();
  const qc = useQueryClient();
  const { data: sub, refetch, isRefetching } = useQuery({
    queryKey: ['my-subscription'],
    // There is no GET /business/me/plan endpoint — plan info lives on /business/me
    queryFn: async () => { const res = await api.get('/business/me'); return res.data; },
  });
  const currentPlanId = sub?.plan;
  const currentPlan = PLANS.find(p => p.id === currentPlanId);
  const nextBilling = sub?.subscriptionEndsAt
    ? new Date(sub.subscriptionEndsAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : undefined;

  // Matches PATCH /business/me/plan -> ChangePlanCommand(string Plan, int Months = 1)
  const changePlanMutation = useMutation({
    mutationFn: (planId: string) => api.patch('/business/me/plan', { plan: planId, months: 1 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-subscription'] }); toast.success('Plan güncellendi.'); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Plan güncellenemedi.'),
  });

  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const handleSelectPlan = (planId: string, planName: string) => {
    const isDowngrade =
      currentPlanId != null &&
      PLAN_TIER[currentPlanId] != null &&
      PLAN_TIER[planId] != null &&
      PLAN_TIER[planId] < PLAN_TIER[currentPlanId];

    Alert.alert(
      'Planı Değiştir',
      isDowngrade
        ? `${planName} planına geçmek istediğinize emin misiniz? Daha düşük plana geçtiğinizde, mevcut planınıza özel bazı özelliklere (ör. çoklu şube, kampanya/kupon yönetimi, gelişmiş raporlar) erişiminizi kaybedebilirsiniz.`
        : `${planName} planına geçmek istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Ödemeye Git', style: 'default', onPress: async () => {
          try {
            const res = await api.post<{ url: string }>('/payment/create-checkout-session', { plan: planId, months: 1 });
            const url = res.data.url;
            if (url) {
              await Linking.openURL(url);
            } else {
              toast.error('Ödeme sayfası açılamadı.');
            }
          } catch {
            toast.error('Ödeme başlatılamadı.');
          }
        }},
      ],
    );
  };

  // 'custom' (Kurumsal) has no fixed price and requires negotiated pricing —
  // it must not be self-service-selectable via ChangePlanCommand like the
  // other three plans. Route it to a sales contact instead.
  const handleContactSales = () => {
    const subject = encodeURIComponent('Kurumsal Plan Talebi');
    const body = encodeURIComponent(
      `Merhaba,\n\nKurumsal (özel fiyatlandırma) plana geçmek istiyorum. Lütfen benimle iletişime geçin.\n\nİşletme mevcut plan: ${currentPlan?.name ?? currentPlanId ?? '-'}`
    );
    Linking.openURL(`mailto:destek@jetrandevu.com?subject=${subject}&body=${body}`).catch(() =>
      toast.error('E-posta uygulaması açılamadı.')
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <PatternOverlay opacity={0.25} />
      <ScreenHeader title="Abonelik" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}>
        {/* Current Plan Banner */}
        <LinearGradient colors={[COLORS.primaryDark, '#8A4A3F']} style={styles.currentBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <PatternOverlay />
          <View style={styles.currentLeft}>
            <Text style={styles.currentLabel}>Mevcut Plan</Text>
            <Text style={styles.currentPlan}>{currentPlan?.name ?? (currentPlanId ? currentPlanId : 'Yükleniyor...')}</Text>
            {nextBilling && <Text style={styles.currentBilling}>Sonraki ödeme: {nextBilling}</Text>}
          </View>
          <View style={styles.currentRight}>
            <Text style={styles.currentPrice}>{currentPlan?.priceLabel ?? '—'}</Text>
            <Text style={styles.currentPeriod}>{currentPlan?.period}</Text>
          </View>
        </LinearGradient>

        {/* Plans */}
        <Text style={styles.sectionTitle}>Tüm Planlar</Text>
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          return (
            <View key={plan.id} style={[styles.planCard, isCurrent && styles.planCardCurrent, plan.isPopular && styles.planCardPopular]}>
              {plan.isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>En Popüler</Text>
                </View>
              )}
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.planPrice, plan.isPopular && { color: COLORS.primaryDark }]}>{plan.priceLabel}</Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>
              </View>
              <View style={styles.featureList}>
                {plan.features.map((f) => (
                  <View key={f} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={plan.isPopular ? COLORS.primaryDark : COLORS.success} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.planBtn, isCurrent ? styles.planBtnCurrent : plan.isPopular ? styles.planBtnPopular : styles.planBtnDefault]}
                disabled={isCurrent || (plan.id !== 'custom' && changePlanMutation.isPending)}
                activeOpacity={0.85}
                onPress={() => (plan.id === 'custom' ? handleContactSales() : handleSelectPlan(plan.id, plan.name))}
              >
                <Text style={[styles.planBtnText, isCurrent ? styles.planBtnTextCurrent : plan.isPopular ? styles.planBtnTextPopular : styles.planBtnTextDefault]}>
                  {isCurrent ? 'Mevcut Plan' : plan.id === 'custom' ? 'Bize Ulaşın' : 'Planı Seç'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Invoice section */}
        <Text style={styles.sectionTitle}>Son Faturalar</Text>
        <EmptyState icon="document-text-outline" title="Fatura bulunamadı" description="Faturalarınız burada görünecek." />
      </ScrollView>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  currentBanner: { marginHorizontal: SPACE[5], marginTop: SPACE[4], borderRadius: RADIUS.xl, padding: SPACE[6], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  currentLeft: { gap: 4 },
  currentLabel: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.5)', fontWeight: FONT.medium },
  currentPlan: { fontSize: FONT.xl, fontWeight: FONT.extrabold, color: STATIC_WHITE },
  currentBilling: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.5)' },
  currentRight: { flexDirection: 'row', alignItems: 'flex-end' },
  currentPrice: { fontSize: FONT['3xl'], fontWeight: FONT.extrabold, color: COLORS.primary },
  currentPeriod: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  sectionTitle: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text, paddingHorizontal: SPACE[5], marginTop: SPACE[5], marginBottom: SPACE[3] },
  planCard: { marginHorizontal: SPACE[5], marginBottom: SPACE[3], backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[5], gap: SPACE[4], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  planCardCurrent: { borderColor: COLORS.primary, borderWidth: 2 },
  planCardPopular: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary, borderWidth: 2 },
  popularBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADIUS.full, alignSelf: 'flex-start' },
  popularBadgeText: { fontSize: FONT.xs, fontWeight: FONT.bold, color: STATIC_WHITE },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  planName: { fontSize: FONT.lg, fontWeight: FONT.bold, color: COLORS.text },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end' },
  planPrice: { fontSize: FONT['2xl'], fontWeight: FONT.extrabold, color: COLORS.text },
  planPeriod: { fontSize: FONT.xs, color: COLORS.textMuted, marginBottom: 3, marginLeft: 2 },
  featureList: { gap: SPACE[2] },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3] },
  featureText: { fontSize: FONT.sm, color: COLORS.text },
  planBtn: { borderRadius: RADIUS.xl, padding: SPACE[4], alignItems: 'center' },
  planBtnDefault: { backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.borderLight },
  planBtnCurrent: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.primary },
  planBtnPopular: { backgroundColor: COLORS.black },
  planBtnText: { fontSize: FONT.base, fontWeight: FONT.bold },
  planBtnTextDefault: { color: COLORS.text },
  planBtnTextCurrent: { color: COLORS.primaryDark },
  planBtnTextPopular: { color: COLORS.primary },
  invoiceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], backgroundColor: COLORS.surface, marginHorizontal: SPACE[5], marginBottom: SPACE[2], borderRadius: RADIUS.xl, padding: SPACE[4], borderWidth: 1, borderColor: COLORS.borderLight },
  invoiceText: { flex: 1, fontSize: FONT.sm, color: COLORS.text },
});

