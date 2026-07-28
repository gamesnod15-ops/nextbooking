import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { Avatar } from '@/components/ui/Avatar';
import { SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SwipeCardDeck } from '@/components/ui/SwipeCardDeck';
import { useToast } from '@/components/ui/Toast';
import api, { fixImageUrl } from '@/lib/api';
import { getDeviceId } from '@/lib/deviceId';

interface BusinessItem {
  id: string;
  name: string;
  categoryId: number;
  categoryName: string;
  city: string | null;
  phone: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  description: string | null;
  isActive: boolean;
  averageRating: number;
  reviewCount: number;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
}

interface PaginatedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - SPACE[5] * 2;
// Leaves real breathing room above (below the category chips) and below (above
// the swipe-hint bar, now attached directly under the card) instead of the
// card stretching edge-to-edge vertically.
const CARD_HEIGHT = Math.min(SCREEN_HEIGHT * 0.58, 540);

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Kuaför & Berber': 'cut-outline',
  'Güzellik Salonu': 'sparkles-outline',
  'Spa & Masaj': 'flower-outline',
  'Tırnak Salonu': 'hand-left-outline',
  'Klinik': 'medkit-outline',
  'Diş Hekimi': 'medical-outline',
  'Fizyoterapi': 'body-outline',
  'Spor Salonu': 'barbell-outline',
  'Kişisel Antrenör': 'fitness-outline',
  'Yoga': 'leaf-outline',
  'Dövme': 'brush-outline',
  'Veteriner': 'paw-outline',
  'Oto Servis': 'car-outline',
  'Oto Yıkama': 'water-outline',
  'Tamir & Bakım': 'construct-outline',
  'Danışmanlık': 'briefcase-outline',
  'Psikolog': 'happy-outline',
  'Diyetisyen': 'nutrition-outline',
  'Özel Ders': 'book-outline',
  'Fotoğrafçı': 'camera-outline',
};

function categoryIcon(name: string): keyof typeof Ionicons.glyphMap {
  return CATEGORY_ICONS[name] ?? 'pricetag-outline';
}

function formatDistance(km: number | null): string | null {
  if (km == null) return null;
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

/** Fisher-Yates shuffle — returns a new array, never mutates the input. */
function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function BusinessesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const COLORS = useColors();
  const toast = useToast();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const [search, setSearch] = useState('');
  const [shuffleSeed, setShuffleSeed] = useState(0);

  const { data: favorites = [], refetch: refetchFavorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const deviceId = await getDeviceId();
      const res = await api.get(`/favorites/by-device?deviceId=${deviceId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
  });
  useFocusEffect(useCallback(() => { refetchFavorites(); }, [refetchFavorites]));

  // Re-shuffle the deck every time this screen regains focus (tab switch,
  // back-navigation from a business/booking screen, or the "Randevu Al"
  // shortcut on the welcome screen landing here fresh).
  useFocusEffect(useCallback(() => {
    setShuffleSeed((s) => s + 1);
  }, []));
  const favoriteIds = useMemo(() => new Set(favorites.map((f: any) => f.businessId)), [favorites]);

  const favoriteMutation = useMutation({
    mutationFn: async ({ businessId, isFavorite }: { businessId: string; isFavorite: boolean }) => {
      const deviceId = await getDeviceId();
      if (isFavorite) await api.delete(`/favorites/by-device/${businessId}?deviceId=${deviceId}`);
      else await api.post(`/favorites/by-device/${businessId}?deviceId=${deviceId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
    onError: () => toast.error('Bir şeyler ters gitti, tekrar dene.'),
  });

  const businessesQuery = useQuery({
    queryKey: ['businesses-deck', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('pageNumber', '1');
      params.set('pageSize', '100');
      const res = await api.get(`/businesses?${params.toString()}`);
      return res.data as PaginatedResult<BusinessItem>;
    },
    staleTime: 60 * 1000,
  });

  // Deck order is re-shuffled whenever the source data changes (fresh fetch,
  // pull-to-refresh, or a filter/search change) — "hep karışık listelensin".
  const deckItems = useMemo(() => {
    const items = businessesQuery.data?.items ?? [];
    return shuffle(items);
    // shuffleSeed is a deliberate re-shuffle trigger for pull-to-refresh even
    // when the underlying data hasn't changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessesQuery.data, shuffleSeed]);

  const loading = businessesQuery.isLoading;
  const error = businessesQuery.isError;

  function handleSearch(text: string) {
    setSearch(text);
  }

  function goToBooking(business: BusinessItem) {
    router.push(`/(customer)/booking/${business.id}`);
  }

  function handleSwipeRight(business: BusinessItem) {
    const isFavorite = favoriteIds.has(business.id);
    if (!isFavorite) {
      favoriteMutation.mutate({ businessId: business.id, isFavorite: false });
      toast.success(`${business.name} favorilere eklendi`);
    }
  }

  function handleSwipeLeft(_business: BusinessItem) {
    // Pass — no API call, card just leaves the deck.
  }

  function renderCard(item: BusinessItem) {
    const imageUrl = item.coverImageUrl || item.logoUrl;
    const dist = formatDistance(item.distanceKm);
    return (
      <View style={styles.card}>
        {imageUrl ? (
          <Image source={{ uri: fixImageUrl(imageUrl) }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImage, styles.cardImageFallback]}>
            <Avatar name={item.name} size={72} />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.85)']}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.cardInfo}>
          <View style={styles.cardTopRow}>
            <View style={styles.categoryPill}>
              <Ionicons name={categoryIcon(item.categoryName)} size={12} color={STATIC_WHITE} />
              <Text style={styles.categoryPillText} numberOfLines={1}>{item.categoryName}</Text>
            </View>
            {dist && (
              <View style={styles.categoryPill}>
                <Ionicons name="navigate" size={11} color={STATIC_WHITE} />
                <Text style={styles.categoryPillText}>{dist}</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.cardMetaRow}>
            {item.reviewCount > 0 ? (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FBBF24" />
                <Text style={styles.ratingText}>{item.averageRating.toFixed(1)}</Text>
                <Text style={styles.ratingCount}>({item.reviewCount})</Text>
              </View>
            ) : (
              <Text style={styles.ratingCount}>Yeni işletme</Text>
            )}
            {item.city ? (
              <View style={styles.cityRow}>
                <Ionicons name="location" size={13} color="rgba(255,255,255,0.85)" />
                <Text style={styles.cityText} numberOfLines={1}>{item.city}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={[COLORS.primaryDark, '#08224B']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerTop}>
          <Text style={styles.greet}>İşletmeler</Text>
          <Text style={styles.heroTitle}>Keşfedin</Text>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="İşletme adı veya kategori ara..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={handleSearch}
            accessibilityLabel="İşletme ara"
          />
          {search ? (
            <TouchableOpacity onPress={() => handleSearch('')} accessibilityRole="button" accessibilityLabel="Aramayı temizle">
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      <View style={[styles.deckArea, { paddingBottom: insets.bottom + SPACE[3] }]}>
        {loading ? (
          <View style={{ paddingHorizontal: SPACE[5], width: '100%' }}>
            <SkeletonList variant="card" count={1} />
          </View>
        ) : error ? (
          <EmptyState
            icon="alert-circle-outline"
            title="İşletmeler yüklenirken bir hata oluştu."
            action={
              <TouchableOpacity style={styles.retryBtn} onPress={() => businessesQuery.refetch()} activeOpacity={0.8}>
                <Text style={styles.retryBtnText}>Tekrar Dene</Text>
              </TouchableOpacity>
            }
          />
        ) : (
          <View style={styles.cardBox}>
            <SwipeCardDeck<BusinessItem>
              data={deckItems}
              keyExtractor={(item) => item.id}
              renderCard={renderCard}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onTap={goToBooking}
              cardWidth={CARD_WIDTH}
              cardHeight={CARD_HEIGHT}
              onEmpty={() => <EmptyState icon="business-outline" title="İşletme bulunamadı." />}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[5], gap: SPACE[4], borderBottomLeftRadius: RADIUS['2xl'], borderBottomRightRadius: RADIUS['2xl'], overflow: 'hidden' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACE[4] },
  greet: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.5)' },
  heroTitle: { fontSize: FONT['2xl'], fontWeight: FONT.extrabold, color: STATIC_WHITE },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACE[4],
    gap: SPACE[2],
    height: 48,
  },
  searchInput: { flex: 1, fontSize: FONT.base, color: COLORS.text },

  deckArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: SPACE[4] },
  cardBox: { width: CARD_WIDTH, height: CARD_HEIGHT },

  card: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: RADIUS['2xl'],
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW.lg,
  },
  cardImage: { ...StyleSheet.absoluteFill },
  cardImageFallback: { backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  cardGradient: { ...StyleSheet.absoluteFill },
  cardInfo: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACE[5],
    paddingTop: SPACE[5],
    paddingBottom: SPACE[6],
    gap: SPACE[3],
  },
  cardTopRow: { flexDirection: 'row', gap: SPACE[2], marginBottom: SPACE[1] },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  categoryPillText: { fontSize: FONT.xs, fontWeight: FONT.semibold, color: STATIC_WHITE },
  cardName: { fontSize: FONT.xl, fontWeight: FONT.extrabold, color: STATIC_WHITE },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[2] },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: FONT.sm, fontWeight: FONT.bold, color: STATIC_WHITE },
  ratingCount: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.75)' },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 1 },
  cityText: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.85)', flexShrink: 1 },

  retryBtn: {
    paddingHorizontal: SPACE[5],
    paddingVertical: SPACE[3],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
  },
  retryBtnText: { fontSize: FONT.sm, fontWeight: FONT.bold, color: STATIC_WHITE },
});
