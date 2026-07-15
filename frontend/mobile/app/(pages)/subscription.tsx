import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import api from '@/lib/api';

const PLANS = [
  {
    id: 'starter', name: 'Starter', price: 299, period: '/ay',
    features: ['1 Şube', '3 Personel', 'Temel Randevu', 'E-posta Bildirimi'],
    isPopular: false,
  },
  {
    id: 'professional', name: 'Professional', price: 599, period: '/ay',
    features: ['3 Şube', '10 Personel', 'WhatsApp Bot', 'Sadakat Programı', 'Raporlar', 'SMS Bildirimi'],
    isPopular: true,
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 1299, period: '/ay',
    features: ['Sınırsız Şube', 'Sınırsız Personel', 'AI Chatbot', 'Özel Entegrasyon', 'Öncelikli Destek', 'White Label'],
    isPopular: false,
  },
];

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const { data: sub, refetch, isRefetching } = useQuery({
    queryKey: ['my-subscription'],
    // There is no GET /business/me/plan endpoint — plan info lives on /business/me
    queryFn: async () => { const res = await api.get('/business/me'); return res.data; },
  });
  const currentPlanId = sub?.plan;
  const nextBilling = sub?.subscriptionEndsAt
    ? new Date(sub.subscriptionEndsAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : undefined;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Abonelik" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}>
        {/* Current Plan Banner */}
        <LinearGradient colors={[COLORS.black, '#1A1A1A']} style={styles.currentBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.currentLeft}>
            <Text style={styles.currentLabel}>Mevcut Plan</Text>
            <Text style={styles.currentPlan}>{currentPlanId ? (PLANS.find(p => p.id === currentPlanId)?.name ?? 'Professional') : 'Yükleniyor...'}</Text>
            {nextBilling && <Text style={styles.currentBilling}>Sonraki ödeme: {nextBilling}</Text>}
          </View>
          <View style={styles.currentRight}>
            <Text style={styles.currentPrice}>₺{currentPlanId ? (PLANS.find(p => p.id === currentPlanId)?.price ?? '—') : '—'}</Text>
            <Text style={styles.currentPeriod}>/ay</Text>
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
                  <Text style={[styles.planPrice, plan.isPopular && { color: COLORS.primaryDark }]}>₺{plan.price}</Text>
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
                disabled={isCurrent}
                activeOpacity={0.85}
              >
                <Text style={[styles.planBtnText, isCurrent ? styles.planBtnTextCurrent : plan.isPopular ? styles.planBtnTextPopular : styles.planBtnTextDefault]}>
                  {isCurrent ? 'Mevcut Plan' : 'Planı Seç'}
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  currentBanner: { marginHorizontal: SPACE[5], marginTop: SPACE[4], borderRadius: RADIUS.xl, padding: SPACE[6], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  currentLeft: { gap: 4 },
  currentLabel: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.5)', fontWeight: FONT.medium },
  currentPlan: { fontSize: FONT.xl, fontWeight: FONT.extrabold, color: COLORS.white },
  currentBilling: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.5)' },
  currentRight: { flexDirection: 'row', alignItems: 'flex-end' },
  currentPrice: { fontSize: FONT['3xl'], fontWeight: FONT.extrabold, color: COLORS.primary },
  currentPeriod: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  sectionTitle: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text, paddingHorizontal: SPACE[5], marginTop: SPACE[5], marginBottom: SPACE[3] },
  planCard: { marginHorizontal: SPACE[5], marginBottom: SPACE[3], backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[5], gap: SPACE[4], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  planCardCurrent: { borderColor: COLORS.primary, borderWidth: 2 },
  planCardPopular: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary, borderWidth: 2 },
  popularBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADIUS.full, alignSelf: 'flex-start' },
  popularBadgeText: { fontSize: FONT.xs, fontWeight: FONT.bold, color: COLORS.black },
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

