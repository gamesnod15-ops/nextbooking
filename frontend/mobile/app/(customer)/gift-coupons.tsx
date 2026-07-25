import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { DotGrid } from '@/components/ui/DotGrid';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import api from '@/lib/api';

const GUEST_INFO_KEY = 'guest_customer_info';

interface MyGiftCoupon {
  id: string;
  code: string;
  amount: number;
  usedAmount: number;
  businessName: string | null;
  purchaseDate: string;
  expiryDate: string | null;
  status: 'Active' | 'Used' | 'Expired' | 0 | 1 | 2;
  message: string | null;
}

const statusMap: Record<string, { label: string; variant: any }> = {
  Active: { label: 'Aktif', variant: 'success' },
  Used: { label: 'Kullanıldı', variant: 'default' },
  Expired: { label: 'Süresi Doldu', variant: 'error' },
  '0': { label: 'Aktif', variant: 'success' },
  '1': { label: 'Kullanıldı', variant: 'default' },
  '2': { label: 'Süresi Doldu', variant: 'error' },
};

function formatCurrency(amount: number) {
  return `₺${amount.toLocaleString('tr-TR')}`;
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export default function GiftCouponsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(GUEST_INFO_KEY)
      .then((raw) => setEmail(raw ? JSON.parse(raw)?.email ?? null : null))
      .catch(() => setEmail(null));
  }, []);

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['my-gift-coupons', email],
    queryFn: async () => {
      const res = await api.get(`/giftcoupons/by-email?email=${encodeURIComponent(email!)}`);
      return Array.isArray(res.data) ? res.data as MyGiftCoupon[] : [];
    },
    enabled: !!email,
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.blobBlue} />
      <DotGrid style={styles.dotGridTopRight} rows={5} cols={4} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Hediye Kuponlarım</Text>
          <View style={styles.headerUnderline} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={coupons}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: SPACE[3] }} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="gift-outline"
              title={email ? 'Henüz kupon yok' : 'Kupon bulunamadı'}
              description={email ? 'Size gönderilen hediye kuponları burada görünecek' : 'Kuponlarınızı görmek için önce bir randevu oluşturun'}
            />
          ) : null
        }
        renderItem={({ item }) => {
          const s = statusMap[String(item.status)] ?? statusMap.Active;
          const remaining = item.amount - item.usedAmount;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.codeWrap}>
                  <Ionicons name="gift" size={16} color={COLORS.primary} />
                  <Text style={styles.code}>{item.code}</Text>
                </View>
                <Badge variant={s.variant} size="sm">{s.label}</Badge>
              </View>
              {item.businessName && <Text style={styles.businessName}>{item.businessName}</Text>}
              <View style={styles.amountRow}>
                <Text style={styles.amount}>{formatCurrency(remaining)}</Text>
                {item.usedAmount > 0 && <Text style={styles.amountTotal}>/ {formatCurrency(item.amount)}</Text>}
              </View>
              {item.message && <Text style={styles.message}>{item.message}</Text>}
              {item.expiryDate && (
                <Text style={styles.expiry}>Son kullanma: {formatDate(item.expiryDate)}</Text>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  blobBlue: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#3B82F6',
    opacity: 0.08,
  },
  dotGridTopRight: {
    position: 'absolute',
    top: 24,
    right: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACE[5], paddingVertical: SPACE[4] },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
  },
  headerTitle: { fontSize: FONT.xl, fontWeight: FONT.extrabold, color: COLORS.text, textAlign: 'center' },
  headerUnderline: { width: 36, height: 4, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, marginTop: 6, alignSelf: 'center' },
  list: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[10], flexGrow: 1 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACE[4], gap: SPACE[2], borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  code: { fontSize: FONT.base, fontWeight: FONT.extrabold, color: COLORS.text, letterSpacing: 0.5 },
  businessName: { fontSize: FONT.xs, color: COLORS.textMuted },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  amount: { fontSize: FONT.xl, fontWeight: FONT.extrabold, color: COLORS.primary },
  amountTotal: { fontSize: FONT.xs, color: COLORS.textMuted },
  message: { fontSize: FONT.sm, color: COLORS.textSecondary, fontStyle: 'italic' },
  expiry: { fontSize: FONT.xs, color: COLORS.textMuted },
});
